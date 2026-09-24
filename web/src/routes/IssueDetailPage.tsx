import { useQuery } from '@apollo/client';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnnotationsPanel } from '../components/AnnotationsPanel';
import { Avatar } from '../components/Avatar';
import { ChildIssues } from '../components/ChildIssues';
import { Description } from '../components/Description';
import { EffortCard } from '../components/EffortCard';
import { ErrorState, LoadingState } from '../components/States';
import { Icon } from '../components/Icon';
import { IssueTypeIcon } from '../components/IssueTypeIcon';
import { LifecycleTimeline } from '../components/LifecycleTimeline';
import { ProgressCard } from '../components/ProgressCard';
import { StatusBadge } from '../components/StatusBadge';
import { ISSUE_DETAIL_QUERY } from '../gql/queries';
import type { Issue } from '../gql/types';
import { formatDate, formatDuration, formatRatio } from '../lib/format';
import { labelForStatus } from '../lib/statusColors';
import { styles } from './IssueDetailPage.styles';

export function IssueDetailPage() {
  const { key = '' } = useParams();
  const [composerOpen, setComposerOpen] = useState(false);

  const { data, loading, error, refetch } = useQuery<{ issue: Issue | null }>(ISSUE_DETAIL_QUERY, {
    variables: { issueKey: key },
  });

  if (loading && !data) return <LoadingState label={`Loading ${key}…`} />;
  if (error) return <ErrorState message={error.message} onRetry={() => void refetch()} />;
  if (!data?.issue) return <ErrorState message={`No issue found for ${key}.`} />;

  const issue = data.issue;

  return (
    <>
      <Link to="/issues" style={styles.back} data-ui="IssueDetailPage.back">
        <Icon name="ArrowLeft" size={14} />
        Back to flow
      </Link>

      <div style={styles.breadcrumb} data-ui="IssueDetailPage.breadcrumb">
        <IssueTypeIcon issueType={issue.issueType} title={issue.sourceIssueType} />
        <span style={styles.issueKey} data-ui="IssueDetailPage.issueKey">{issue.issueKey}</span>
        <span>·</span>
        <StatusBadge sourceStatus={issue.sourceIssueStatus} status={issue.status} />
      </div>

      <div style={styles.titleRow} data-ui="IssueDetailPage.titleRow">
        <h1 style={styles.title} data-ui="IssueDetailPage.title">{issue.title}</h1>
        <a
          style={styles.jiraLink} data-ui="IssueDetailPage.jiraLink"
          href={issue.sourceUrl}
          target="_blank"
          rel="noreferrer"
          title={`Open in ${issue.dataSource}`}
        >
          <img src="/icons/JiraLogo.svg" alt={issue.dataSource} width={12} height={12} />
        </a>
        <div style={styles.spacer} data-ui="IssueDetailPage.spacer" />
        {issue.project && (
          <span style={styles.board} data-ui="IssueDetailPage.board">
            <span style={{ ...styles.boardDot, background: issue.project.color }} data-ui="IssueDetailPage.boardDot" />
            {issue.project.name}
          </span>
        )}
        <button style={styles.addNote} data-ui="IssueDetailPage.addNote" onClick={() => setComposerOpen(true)}>
          <Icon name="Edit" size={14} />
          Add note
        </button>
      </div>

      <div style={styles.cards} data-ui="IssueDetailPage.cards">
        <ProgressCard issue={issue} />
        <EffortCard effort={issue.effort} />
      </div>

      <AnnotationsPanel
        issueKey={issue.issueKey}
        annotations={issue.annotations}
        composerOpen={composerOpen}
        onCloseComposer={() => setComposerOpen(false)}
      />

      <div style={styles.detailsGrid} data-ui="IssueDetailPage.detailsGrid">
        <div>
          <h3 style={styles.sectionTitle} data-ui="IssueDetailPage.sectionTitle">Jira details</h3>
          <dl style={styles.fields} data-ui="IssueDetailPage.fields">
            <Field label="Issue type">
              <span style={styles.inlineValue} data-ui="IssueDetailPage.inlineValue">
                <IssueTypeIcon issueType={issue.issueType} />
                {issue.sourceIssueType}
              </span>
            </Field>
            <Field label="Status">
              {issue.sourceIssueStatus ?? '—'}
              {/* The mapped status only earns its space when it differs from
                  the source status, or when there is no mapping at all. */}
              {labelForStatus(issue.status) !== issue.sourceIssueStatus && (
                <span style={styles.mappedStatus} data-ui="IssueDetailPage.mappedStatus">{labelForStatus(issue.status)}</span>
              )}
            </Field>
            <Field label="Assignee">
              {issue.assignee ? (
                <span style={styles.inlineValue} data-ui="IssueDetailPage.inlineValue">
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
                <span style={styles.labels} data-ui="IssueDetailPage.labels">
                  {issue.labels.map(label => (
                    <span key={label} style={styles.label} data-ui="IssueDetailPage.label">
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
              <span style={styles.mappedStatus} data-ui="IssueDetailPage.mappedStatus">
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

        <div style={styles.rightColumn} data-ui="IssueDetailPage.rightColumn">
          <Description description={issue.description} />
          <LifecycleTimeline
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
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt style={styles.fieldLabel} data-ui="IssueDetailPage.fieldLabel">{label}</dt>
      <dd style={styles.fieldValue} data-ui="IssueDetailPage.fieldValue">{children}</dd>
    </>
  );
}
