/**
 * Assembles one `materialized_swarmia_issues` row.
 *
 * Every field here is a materialized column upstream — computed by a background
 * refresh and stored. This prototype recomputes on read, which keeps the
 * derivation visible; the trade-off is that `now` must be threaded through so a
 * single request sees one consistent clock.
 */

import {
  activities,
  effortDaily,
  findInstallation,
  issues,
  issueStatusPeriods,
  type ActivityRecord,
  type EffortDailyRecord,
  type IssueRecord,
  type IssueStatus,
  type IssueStatusPeriodRecord,
} from '../data/store.js';
import { inProgressPeriodsOf } from './cycleTime.js';
import { DAY_MS, startOfDay } from './dates.js';
import {
  activityByDate,
  calculateIssueStatistics,
  extendDateRangeWithLifecycle,
  type IssueActivityStatistics,
} from './flowEfficiency.js';
import {
  ancestorIdsOf,
  countStatuses,
  descendantIdsOf,
  type DescendantStatusCounts,
} from './hierarchy.js';
import {
  hasOpenRange,
  lowerBound,
  totalSeconds,
  upperBound,
  type TimestampMultirange,
} from './ranges.js';
import { computeScopeCreep, type ScopeCreep } from './scopeCreep.js';
import { currentStatusPeriod, toStatusPeriods, type StatusPeriod } from './status.js';

export interface MaterializedIssue {
  record: IssueRecord;
  statusPeriods: StatusPeriod[];

  /** Raw tracker status right now — the source status of the open period. */
  sourceIssueStatus: string | null;
  /** Swarmia status right now. Null when the source status is unmapped. */
  status: IssueStatus | null;

  inProgressPeriods: TimestampMultirange;
  startedAt: Date | null;
  completedAt: Date | null;
  finalStatusAt: Date | null;

  /** Null when the issue has never been in progress — never 0. */
  inProgressTimeSeconds: number | null;
  ageSeconds: number;
  lifetimeSeconds: number;
  /** 0..100, matching the upstream percentage-typed property. */
  flowEfficiency: number;
  activityStatistics: IssueActivityStatistics;

  ancestorIssueIds: string[];
  /** The subtree, this issue included. */
  descendantIssueIds: string[];
  isLeafIssue: boolean;
  descendantStatusCounts: DescendantStatusCounts;
  scopeCreep: ScopeCreep;
}

// --- indexes -----------------------------------------------------------------

let indexed: {
  byId: Map<string, IssueRecord>;
  childrenByParent: Map<string, IssueRecord[]>;
  periodsByIssue: Map<string, IssueStatusPeriodRecord[]>;
  activitiesByIssue: Map<string, ActivityRecord[]>;
  effortByIssue: Map<string, EffortDailyRecord[]>;
} | null = null;

function indexes() {
  if (indexed) return indexed;

  const byId = new Map(issues.map(issue => [issue.id, issue]));
  const childrenByParent = new Map<string, IssueRecord[]>();
  for (const issue of issues) {
    if (!issue.parentIssueId) continue;
    const siblings = childrenByParent.get(issue.parentIssueId) ?? [];
    siblings.push(issue);
    childrenByParent.set(issue.parentIssueId, siblings);
  }

  const groupBy = <T extends { issueId: string }>(rows: readonly T[]) => {
    const map = new Map<string, T[]>();
    for (const row of rows) {
      const existing = map.get(row.issueId) ?? [];
      existing.push(row);
      map.set(row.issueId, existing);
    }
    return map;
  };

  indexed = {
    byId,
    childrenByParent,
    periodsByIssue: groupBy(issueStatusPeriods),
    activitiesByIssue: groupBy(activities),
    effortByIssue: groupBy(effortDaily),
  };
  return indexed;
}

export function childrenOfIssue(issueId: string): IssueRecord[] {
  return indexes().childrenByParent.get(issueId) ?? [];
}

/** Effort rows on the issue or any descendant — the ancestor-chain attribution. */
export function effortRowsFor(descendantIssueIds: readonly string[]): EffortDailyRecord[] {
  const { effortByIssue } = indexes();
  return descendantIssueIds.flatMap(id => effortByIssue.get(id) ?? []);
}

// --- derivation --------------------------------------------------------------

/** SQL LEAST/GREATEST semantics: nulls are skipped rather than poisoning. */
function leastDefined(...dates: (Date | null)[]): Date | null {
  const defined = dates.filter((date): date is Date => date !== null);
  return defined.length === 0
    ? null
    : new Date(Math.min(...defined.map(date => date.getTime())));
}

function greatestDefined(...dates: (Date | null)[]): Date | null {
  const defined = dates.filter((date): date is Date => date !== null);
  return defined.length === 0
    ? null
    : new Date(Math.max(...defined.map(date => date.getTime())));
}

/**
 * When the issue reached the DONE status it currently sits in. Walking back over
 * a run of done periods keeps the original completion date across a later
 * Done -> Closed move. Won't-do is terminal but is NOT a completion.
 */
function completedAtOf(periods: readonly StatusPeriod[]): Date | null {
  const current = periods[periods.length - 1];
  if (!current || current.status !== 'DONE') return null;

  let index = periods.length - 1;
  while (index > 0 && periods[index - 1]!.status === 'DONE') index -= 1;
  return periods[index]!.period.start;
}

export function materializeIssue(record: IssueRecord, now: Date): MaterializedIssue {
  const { byId, childrenByParent, periodsByIssue, activitiesByIssue } = indexes();
  const installation = findInstallation(record.installationId);

  const statusPeriods = toStatusPeriods(periodsByIssue.get(record.id) ?? [], installation);
  const current = currentStatusPeriod(statusPeriods);
  const lastPeriod = statusPeriods[statusPeriods.length - 1];

  const inProgressPeriods = inProgressPeriodsOf(statusPeriods);
  const startedAt = lowerBound(inProgressPeriods);
  const completedAt = completedAtOf(statusPeriods);

  const descendantIssueIds = descendantIdsOf(record, childrenByParent);
  const descendantActivity = descendantIssueIds
    .flatMap(id => activitiesByIssue.get(id) ?? [])
    .map(activity => new Date(activity.timestamp))
    .sort((a, b) => a.getTime() - b.getTime());

  // Flow efficiency: the activity window widened to cover the in-progress
  // lifecycle, then counted in days.
  const lifecycleEndedAt = hasOpenRange(inProgressPeriods)
    ? null
    : upperBound(inProgressPeriods);
  const window = extendDateRangeWithLifecycle({
    firstActivityDate: descendantActivity[0] ?? null,
    lastActivityDate: descendantActivity[descendantActivity.length - 1] ?? null,
    lifecycleStartedAt: startedAt,
    lifecycleEndedAt,
    now,
  });
  const activityStatistics = calculateIssueStatistics(
    activityByDate({
      activityTimestamps: descendantActivity,
      windowStart: window.firstActivityDate,
      windowEnd: window.lastActivityDate,
    }),
  );

  // Lifetime: the inclusive day span covering both the activity window and the
  // in-progress periods, floored at one day.
  const lifetimeStart = leastDefined(startedAt, descendantActivity[0] ?? null);
  const lifetimeEnd = greatestDefined(
    hasOpenRange(inProgressPeriods) ? now : upperBound(inProgressPeriods),
    descendantActivity[descendantActivity.length - 1] ?? null,
  );
  const lifetimeSeconds =
    lifetimeStart === null || lifetimeEnd === null
      ? 0
      : Math.max(
          Math.round(
            (startOfDay(lifetimeEnd).getTime() - startOfDay(lifetimeStart).getTime()) / DAY_MS,
          ) + 1,
          1,
        ) * 86_400;

  const inProgressSeconds = totalSeconds(inProgressPeriods, now);

  const children = childrenByParent.get(record.id) ?? [];
  const childStatuses = new Map(
    children.map(child => [
      child.id,
      currentStatusPeriod(toStatusPeriods(periodsByIssue.get(child.id) ?? [], installation))
        ?.status ?? null,
    ]),
  );

  return {
    record,
    statusPeriods,
    sourceIssueStatus: (current ?? lastPeriod)?.sourceStatus ?? null,
    status: (current ?? lastPeriod)?.status ?? null,
    inProgressPeriods,
    startedAt,
    completedAt,
    finalStatusAt: lastPeriod?.period.start ?? null,
    // NULLIF(..., 0): never been in progress reads as null, not zero.
    inProgressTimeSeconds: inProgressSeconds === 0 ? null : inProgressSeconds,
    ageSeconds: Math.trunc(
      ((completedAt ?? now).getTime() - new Date(record.sourceCreatedAt).getTime()) / 1000,
    ),
    lifetimeSeconds,
    flowEfficiency: activityStatistics.efficiency * 100,
    activityStatistics,
    ancestorIssueIds: ancestorIdsOf(record, byId),
    descendantIssueIds,
    isLeafIssue: descendantIssueIds.length === 1,
    descendantStatusCounts: countStatuses(
      descendantIssueIds.map(id => {
        const issue = byId.get(id);
        if (!issue) return null;
        return currentStatusPeriod(
          toStatusPeriods(periodsByIssue.get(id) ?? [], findInstallation(issue.installationId)),
        )?.status ?? null;
      }),
    ),
    // Won't-do children are excluded from the scope-creep ratio.
    scopeCreep: computeScopeCreep({
      startedAt,
      childCreatedAts: children
        .filter(child => childStatuses.get(child.id) !== 'WONT_DO')
        .map(child => new Date(child.sourceCreatedAt)),
    }),
  };
}
