import { Link } from 'react-router-dom';
import type { DescendantStatusCounts, IssueStatus, IssueSummary } from '../gql/types';
import { formatDate } from '../lib/format';
import { colorForStatus, labelForStatus, STATUS_ORDER } from '../lib/statusColors';
import { Avatar } from './Avatar';
import { styles } from './ChildIssues.styles';

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
      <div style={styles.header} data-ui="ChildIssues.header">
        <h3 style={styles.title} data-ui="ChildIssues.title">Child issues</h3>
        <div style={styles.counts} data-ui="ChildIssues.counts">
          {STATUS_ORDER.map(status => {
            const count = descendantCount(status);
            if (count === 0) return null;
            return (
              <span key={status} style={styles.count} data-ui="ChildIssues.count" title={labelForStatus(status)}>
                <span style={{ ...styles.dot, background: colorForStatus(status) }} data-ui="ChildIssues.dot" />
                {count}
              </span>
            );
          })}
        </div>
      </div>

      <div style={styles.list} data-ui="ChildIssues.list">
        {issues.map(child => (
          <Link key={child.id} to={`/issues/${child.issueKey}`} style={styles.row} data-ui="ChildIssues.row">
            <span style={{ ...styles.dot, background: colorForStatus(child.status) }} data-ui="ChildIssues.dot" />
            <span style={styles.key} data-ui="ChildIssues.key">{child.issueKey}</span>
            <span style={styles.childTitle} data-ui="ChildIssues.childTitle">{child.title}</span>
            <span style={styles.status} data-ui="ChildIssues.status">{child.sourceIssueStatus}</span>
            <span style={styles.date} data-ui="ChildIssues.date">
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
