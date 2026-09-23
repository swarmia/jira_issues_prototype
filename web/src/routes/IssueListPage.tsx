import { useQuery } from '@apollo/client';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { IssueTypeIcon } from '../components/IssueTypeIcon';
import { StatusBadge } from '../components/StatusBadge';
import { ISSUE_LIST_QUERY } from '../gql/queries';
import type { IssueStatus, IssueSummary, Project } from '../gql/types';
import { formatDuration, formatPercent } from '../lib/format';
import { statusLabel, STATUS_ORDER } from '../lib/statusColors';
import styles from './IssueListPage.module.css';

interface IssueListData {
  projects: Project[];
  issues: IssueSummary[];
}

export function IssueListPage() {
  const [search, setSearch] = useState('');
  const [projectId, setProjectId] = useState('');
  const [status, setStatus] = useState('');

  const filter = useMemo(
    () => ({
      search: search.trim() || null,
      projectId: projectId || null,
      status: (status || null) as IssueStatus | null,
    }),
    [search, projectId, status],
  );

  const { data, loading, error, previousData, refetch } = useQuery<IssueListData>(ISSUE_LIST_QUERY, {
    variables: { filter },
  });

  const current = data ?? previousData;

  if (loading && !current) return <LoadingState label="Loading issues…" />;
  if (error) return <ErrorState message={error.message} onRetry={() => void refetch()} />;

  const issues = current?.issues ?? [];

  return (
    <>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Issues</h1>
          <p className={styles.subtitle}>
            Jira issues Swarmia is tracking, with the time in progress and child-issue progress it
            derived from their status periods.
          </p>
        </div>
      </div>

      <div className={styles.filters}>
        <input
          className={styles.search}
          type="search"
          value={search}
          placeholder="Search key or title…"
          onChange={event => setSearch(event.target.value)}
        />
        <select
          className={styles.select}
          value={projectId}
          onChange={event => setProjectId(event.target.value)}
          aria-label="Project"
        >
          <option value="">All projects</option>
          {current?.projects.map(project => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <select
          className={styles.select}
          value={status}
          onChange={event => setStatus(event.target.value)}
          aria-label="Status"
        >
          <option value="">Any status</option>
          {STATUS_ORDER.map(value => (
            <option key={value} value={value}>
              {statusLabel[value]}
            </option>
          ))}
        </select>
        <span className={styles.count}>
          {issues.length} issue{issues.length === 1 ? '' : 's'}
        </span>
      </div>

      {issues.length === 0 ? (
        <EmptyState message="No issues match these filters." />
      ) : (
        <div className={styles.table}>
          <div className={`${styles.row} ${styles.head}`}>
            <span>Issue</span>
            <span>Status</span>
            <span>Assignee</span>
            <span>Progress</span>
            <span className={styles.right}>In progress</span>
            <span>Project</span>
          </div>
          {issues.map(issue => (
            <Link
              key={issue.id}
              to={`/issues/${issue.issueKey}`}
              className={`${styles.row} ${styles.body}`}
            >
              <span className={styles.issueCell}>
                <IssueTypeIcon issueType={issue.issueType} title={issue.sourceIssueType} />
                <span className={styles.issueKey}>{issue.issueKey}</span>
                <span className={styles.issueTitle}>{issue.title}</span>
              </span>
              <span className={styles.muted}>
                <StatusBadge sourceStatus={issue.sourceIssueStatus} status={issue.status} />
              </span>
              <span>
                {issue.assignee ? (
                  <span className={styles.assignee}>
                    <Avatar initials={issue.assignee.initials} name={issue.assignee.name} size={20} />
                    {issue.assignee.name}
                  </span>
                ) : (
                  <span className={styles.muted}>Unassigned</span>
                )}
              </span>
              <span className={styles.progressCell}>
                <span className={styles.progressTrack}>
                  <span
                    className={styles.progressFill}
                    style={{ width: formatPercent(issue.progress.percent) }}
                  />
                </span>
                <span className={`${styles.muted} tabularNums`}>
                  {issue.progress.completed}/{issue.progress.total}
                </span>
              </span>
              <span className={`${styles.right} tabularNums`}>
                {issue.inProgressTimeSeconds === null ? (
                  <span className={styles.muted}>—</span>
                ) : (
                  formatDuration(issue.inProgressTimeSeconds)
                )}
              </span>
              <span className={styles.muted}>{issue.project?.name ?? '—'}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
