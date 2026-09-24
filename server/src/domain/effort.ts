/**
 * EffortDaily -> EffortMonthly rollup.
 *
 * Upstream, effort rows carry `ancestorIssueIds`, so a row logged against a
 * child matches every issue in its ancestor chain. The caller passes the
 * issue's descendant set, which is the same relation read from the other end.
 *
 * `EffortDaily.fte` is an author's share of one day; `EffortMonthly.fte` is
 * their share of a month, capped at 1.0. Dividing the month's daily FTE by its
 * business days is what keeps that cap meaningful.
 */

import type { EffortDailyRecord } from '../data/types.js';
import { businessDaysInMonth, toMonthKey } from './dates.js';

export interface MonthlyEffort {
  month: string;
  fte: number;
}

export interface EffortContributor {
  authorId: string;
  fte: number;
  share: number;
}

export interface EffortRollup {
  lifetimeFte: number;
  monthly: MonthlyEffort[];
  contributors: EffortContributor[];
}

export function rollUpEffort(rows: readonly EffortDailyRecord[]): EffortRollup {
  // month -> author -> summed daily FTE, before the business-day division.
  const dailyByMonth = new Map<string, Map<string, number>>();
  for (const row of rows) {
    const month = toMonthKey(new Date(row.date));
    const byAuthor = dailyByMonth.get(month) ?? new Map<string, number>();
    byAuthor.set(row.authorId, (byAuthor.get(row.authorId) ?? 0) + row.fte);
    dailyByMonth.set(month, byAuthor);
  }

  const byMonth = new Map<string, number>();
  const byAuthor = new Map<string, number>();
  let lifetimeFte = 0;

  for (const [month, authorTotals] of dailyByMonth) {
    const businessDays = businessDaysInMonth(month);
    for (const [authorId, dailyTotal] of authorTotals) {
      // Capped at 1.0: an author cannot spend more than a whole month on it.
      const fte = Math.min(dailyTotal / businessDays, 1);
      byMonth.set(month, (byMonth.get(month) ?? 0) + fte);
      byAuthor.set(authorId, (byAuthor.get(authorId) ?? 0) + fte);
      lifetimeFte += fte;
    }
  }

  return {
    lifetimeFte,
    monthly: [...byMonth.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, fte]) => ({ month, fte })),
    contributors: [...byAuthor.entries()]
      .map(([authorId, fte]) => ({
        authorId,
        fte,
        share: lifetimeFte === 0 ? 0 : fte / lifetimeFte,
      }))
      .sort((a, b) => b.fte - a.fte),
  };
}
