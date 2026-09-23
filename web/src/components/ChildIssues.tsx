import { Link } from 'react-router-dom';
import type { DescendantStatusCounts, IssueStatus, IssueSummary } from '../gql/types';
import { formatDate } from '../lib/format';
import { colorForStatus, labelForStatus, STATUS_ORDER } from '../lib/statusColors';
import { Avatar } from './Avatar';
import styles from './ChildIssues.module.css';

interface ChildIssuesProps {
  issues: IssueSummary[];
  /** Tally over the whole subtree, the issue itself included. */
  counts: DescendantStatusCounts;
  /** The issue's own status, subtracted so the tally covers descendants only. */
  selfStatus: IssueStatus | null;
}

const COUNT_KEYS = {
  TODO: 'todo',
  IN_PROGRESS: 'inProgress',
  DONE: 'done',
  WONT_DO: 'wontDo',
} as const;

export function ChildIssues({ issues, counts, selfStatus }: ChildIssuesProps) {
  if (issues.length === 0) return null;

  const descendantCount = (status: IssueStatus) =>
    counts[COUNT_KEYS[status]] - (status === selfStatus ? 1 : 0);

  return (
    <div>
      <div className={styles.header}>
        <h3 className={styles.title}>Child issues</h3>
        <div className={styles.counts}>
          {STATUS_ORDER.map(status => {
            const count = descendantCount(status);
            if (count === 0) return null;
            return (
              <span key={status} className={styles.count} title={labelForStatus(status)}>
                <span className={styles.dot} style={{ background: colorForStatus(status) }} />
                {count}
              </span>
            );
          })}
        </div>
      </div>

      <div className={styles.list}>
        {issues.map(child => (
          <Link key={child.id} to={`/issues/${child.issueKey}`} className={styles.row}>
            <span className={styles.dot} style={{ background: colorForStatus(child.status) }} />
            <span className={styles.key}>{child.issueKey}</span>
            <span className={styles.childTitle}>{child.title}</span>
            <span className={styles.status}>{child.sourceIssueStatus}</span>
            <span className={styles.date}>
              {child.completedAt ? formatDate(child.completedAt) : '—'}
            </span>
            {child.assignee && (
              <Avatar initials={child.assignee.initials} name={child.assignee.name} size={18} />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
