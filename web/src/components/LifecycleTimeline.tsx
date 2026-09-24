import { useState } from 'react';
import type { IssueStatus, IssueStatusPeriod } from '../gql/types';
import { formatDuration, formatRange, formatShortDate } from '../lib/format';
import { colorForStatus, labelForStatus } from '../lib/statusColors';
import { styles } from './LifecycleTimeline.styles';

interface LifecycleTimelineProps {
  statusPeriods: IssueStatusPeriod[];
  createdAt: string;
}

type LifecycleStatus = Extract<IssueStatus, 'TODO' | 'IN_PROGRESS' | 'DONE'>;

interface TimelinePeriod {
  id: string;
  status: LifecycleStatus | null;
  start: string;
  end: string | null;
  durationInSeconds: number;
}

function isLifecycleStatus(status: IssueStatus | null): status is LifecycleStatus {
  return status === 'TODO' || status === 'IN_PROGRESS' || status === 'DONE';
}

/** Collapse adjacent source statuses into mapped lifecycle periods and unlabelled gaps. */
function derivePeriods(statusPeriods: IssueStatusPeriod[]): TimelinePeriod[] {
  const derived: TimelinePeriod[] = [];

  for (const period of statusPeriods) {
    const status = isLifecycleStatus(period.status) ? period.status : null;

    const previous = derived.at(-1);
    if (previous?.status === status && previous.end === period.period.start) {
      previous.end = period.period.end;
      previous.durationInSeconds += period.durationInSeconds;
      continue;
    }

    derived.push({
      id: period.id,
      status,
      start: period.period.start,
      end: period.period.end,
      durationInSeconds: period.durationInSeconds,
    });
  }

  return derived;
}

export function LifecycleTimeline({ statusPeriods, createdAt }: LifecycleTimelineProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const periods = derivePeriods(statusPeriods);
  const total = periods.reduce((sum, period) => sum + period.durationInSeconds, 0) || 1;
  const hovered = hoveredIndex === null ? null : (periods[hoveredIndex] ?? null);

  let offset = 0;
  const segments = periods.map((period, index) => {
    const midpoint = (offset + period.durationInSeconds / 2) / total;
    offset += period.durationInSeconds;
    return { period, index, midpoint };
  });

  return (
    <section style={styles.section} data-ui="LifecycleTimeline.section">
      <h3 className="h5" style={styles.title}>Lifecycle</h3>
      <div style={styles.timeline} data-ui="LifecycleTimeline.timeline">
        <div style={styles.bar}>
          {segments.map(({ period, index }) => (
            <div
              key={period.id}
              style={{
                ...styles.segment,
                flex: `${Math.max(period.durationInSeconds, 1)} 1 0`,
                background: period.status ? colorForStatus(period.status) : 'transparent',
                opacity: hoveredIndex !== null && hoveredIndex !== index ? 0.3 : 1,
              }}
              aria-label={period.status
                ? `${labelForStatus(period.status)}, ${formatDuration(period.durationInSeconds)}`
                : undefined}
              aria-hidden={period.status ? undefined : true}
              onMouseEnter={() => period.status && setHoveredIndex(index)}
              onMouseLeave={() => period.status && setHoveredIndex(null)}
            />
          ))}
        </div>

        {hovered?.status && (
          <div
            style={{
              ...styles.tooltip,
              left: `${Math.min(85, Math.max(12, (segments[hoveredIndex!]?.midpoint ?? 0) * 100))}%`,
            }}
          >
            <div style={styles.tooltipTitle}>
              {labelForStatus(hovered.status)} · {formatDuration(hovered.durationInSeconds)}
            </div>
            <div style={styles.tooltipRange}>{formatRange(hovered.start, hovered.end)}</div>
          </div>
        )}

        <div style={styles.axis}>
          <span>Created {formatShortDate(createdAt)}</span>
          <span>Today</span>
        </div>
      </div>
    </section>
  );
}
