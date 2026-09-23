/**
 * IssueStatusTransition: one row per issue and ordered pair of source statuses
 * the issue moved between directly, with how many times it made that move.
 *
 * This is an aggregate, not an event log — an issue that bounced In Progress ->
 * In Review -> In Progress -> In Review produces one row with occurrences 2, and
 * `timestamp` is when the transition was FIRST made. Upstream it is a stored
 * table built from the Jira changelog (Jira only); here it is folded from the
 * status periods, which come from the same changelog.
 *
 * For a per-move feed, read the status periods instead.
 */

import type { StatusPeriod } from './status.js';

export interface StatusTransition {
  id: string;
  fromSourceStatus: string;
  toSourceStatus: string;
  occurrences: number;
  timestamp: Date;
}

export function statusTransitionsOf(periods: readonly StatusPeriod[]): StatusTransition[] {
  const byPair = new Map<string, StatusTransition>();

  for (let index = 1; index < periods.length; index++) {
    const from = periods[index - 1]!;
    const to = periods[index]!;
    const id = `${from.sourceStatus}->${to.sourceStatus}`;

    const existing = byPair.get(id);
    if (existing) {
      existing.occurrences += 1;
      // Keep the earliest: `timestamp` is when the transition was first made.
      if (to.period.start < existing.timestamp) existing.timestamp = to.period.start;
    } else {
      byPair.set(id, {
        id,
        fromSourceStatus: from.sourceStatus,
        toSourceStatus: to.sourceStatus,
        occurrences: 1,
        timestamp: to.period.start,
      });
    }
  }

  return [...byPair.values()].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}
