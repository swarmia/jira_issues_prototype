/**
 * Source status -> Swarmia status, the mapping configured per installation.
 *
 * A source status nobody mapped resolves to null rather than throwing. That is
 * the upstream behaviour ("Empty when the source status has no Swarmia status
 * mapping" on IssueStatusPeriod.status), and it matters: an unmapped status
 * still shows in the timeline with its real duration, but contributes to no
 * cycle-time or flow-efficiency figure.
 */

import type {
  IssueSourceInstallationRecord,
  IssueStatus,
  IssueStatusPeriodRecord,
} from '../data/types.js';
import type { TimestampRange } from './ranges.js';

export interface StatusPeriod {
  id: string;
  sourceStatus: string;
  /** Null when the source status is not mapped in this installation. */
  status: IssueStatus | null;
  period: TimestampRange;
  authorId: string;
}

export function swarmiaStatusOf(
  installation: IssueSourceInstallationRecord,
  sourceStatus: string,
): IssueStatus | null {
  return installation.statusMapping[sourceStatus] ?? null;
}

export function toStatusPeriods(
  records: readonly IssueStatusPeriodRecord[],
  installation: IssueSourceInstallationRecord,
): StatusPeriod[] {
  return records
    .map(record => ({
      id: record.id,
      sourceStatus: record.sourceStatus,
      status: swarmiaStatusOf(installation, record.sourceStatus),
      period: {
        start: new Date(record.startedAt),
        end: record.endedAt ? new Date(record.endedAt) : null,
      },
      authorId: record.authorId,
    }))
    .sort((a, b) => a.period.start.getTime() - b.period.start.getTime());
}

/** The period the issue is in right now: the one left open. */
export function currentStatusPeriod(periods: readonly StatusPeriod[]): StatusPeriod | null {
  return periods.find(period => period.period.end === null) ?? null;
}
