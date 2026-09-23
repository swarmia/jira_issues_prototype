/**
 * The `flowEfficiency` materialized column.
 *
 * Transcribed from `calculateIssueStatistics` in
 * apps/rapu/src/reports/swarmiaIssueActivity.ts, with the activity window from
 * `extendDateRangeWithLifecycle` in apps/rapu/src/service/lifecycle.ts.
 *
 * This is NOT time-in-active-status over cycle time. It counts DAYS:
 *
 *            days with work-item activity
 *   ------------------------------------------------
 *   business days in window + active weekend days
 *
 * Activity rolls up the ancestor chain, so a commit on a child marks the
 * parent's day active too. The window spans the first to the last day of
 * activity, extended to cover the issue's in-progress lifecycle, so an issue
 * that sat in progress with nobody touching it scores low rather than being
 * scored over a window it never occupied.
 *
 * rapu does the weekday/weekend split in the organization's timezone; this
 * prototype has no organization, so everything here is UTC.
 */

import {
  addDays,
  differenceInBusinessDays,
  differenceInDays,
  endOfDay,
  isWeekend,
  startOfDay,
  toDateKey,
} from './dates.js';

export interface ActivityDay {
  date: Date;
  count: number;
}

export interface IssueActivityStatistics {
  /** Inclusive day span of the window. */
  open: number;
  openBusinessDays: number;
  /** The flow-efficiency denominator. */
  openBusinessAndActiveDays: number;
  /** Days that had any activity. */
  active: number;
  /** 0..1. rapu's entity property multiplies this by 100. */
  efficiency: number;
}

/**
 * Widen an activity window to cover the in-progress lifecycle. An issue still in
 * progress is extended to the start of today.
 */
export function extendDateRangeWithLifecycle({
  firstActivityDate,
  lastActivityDate,
  lifecycleStartedAt,
  lifecycleEndedAt,
  now,
}: {
  firstActivityDate: Date | null;
  lastActivityDate: Date | null;
  lifecycleStartedAt: Date | null;
  lifecycleEndedAt: Date | null;
  now: Date;
}): { firstActivityDate: Date | null; lastActivityDate: Date | null } {
  let first = firstActivityDate;
  let last = lastActivityDate;

  if (!lifecycleStartedAt) return { firstActivityDate: first, lastActivityDate: last };

  const effectiveEndedAt = lifecycleEndedAt ?? startOfDay(now);

  if (!first || startOfDay(first).getTime() > startOfDay(lifecycleStartedAt).getTime()) {
    first = lifecycleStartedAt;
  }
  if (!last || startOfDay(last).getTime() < startOfDay(effectiveEndedAt).getTime()) {
    last = effectiveEndedAt;
  }

  // Guard against an inverted range when the lifecycle started today and has not
  // ended: effectiveEndedAt is midnight, which is before lifecycleStartedAt.
  if (first && last && first.getTime() > last.getTime()) last = first;

  return { firstActivityDate: first, lastActivityDate: last };
}

/** Fill the window with one entry per day, carrying that day's activity count. */
export function activityByDate({
  activityTimestamps,
  windowStart,
  windowEnd,
}: {
  activityTimestamps: readonly Date[];
  windowStart: Date | null;
  windowEnd: Date | null;
}): ActivityDay[] {
  if (!windowStart || !windowEnd) return [];

  const countsByDay = new Map<string, number>();
  for (const timestamp of activityTimestamps) {
    const key = toDateKey(timestamp);
    countsByDay.set(key, (countsByDay.get(key) ?? 0) + 1);
  }

  const days: ActivityDay[] = [];
  const last = startOfDay(windowEnd).getTime();
  for (let day = startOfDay(windowStart); day.getTime() <= last; day = addDays(day, 1)) {
    days.push({ date: day, count: countsByDay.get(toDateKey(day)) ?? 0 });
  }
  return days;
}

export function calculateIssueStatistics(
  activity: readonly ActivityDay[],
): IssueActivityStatistics {
  // Some upstream activity rows carry the epoch as their date; they are dropped
  // before the window is measured.
  const valid = activity.filter(day => day.date.getTime() > 0);

  if (valid.length === 0) {
    return {
      open: 0,
      openBusinessDays: 0,
      openBusinessAndActiveDays: 0,
      active: 0,
      efficiency: 0,
    };
  }

  const startedAt = valid[0]!.date;
  const endedAt = valid[valid.length - 1]!.date;

  const open = differenceInDays(endOfDay(endedAt), startedAt) + 1;
  const businessDaysInWindow = differenceInBusinessDays(addDays(endedAt, 1), startedAt);
  const openBusinessDays = Math.max(businessDaysInWindow, 1);

  const active = valid.filter(day => day.count > 0).length;
  const activeWeekendDays = valid.filter(day => day.count > 0 && isWeekend(day.date)).length;

  // Every business day in the window, plus weekend days that were actually
  // worked. Floored to 1 so the denominator is never 0.
  const openBusinessAndActiveDays = Math.max(businessDaysInWindow + activeWeekendDays, 1);

  return {
    open,
    openBusinessDays,
    openBusinessAndActiveDays,
    active,
    efficiency: active / openBusinessAndActiveDays,
  };
}
