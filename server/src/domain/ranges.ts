/**
 * Timestamp ranges, mirroring the Postgres `tstzrange` / `tstzmultirange` types
 * that rapu stores status periods and in-progress periods in.
 *
 * Ranges are half-open `[start, end)`. A null `end` is an unbounded upper
 * ("upper_inf"), i.e. the issue is still in this status — it is NOT a zero-length
 * range, and every duration on an open range counts up to `now`.
 */

export interface TimestampRange {
  start: Date;
  /** Null while the range is still open. */
  end: Date | null;
}

export type TimestampMultirange = TimestampRange[];

export function isOpen(range: TimestampRange): boolean {
  return range.end === null;
}

/**
 * Length of a range in whole seconds, an open range counted up to `now`.
 *
 * rapu truncates per period rather than on the sum:
 *   TRUNC(EXTRACT(EPOCH FROM COALESCE(UPPER(p), NOW()) - LOWER(p)))
 * so summing durations over a multirange must truncate each member first.
 */
export function durationSeconds(range: TimestampRange, now: Date): number {
  const end = range.end ?? now;
  return Math.trunc(Math.max(0, end.getTime() - range.start.getTime()) / 1000);
}

/**
 * Normalize into a multirange the way Postgres does: sorted, with overlapping
 * and immediately-adjacent members merged. Two status periods that both map to
 * In progress and meet end-to-start become a single in-progress period, which is
 * what makes `inProgressPeriods` a multirange rather than a list of periods.
 */
export function mergeRanges(ranges: readonly TimestampRange[]): TimestampMultirange {
  const sorted = [...ranges].sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged: TimestampRange[] = [];

  for (const range of sorted) {
    const previous = merged[merged.length - 1];
    if (!previous) {
      merged.push({ ...range });
      continue;
    }
    // An open previous range swallows everything after it.
    if (previous.end === null) continue;
    if (range.start.getTime() <= previous.end.getTime()) {
      previous.end =
        range.end === null
          ? null
          : new Date(Math.max(previous.end.getTime(), range.end.getTime()));
    } else {
      merged.push({ ...range });
    }
  }

  return merged;
}

/** Earliest bounded start, or null when the multirange is empty. */
export function lowerBound(multirange: TimestampMultirange): Date | null {
  const starts = multirange.map(range => range.start.getTime());
  return starts.length > 0 ? new Date(Math.min(...starts)) : null;
}

/** Latest end, or null when any member is still open (or the multirange is empty). */
export function upperBound(multirange: TimestampMultirange): Date | null {
  if (multirange.length === 0) return null;
  if (multirange.some(isOpen)) return null;
  return new Date(Math.max(...multirange.map(range => range.end!.getTime())));
}

export function hasOpenRange(multirange: TimestampMultirange): boolean {
  return multirange.some(isOpen);
}

/** Sum of member lengths in seconds, each truncated separately. */
export function totalSeconds(multirange: TimestampMultirange, now: Date): number {
  return multirange.reduce((sum, range) => sum + durationSeconds(range, now), 0);
}
