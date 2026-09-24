/**
 * Record types for the rows in `src/db/schema.sql`.
 *
 * Shapes mirror the source-of-truth tables in the monorepo (`apps/rapu` +
 * `packages/common/src/entity/schema`): raw, source-shaped rows with no computed
 * values on them. Everything the UI shows about time, progress and hierarchy is
 * derived in `src/domain`, standing in for rapu's materialized columns.
 *
 * Field names are camelCase here and snake_case in SQL; `src/data/repository.ts`
 * is the only place that knows about the difference.
 */

// --- enums, mirroring packages/common/src/enums.ts ---------------------------

export type IssueDataSource = 'Jira' | 'Linear' | 'AzureDevops' | 'Shortcut' | 'Github';

/** SwarmiaIssueStatus. Note WONT_DO: a terminal status that is not a completion. */
export type IssueStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'WONT_DO';

export type SwarmiaIssueType = 'Bug' | 'Epic' | 'Story' | 'Task';

export type AnnotationSource = 'Ui' | 'SwarmiaAi' | 'GithubBotPing';

/** The work item types that count as activity for flow efficiency. */
export type WorkItemType = 'Commit' | 'PullRequest' | 'Review' | 'Comment';

// --- records -----------------------------------------------------------------

export interface AuthorRecord {
  id: string;
  name: string;
  email: string;
}

export interface AuthorIdentityRecord {
  id: string;
  authorId: string;
}

/**
 * An installation with its status mapping already joined on, so callers get the
 * same shape whether the mapping is one row or three hundred.
 *
 * A source status missing from `statusMapping` has no Swarmia status — the null
 * that upstream's LEFT JOIN produces.
 */
export interface IssueSourceInstallationRecord {
  id: string;
  dataSource: IssueDataSource;
  siteUrl: string;
  statusMapping: Record<string, IssueStatus>;
}

export interface ProjectRecord {
  id: string;
  installationId: string;
  name: string;
  color: string;
}

export interface IssueRecord {
  id: string;
  installationId: string;
  projectId: string | null;
  parentIssueId: string | null;
  sourceId: string;
  sourceUrl: string;
  issueKey: string;
  sourceIssueType: string;
  sourceIssueTypeIconUrl: string | null;
  issueType: SwarmiaIssueType | null;
  priorityLabel: string | null;
  labels: string[];
  estimate: number | null;
  title: string;
  /** Markdown, as it comes from the tracker. */
  description: string | null;
  assigneeIdentityId: string | null;
  sourceCreatedAt: string;
  sourceUpdatedAt: string;
}

export interface IssueStatusPeriodRecord {
  id: string;
  issueId: string;
  sourceStatus: string;
  startedAt: string;
  /** Null while the issue is still in this status. */
  endedAt: string | null;
  /** Who moved the issue into this status. Drives the activity feed. */
  authorId: string;
}

export interface ActivityRecord {
  id: string;
  issueId: string;
  authorId: string;
  timestamp: string;
  workItemType: WorkItemType;
}

export interface EffortDailyRecord {
  id: string;
  issueId: string;
  authorId: string;
  date: string;
  fte: number;
}

export interface AnnotationRecord {
  id: string;
  targetEntityType: string;
  targetEntityId: string;
  content: string;
  source: AnnotationSource;
  authorId: string;
  timestamp: string;
}

/**
 * Status tally over an issue's subtree, the issue itself included — which is
 * what makes `isLeafIssue` equal `descendantIssueIds.length === 1`.
 *
 * An unmapped source status contributes to no bucket, so these need not sum to
 * the size of the subtree.
 */
export type DescendantStatusCounts = Record<IssueStatus, number>;
