import { useQuery } from '@apollo/client';
import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { AnnotationsPanel } from '../components/AnnotationsPanel';
import { Avatar } from '../components/Avatar';
import { ChildIssues } from '../components/ChildIssues';
import { Description } from '../components/Description';
import { EffortCard } from '../components/EffortCard';
import { ErrorState, LoadingState } from '../components/States';
import { Icon } from '../components/Icon';
import { IssueTypeIcon } from '../components/IssueTypeIcon';
import { LifecycleBreakdown } from '../components/LifecycleBreakdown';
import { ProgressCard } from '../components/ProgressCard';
import { StatusBadge } from '../components/StatusBadge';
import { StatusHistoryTable } from '../components/StatusHistoryTable';
import { ISSUE_DETAIL_QUERY } from '../gql/queries';
import type { Issue } from '../gql/types';
import { formatDate, formatDuration, formatRatio } from '../lib/format';
import { labelForStatus } from '../lib/statusColors';
import styles from './IssueDetailPage.module.css';

type Tab = 'details' | 'activity';

export function IssueDetailPage() {
  const { key = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [composerOpen, setComposerOpen] = useState(false);
  const tab: Tab = searchParams.get('tab') === 'activity' ? 'activity' : 'details';

  const { data, loading, error, refetch } = useQuery<{ issue: Issue | null }>(ISSUE_DETAIL_QUERY, {
    variables: { issueKey: key },
  });

  if (loading && !data) return <LoadingState label={`Loading ${key}…`} />;
  if (error) return <ErrorState message={error.message} onRetry={() => void refetch()} />;
  if (!data?.issue) return <ErrorState message={`No issue found for ${key}.`} />;

  const issue = data.issue;

  const setTab = (next: Tab) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'details') params.delete('tab');
    else params.set('tab', next);
    setSearchParams(params, { replace: true });
  };

  return (
    <>
      <Link to="/issues" className={styles.back}>
        <Icon name="ArrowLeft" size={14} />
        Back to flow
      </Link>

      <div className={styles.breadcrumb}>
        <IssueTypeIcon issueType={issue.issueType} title={issue.sourceIssueType} />
        <span className={styles.issueKey}>{issue.issueKey}</span>
        <span>·</span>
        <StatusBadge sourceStatus={issue.sourceIssueStatus} status={issue.status} />
      </div>

      <div className={styles.titleRow}>
        <h1 className={styles.title}>{issue.title}</h1>
        <a
          className={styles.jiraLink}
          href={issue.sourceUrl}
          target="_blank"
          rel="noreferrer"
          title={`Open in ${issue.dataSource}`}
        >
          <img src="/icons/JiraLogo.svg" alt={issue.dataSource} width={12} height={12} />
        </a>
        <div className={styles.spacer} />
        {issue.project && (
          <span className={styles.board}>
            <span className={styles.boardDot} style={{ background: issue.project.color }} />
            {issue.project.name}
          </span>
        )}
        <button className={styles.addNote} onClick={() => setComposerOpen(true)}>
          <Icon name="Edit" size={14} />
          Add note
        </button>
      </div>

      <div className={styles.cards}>
        <ProgressCard issue={issue} />
        <EffortCard effort={issue.effort} />
      </div>

      <AnnotationsPanel
        issueKey={issue.issueKey}
        annotations={issue.annotations}
        composerOpen={composerOpen}
        onCloseComposer={() => setComposerOpen(false)}
      />

      <div className={styles.tabs} role="tablist">
        {(['activity', 'details'] as const).map(value => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            className={`${styles.tab} ${tab === value ? styles.tabActive : ''}`}
            onClick={() => setTab(value)}
          >
            {value === 'activity' ? 'Activity' : 'Details'}
          </button>
        ))}
      </div>

      {tab === 'activity' ? (
        <div className={styles.activity}>
          <StatusHistoryTable statusPeriods={issue.statusPeriods} />
        </div>
      ) : (
        <div className={styles.detailsGrid}>
          <div>
            <h3 className={styles.sectionTitle}>Jira details</h3>
            <dl className={styles.fields}>
              <Field label="Issue type">
                <span className={styles.inlineValue}>
                  <IssueTypeIcon issueType={issue.issueType} />
                  {issue.sourceIssueType}
                </span>
              </Field>
              <Field label="Status">
                {issue.sourceIssueStatus ?? '—'}
                {/* The mapped status only earns its space when it differs from
                    the source status, or when there is no mapping at all. */}
                {labelForStatus(issue.status) !== issue.sourceIssueStatus && (
                  <span className={styles.mappedStatus}>{labelForStatus(issue.status)}</span>
                )}
              </Field>
              <Field label="Assignee">
                {issue.assignee ? (
                  <span className={styles.inlineValue}>
                    <Avatar
                      initials={issue.assignee.initials}
                      name={issue.assignee.name}
                      size={18}
                    />
                    {issue.assignee.name}
                  </span>
                ) : (
                  'Unassigned'
                )}
              </Field>
              <Field label="Priority">{issue.priorityLabel ?? '—'}</Field>
              <Field label="Estimate">{issue.estimate ?? '—'}</Field>
              <Field label="Labels">
                {issue.labels.length === 0 ? (
                  '—'
                ) : (
                  <span className={styles.labels}>
                    {issue.labels.map(label => (
                      <span key={label} className={styles.label}>
                        {label}
                      </span>
                    ))}
                  </span>
                )}
              </Field>
              <Field label="Created at">{formatDate(issue.createdAt)}</Field>
              <Field label="Started at">
                {issue.startedAt ? formatDate(issue.startedAt) : 'Not started'}
              </Field>
              <Field label="Completed at">
                {issue.completedAt ? formatDate(issue.completedAt) : '—'}
              </Field>
              <Field label="Age">{formatDuration(issue.ageSeconds)}</Field>
              <Field label="Scope increase">
                {formatRatio(issue.scopeIncrease)}
                <span className={styles.mappedStatus}>
                  {issue.scopeIncrease === null
                    ? issue.startedAt
                      ? 'no initial children'
                      : 'never started'
                    : `${issue.creepedIssueCount} added after start of ${issue.initialIssueCount}`}
                </span>
              </Field>
              <Field label="URL">
                <a href={issue.sourceUrl} target="_blank" rel="noreferrer">
                  Open in {issue.dataSource}
                </a>
              </Field>
            </dl>
          </div>

          <div className={styles.rightColumn}>
            <Description description={issue.description} />
            <LifecycleBreakdown
              statusPeriods={issue.statusPeriods}
              createdAt={issue.createdAt}
            />
            <ChildIssues
              issues={issue.children}
              counts={issue.descendantStatusCounts}
              selfStatus={issue.status}
            />
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className={styles.fieldLabel}>{label}</dt>
      <dd className={styles.fieldValue}>{children}</dd>
    </>
  );
}
