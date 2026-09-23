import type { IssueStatusPeriod } from '../gql/types';
import { formatDateTime, formatDuration } from '../lib/format';
import { colorForStatus } from '../lib/statusColors';
import styles from './StatusHistoryTable.module.css';

/**
 * The per-move feed, read off the status periods.
 *
 * Not `statusTransitions` — that is an aggregate of status pairs with occurrence
 * counts, so it cannot show when each individual move happened.
 */
export function StatusHistoryTable({ statusPeriods }: { statusPeriods: IssueStatusPeriod[] }) {
  return (
    <div className={styles.table}>
      <div className={`${styles.row} ${styles.head}`}>
        <span>Date</span>
        <span>Transition</span>
        <span className={styles.right}>Time in status</span>
        <span>By</span>
      </div>
      {statusPeriods.map((period, index) => {
        const previous = statusPeriods[index - 1];
        return (
          <div key={period.id} className={`${styles.row} ${styles.body}`}>
            <span className={`${styles.muted} tabularNums`}>
              {formatDateTime(period.period.start)}
            </span>
            <span className={styles.transition}>
              <span className={styles.dot} style={{ background: colorForStatus(period.status) }} />
              {previous
                ? `${previous.sourceStatus} → ${period.sourceStatus}`
                : `Created in ${period.sourceStatus}`}
            </span>
            <span className={`${styles.right} tabularNums`}>
              {period.isCurrent ? 'Current' : formatDuration(period.durationInSeconds)}
            </span>
            <span className={styles.muted}>{period.author.name}</span>
          </div>
        );
      })}
    </div>
  );
}
