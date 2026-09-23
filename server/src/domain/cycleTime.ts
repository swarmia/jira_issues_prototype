/**
 * The `cycleTime` materialized column group: `inProgressPeriods`.
 *
 * Upstream this is a `tstzmultirange` on materialized_swarmia_issues, built from
 * the status periods that map to IN_PROGRESS. Consecutive in-progress statuses
 * (In Progress -> In Review -> Blocked) merge into one period, so an issue that
 * moves between them without leaving In progress has a single continuous span.
 */

import { mergeRanges, type TimestampMultirange } from './ranges.js';
import type { StatusPeriod } from './status.js';

export function inProgressPeriodsOf(periods: readonly StatusPeriod[]): TimestampMultirange {
  return mergeRanges(
    periods.filter(period => period.status === 'IN_PROGRESS').map(period => period.period),
  );
}
