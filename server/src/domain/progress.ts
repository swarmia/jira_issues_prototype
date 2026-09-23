/**
 * Child-issue progress and the burn-up series.
 *
 * Prototype-only: rapu has no burn-up column. It is derived here rather than
 * stored (the previous model kept a hand-written series that nothing reconciled
 * against the issue's actual children), so scope and completion always agree
 * with the hierarchy.
 *
 * Scope counts children created up to each date; completion counts those that
 * reached DONE by it. Won't-do children leave scope entirely — they are neither
 * outstanding work nor completed work.
 */

import type { MaterializedIssue } from './issue.js';

export interface BurnupPoint {
  date: Date;
  scope: number;
  completed: number;
}

export interface Progress {
  completed: number;
  total: number;
  /** 0..1. Zero when there are no children to measure. */
  percent: number;
  burnup: BurnupPoint[];
}

export function progressOf(children: readonly MaterializedIssue[]): Progress {
  const counted = children.filter(child => child.status !== 'WONT_DO');
  const completed = counted.filter(child => child.status === 'DONE').length;

  const createdAts = counted.map(child => new Date(child.record.sourceCreatedAt));
  const completedAts = counted
    .map(child => child.completedAt)
    .filter((date): date is Date => date !== null);

  const dates = [...createdAts, ...completedAts].sort((a, b) => a.getTime() - b.getTime());
  const burnup: BurnupPoint[] = [];
  for (const date of dates) {
    const point = {
      date,
      scope: createdAts.filter(at => at <= date).length,
      completed: completedAts.filter(at => at <= date).length,
    };
    const previous = burnup[burnup.length - 1];
    // Collapse repeats so the chart gets one point per actual change.
    if (previous && previous.scope === point.scope && previous.completed === point.completed) {
      continue;
    }
    burnup.push(point);
  }

  return {
    completed,
    total: counted.length,
    percent: counted.length === 0 ? 0 : completed / counted.length,
    burnup,
  };
}
