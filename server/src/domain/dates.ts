/** The `date-fns` helpers the transcribed rapu algorithms rely on, in UTC. */

export const DAY_MS = 86_400_000;

export function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

/** Whole days from `earlier` to `later`, truncated — date-fns `differenceInDays`. */
export function differenceInDays(later: Date, earlier: Date): number {
  return Math.trunc((later.getTime() - earlier.getTime()) / DAY_MS);
}

/** Business days in `[earlier, later)` — date-fns `differenceInBusinessDays`. */
export function differenceInBusinessDays(later: Date, earlier: Date): number {
  let count = 0;
  for (
    let day = startOfDay(earlier);
    day.getTime() < startOfDay(later).getTime();
    day = addDays(day, 1)
  ) {
    if (!isWeekend(day)) count += 1;
  }
  return count;
}

export function endOfDay(date: Date): Date {
  return new Date(startOfDay(date).getTime() + DAY_MS - 1);
}

export function toDateKey(date: Date): string {
  return startOfDay(date).toISOString().slice(0, 10);
}

export function toMonthKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

/** Business days in a `YYYY-MM` month, the denominator for monthly FTE. */
export function businessDaysInMonth(monthKey: string): number {
  const [year, month] = monthKey.split('-').map(Number) as [number, number];
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return differenceInBusinessDays(end, start);
}
