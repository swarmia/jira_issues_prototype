/**
 * Assembles `materialized_swarmia_issues` rows.
 *
 * Upstream every field here is a materialized column, computed by a background
 * refresh and stored. This prototype computes on read, and splits the work the
 * way the two languages are each good at:
 *
 *   in SQL   the set-shaped derivation — the hierarchy (recursive CTEs) and the
 *            current status of an issue (the `issue_current_status` view), which
 *            the status tally is then a GROUP BY over
 *   in here  the time-shaped derivation — merging ranges, counting business
 *            days, rolling up effort — which SQLite expresses badly
 *
 * Work is done per subtree rather than per issue. Deriving one issue needs its
 * whole subtree anyway (descendants for the tally, their activity for flow
 * efficiency), so one pass over a subtree costs a fixed seven queries no matter
 * how deep it goes, where per-issue loading would be an N+1.
 */

import {
  getActivityForIssues,
  getAncestorIds,
  getDescendantIds,
  getDescendantStatusCounts,
  getEffortDailyForIssues,
  getInstallations,
  getIssuesByIds,
  getStatusPeriodsForIssues,
} from '../data/repository.js';
import type {
  DescendantStatusCounts,
  IssueRecord,
  IssueSourceInstallationRecord,
  IssueStatus,
} from '../data/types.js';
import { inProgressPeriodsOf } from './cycleTime.js';
import { DAY_MS, startOfDay } from './dates.js';
import {
  activityByDate,
  calculateIssueStatistics,
  extendDateRangeWithLifecycle,
  type IssueActivityStatistics,
} from './flowEfficiency.js';
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

/** Effort rows on the issue or any descendant — the ancestor-chain attribution. */
export function effortRowsFor(descendantIssueIds: readonly string[]) {
  return getEffortDailyForIssues(descendantIssueIds);
}

// --- helpers -----------------------------------------------------------------

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

function groupBy<T, K>(rows: readonly T[], key: (row: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const row of rows) {
    const existing = map.get(key(row)) ?? [];
    existing.push(row);
    map.set(key(row), existing);
  }
  return map;
}

// --- materialization ---------------------------------------------------------

/**
 * Derive the given issues and everything under them, in one pass.
 *
 * Eight queries, whatever the roots' number or depth: the roots' subtrees, the
 * rows, each node's descendant and ancestor arrays, the status tally, the status
 * periods, the activity, and the installations. Taking a list of roots rather
 * than one is what keeps the issue list from being an N+1 — it derives 40 issues
 * across 5 subtrees in the same 8 queries a single issue costs.
 */
export function materializeSubtrees(
  rootIds: readonly string[],
  now: Date,
): Map<string, MaterializedIssue> {
  if (rootIds.length === 0) return new Map();

  // The roots' own subtrees, unioned: everything that needs deriving.
  const subtreeIds = [...new Set([...getDescendantIds(rootIds).values()].flat())];
  if (subtreeIds.length === 0) return new Map();

  const records = new Map(getIssuesByIds(subtreeIds).map(issue => [issue.id, issue]));
  // Re-asked for every node, not just the roots: an inner node's own tally and
  // activity window cover only its own subtree.
  const descendantIds = getDescendantIds(subtreeIds);
  const ancestorIds = getAncestorIds(subtreeIds);
  const statusCounts = getDescendantStatusCounts(subtreeIds);
  const periodsByIssue = groupBy(getStatusPeriodsForIssues(subtreeIds), row => row.issueId);
  const activityByIssue = groupBy(getActivityForIssues(subtreeIds), row => row.issueId);

  const installations = new Map<string, IssueSourceInstallationRecord>(
    getInstallations().map(installation => [installation.id, installation]),
  );
  const installationOf = (id: string) => {
    const found = installations.get(id);
    if (!found) throw new Error(`Unknown installation: ${id}`);
    return found;
  };

  // First pass: status periods and the current status of every node. The second
  // pass needs children's statuses, to keep won't-do children out of the
  // scope-creep ratio.
  const periodsById = new Map<string, StatusPeriod[]>();
  const statusById = new Map<string, IssueStatus | null>();
  for (const id of subtreeIds) {
    const record = records.get(id);
    if (!record) continue;
    const periods = toStatusPeriods(
      periodsByIssue.get(id) ?? [],
      installationOf(record.installationId),
    );
    periodsById.set(id, periods);
    const latest = currentStatusPeriod(periods) ?? periods[periods.length - 1];
    statusById.set(id, latest?.status ?? null);
  }

  const materialized = new Map<string, MaterializedIssue>();

  for (const id of subtreeIds) {
    const record = records.get(id);
    if (!record) continue;

    const statusPeriods = periodsById.get(id) ?? [];
    const current = currentStatusPeriod(statusPeriods);
    const lastPeriod = statusPeriods[statusPeriods.length - 1];

    const inProgressPeriods = inProgressPeriodsOf(statusPeriods);
    const startedAt = lowerBound(inProgressPeriods);
    const completedAt = completedAtOf(statusPeriods);

    const ownDescendants = descendantIds.get(id) ?? [id];
    const descendantActivity = ownDescendants
      .flatMap(descendantId => activityByIssue.get(descendantId) ?? [])
      .map(row => new Date(row.timestamp))
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

    const children = subtreeIds
      .map(candidate => records.get(candidate))
      .filter((child): child is IssueRecord => child?.parentIssueId === id);

    materialized.set(id, {
      record,
      statusPeriods,
      sourceIssueStatus: (current ?? lastPeriod)?.sourceStatus ?? null,
      status: statusById.get(id) ?? null,
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
      ancestorIssueIds: ancestorIds.get(id) ?? [],
      descendantIssueIds: ownDescendants,
      isLeafIssue: ownDescendants.length === 1,
      descendantStatusCounts: statusCounts.get(id) ?? {
        TODO: 0,
        IN_PROGRESS: 0,
        DONE: 0,
        WONT_DO: 0,
      },
      // Won't-do children are excluded from the scope-creep ratio.
      scopeCreep: computeScopeCreep({
        startedAt,
        childCreatedAts: children
          .filter(child => statusById.get(child.id) !== 'WONT_DO')
          .map(child => new Date(child.sourceCreatedAt)),
      }),
    });
  }

  return materialized;
}
