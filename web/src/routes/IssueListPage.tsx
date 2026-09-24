import { useQuery } from '@apollo/client';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { IssueTypeIcon } from '../components/IssueTypeIcon';
import { Icon } from '../components/Icon';
import { Input, Select } from '../design-system/controls';
import { ISSUE_LIST_QUERY } from '../gql/queries';
import type { IssueStatus, IssueSummary, Project } from '../gql/types';
import { formatDuration, formatPercent } from '../lib/format';
import { colorForStatus, labelForStatus, statusLabel, STATUS_ORDER } from '../lib/statusColors';
import { styles } from './IssueListPage.styles';

/**
 * The issue list: top-level issues with filters for search, project and Swarmia statuses.
 *
 * Every column shows what Swarmia derived, not what the tracker sent — the Swarmia
 * status and issue type, time in progress and child-issue progress. The raw tracker
 * values (`sourceIssueStatus`, `sourceIssueType`) appear only as hover titles, so a
 * row can still be matched back to the tracker. The detail page is where both sides
 * are shown together.
 *
 * Filtering happens server-side (`Query.issues`); selected statuses are ORed by
 * the repository, and an empty selection includes every status. `previousData` keeps the table on
 * screen while a new filter loads instead of flashing the loading state.
 */

interface IssueListData {
  projects: Project[];
  issues: IssueSummary[];
}

export function IssueListPage() {
  const [search, setSearch] = useState('');
  const [projectId, setProjectId] = useState('');
  const [statuses, setStatuses] = useState<IssueStatus[]>([]);

  const filter = useMemo(
    () => ({
      search: search.trim() || null,
      projectId: projectId || null,
      statuses: statuses.length ? statuses : null,
    }),
    [search, projectId, statuses],
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
      <div style={styles.header} data-ui="IssueListPage.header">
        <div>
          <h1 style={styles.title} data-ui="IssueListPage.title">Issues</h1>
          <p style={styles.subtitle} data-ui="IssueListPage.subtitle">
            Jira issues Swarmia is tracking, with the time in progress and child-issue progress it
            derived from their status periods.
          </p>
        </div>
      </div>

      <div style={styles.filters} data-ui="IssueListPage.filters">
        <Input
          wrapperStyle={styles.search}
          type="search"
          value={search}
          placeholder="Search key or title…"
          onChange={event => setSearch(event.target.value)}
        />
        <Select
          style={styles.select}
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
        </Select>
        <Select
          mode="checkbox"
          style={styles.select}
          value={statuses}
          onValuesChange={values => setStatuses(values as IssueStatus[])}
          aria-label="Status"
          placeholder="Any status"
          options={STATUS_ORDER.map(value => ({ value, label: statusLabel[value] }))}
        />
        <span style={styles.count} data-ui="IssueListPage.count">
          {issues.length} issue{issues.length === 1 ? '' : 's'}
        </span>
      </div>

      {issues.length === 0 ? (
        <EmptyState message="No issues match these filters." />
      ) : (
        <div style={styles.table} data-ui="IssueListPage.table">
          <div style={{ ...styles.row, ...styles.head }} data-ui="IssueListPage.row IssueListPage.head">
            <span>Issue</span>
            <span>Status</span>
            <span>Assignee</span>
            <span>Progress</span>
            <span style={styles.right} data-ui="IssueListPage.right">In progress</span>
            <span>Project</span>
          </div>
          {issues.map(issue => (
            <Link
              key={issue.id}
              to={`/issues/${issue.issueKey}`}
              style={{ ...styles.row, ...styles.body }}
              data-ui="IssueListPage.row IssueListPage.body"
            >
              <span style={styles.issueCell} data-ui="IssueListPage.issueCell">
                <IssueTypeIcon
                  issueType={issue.issueType}
                  title={issue.issueType ? `${issue.issueType} (${issue.sourceIssueType} in the tracker)` : issue.sourceIssueType}
                />
                <span style={styles.issueKey} data-ui="IssueListPage.issueKey">{issue.issueKey}</span>
                <span style={styles.issueTitle} data-ui="IssueListPage.issueTitle">{issue.title}</span>
              </span>
              <span style={styles.muted} data-ui="IssueListPage.muted">
                <ListStatus sourceStatus={issue.sourceIssueStatus} status={issue.status} />
              </span>
              <span>
                {issue.assignee ? (
                  <span style={styles.assignee} data-ui="IssueListPage.assignee">
                    <Avatar initials={issue.assignee.initials} name={issue.assignee.name} size={20} />
                    {issue.assignee.name}
                  </span>
                ) : (
                  <span style={styles.muted} data-ui="IssueListPage.muted">Unassigned</span>
                )}
              </span>
              <span style={styles.progressCell} data-ui="IssueListPage.progressCell">
                <span style={styles.progressTrack} data-ui="IssueListPage.progressTrack">
                  <span
                    style={{ ...styles.progressFill, width: formatPercent(issue.progress.percent) }} data-ui="IssueListPage.progressFill"
                  />
                </span>
                <span className="tabularNums" style={styles.muted}>
                  {issue.progress.completed}/{issue.progress.total}
                </span>
              </span>
              <span className="tabularNums" style={styles.right}>
                {issue.inProgressTimeSeconds === null ? (
                  <span style={styles.muted} data-ui="IssueListPage.muted">—</span>
                ) : (
                  formatDuration(issue.inProgressTimeSeconds)
                )}
              </span>
              <span style={styles.muted} data-ui="IssueListPage.muted">{issue.project?.name ?? '—'}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

/**
 * The Swarmia status, with the tracker's own name for it as the hover title.
 *
 * Deliberately not `StatusBadge`, which leads with the source status for the detail
 * page. An unmapped status (`status === null`) reads "Unmapped" in the greyed colour:
 * it has no Swarmia status and drives no metric, so the list must not imply one.
 */
function ListStatus({ sourceStatus, status }: { sourceStatus: string | null; status: IssueStatus | null }) {
  const title =
    sourceStatus === null
      ? 'No status in the tracker'
      : status === null
        ? `"${sourceStatus}" is not mapped to a Swarmia status`
        : `"${sourceStatus}" in the tracker`;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} title={title}>
      {status === 'DONE' ? (
        <Icon name="Check" size={12} color="var(--green600)" />
      ) : (
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 9999,
            background: colorForStatus(status),
            display: 'inline-block',
          }}
        />
      )}
      {labelForStatus(status)}
    </span>
  );
}
