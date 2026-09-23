const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MONTH = 30.44 * DAY;

/** Human-readable duration, matching how Swarmia phrases issue timings. */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0 minutes';
  if (seconds < HOUR) return plural(Math.round(seconds / MINUTE), 'minute');
  if (seconds < 2 * DAY) return `${round(seconds / HOUR, 1)} hours`;
  if (seconds < 60 * DAY) return plural(Math.round(seconds / DAY), 'day');
  return `${round(seconds / MONTH, 1)} months`;
}

export function formatDays(seconds: number): string {
  return plural(Math.round(seconds / DAY), 'day');
}

export function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatShortDate(value: string | Date): string {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateTime(value: string | Date): string {
  const date = new Date(value);
  return `${formatShortDate(date)}, ${date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })}`;
}

export function formatRange(from: string | Date, to: string | Date | null): string {
  return `${formatDateTime(from)} – ${to ? formatDateTime(to) : 'now'}`;
}

export function formatPercent(fraction: number, digits = 0): string {
  return `${round(fraction * 100, digits)}%`;
}

/** For values already on a 0..100 scale, as rapu's percentage properties are. */
export function formatPercentValue(value: number, digits = 0): string {
  return `${round(value, digits)}%`;
}

/**
 * FTE is a share of a month, so a lifetime total reads as FTE months. Matches
 * `EffortMonthly.fte` upstream, which is capped at 1.0 per author per month.
 */
export function formatFte(fte: number): string {
  const value = round(fte, fte < 0.1 ? 2 : 1);
  return `${value} FTE month${value === 1 ? '' : 's'}`;
}

/** Scope creep is a ratio: 0.5 means the issue grew by half after it started. */
export function formatRatio(value: number | null): string {
  if (value === null) return '—';
  return `+${round(value * 100, 0)}%`;
}

export function formatMonth(month: string): string {
  const [year, m] = month.split('-');
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short' });
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function plural(value: number, unit: string): string {
  return `${value} ${unit}${value === 1 ? '' : 's'}`;
}
