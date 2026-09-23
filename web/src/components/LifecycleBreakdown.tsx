import { useState } from 'react';
import type { IssueStatus, IssueStatusPeriod } from '../gql/types';
import { formatDuration, formatRange, formatShortDate } from '../lib/format';
import { colorForStatus, labelForStatus, STATUS_ORDER } from '../lib/statusColors';
import { Icon } from './Icon';
import styles from './LifecycleBreakdown.module.css';
import { StatusHistoryTable } from './StatusHistoryTable';

interface LifecycleBreakdownProps {
  statusPeriods: IssueStatusPeriod[];
  createdAt: string;
}

/** `null` groups the periods whose source status has no Swarmia mapping. */
type Group = IssueStatus | null;

export function LifecycleBreakdown({ statusPeriods, createdAt }: LifecycleBreakdownProps) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [hoveredPeriod, setHoveredPeriod] = useState<number | null>(null);
  const [hoveredGroup, setHoveredGroup] = useState<Group | undefined>(undefined);

  const total = statusPeriods.reduce((sum, period) => sum + period.durationInSeconds, 0) || 1;
  const hovered = hoveredPeriod === null ? null : (statusPeriods[hoveredPeriod] ?? null);
  const activeGroup = hoveredGroup !== undefined ? hoveredGroup : (hovered?.status ?? undefined);

  let offset = 0;
  const bars = statusPeriods.map((period, index) => {
    const midpoint = (offset + period.durationInSeconds / 2) / total;
    offset += period.durationInSeconds;
    const dimmed =
      (hoveredPeriod !== null && hoveredPeriod !== index) ||
      (hoveredGroup !== undefined && hoveredGroup !== period.status);
    return { period, index, midpoint, dimmed };
  });

  // Only show the unmapped group when the issue actually has unmapped periods,
  // so a well-configured installation never sees an empty extra column.
  const hasUnmapped = statusPeriods.some(period => period.status === null);
  const groups: Group[] = hasUnmapped ? [...STATUS_ORDER, null] : STATUS_ORDER;

  return (
    <>
      <div className={styles.header}>
        <h3 className={styles.title}>Lifecycle breakdown</h3>
        <button className={styles.historyToggle} onClick={() => setHistoryOpen(open => !open)}>
          {historyOpen ? 'Hide status history' : 'Show status history'}
          <Icon
            name="ChevronDown"
            size={12}
            style={{
              transform: historyOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
          />
        </button>
      </div>

      <div className={styles.barWrapper}>
        <div className={styles.bar}>
          {bars.map(({ period, index, dimmed }) => (
            <div
              key={period.id}
              className={styles.barSegment}
              style={{
                flex: `${Math.max(period.durationInSeconds, 1)} 1 0`,
                background: colorForStatus(period.status),
                opacity: dimmed ? 0.3 : 1,
              }}
              onMouseEnter={() => setHoveredPeriod(index)}
              onMouseLeave={() => setHoveredPeriod(null)}
            />
          ))}
        </div>

        {hovered && (
          <div
            className={styles.tooltip}
            style={{
              left: `${Math.min(85, Math.max(12, (bars[hoveredPeriod!]?.midpoint ?? 0) * 100))}%`,
            }}
          >
            <div className={styles.tooltipTitle}>
              {hovered.sourceStatus} · {formatDuration(hovered.durationInSeconds)}
            </div>
            <div className={styles.tooltipRange}>
              {formatRange(hovered.period.start, hovered.period.end)}
            </div>
            {hovered.status === null && (
              <div className={styles.tooltipRange}>Not mapped to a Swarmia status</div>
            )}
          </div>
        )}

        <div className={styles.barAxis}>
          <span>Created {formatShortDate(createdAt)}</span>
          <span>Today</span>
        </div>
      </div>

      <div className={styles.categories}>
        {groups.map(group => {
          const periods = statusPeriods.filter(period => period.status === group);
          const groupSeconds = periods.reduce((sum, period) => sum + period.durationInSeconds, 0);
          return (
            <div
              key={group ?? 'unmapped'}
              className={styles.category}
              style={{
                borderLeftColor: colorForStatus(group),
                background: activeGroup === group ? 'var(--surfaceHover)' : 'transparent',
              }}
              onMouseEnter={() => setHoveredGroup(group)}
              onMouseLeave={() => setHoveredGroup(undefined)}
            >
              <div className={styles.categoryLabel}>{labelForStatus(group)}</div>
              <div className={styles.categoryTotal}>
                {periods.length === 0 ? '—' : formatDuration(groupSeconds)}
              </div>
              <div className={styles.statusList}>
                {periods.map(period => (
                  <div key={period.id} className={styles.statusRow}>
                    <span className={styles.statusName}>{period.sourceStatus}</span>
                    <span className="tabularNums" style={{ fontWeight: period.isCurrent ? 700 : 500 }}>
                      {period.isCurrent ? 'Current' : formatDuration(period.durationInSeconds)}
                    </span>
                  </div>
                ))}
                {periods.length === 0 && <span className={styles.statusEmpty}>Not reached yet</span>}
              </div>
            </div>
          );
        })}
      </div>

      {historyOpen && <StatusHistoryTable statusPeriods={statusPeriods} />}
    </>
  );
}
