/**
 * In-memory stand-in for rapu's issue tables.
 *
 * The shapes here mirror the source-of-truth tables in the monorepo
 * (apps/rapu + packages/common/src/entity/schema): raw, source-shaped rows with
 * no computed values on them. Everything the UI shows about time, progress and
 * hierarchy is derived in `src/domain`, standing in for rapu's materialized
 * columns on `materialized_swarmia_issues`.
 *
 * Deliberately NOT stored, because upstream they are materialized:
 *   - `sourceIssueStatus` / `status`  -> latest status period
 *   - `startedAt` / `completedAt` / `finalStatusAt`
 *   - `inProgressPeriods` and every duration derived from it
 *   - `ancestorIds` / `descendantIds` / `isLeafIssue`
 *   - `scopeIncrease`, `flowEfficiency`
 */

import { randomUUID } from 'node:crypto';

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

/**
 * An author's identity in one issue source. Issues reference the identity, not
 * the author, and rapu resolves through `author_identities` — the same person
 * can have several identities across trackers.
 */
export interface AuthorIdentityRecord {
  id: string;
  authorId: string;
}

/**
 * The per-installation mapping of raw tracker statuses onto Swarmia statuses.
 * This is the "tell us which of your Jira columns mean in progress" setup step,
 * and it is why `IssueStatusPeriod.status` is nullable: a source status nobody
 * mapped has no Swarmia status, and contributes to no metric.
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

/**
 * One contiguous span the issue spent in one source status.
 *
 * Upstream this is the `issue_status_periods` table, built from the Jira status
 * changelog — it is stored, not derived at read time. `endedAt` is null while
 * the issue is still in the status (an unbounded `tstzrange` upper).
 */
export interface IssueStatusPeriodRecord {
  id: string;
  issueId: string;
  sourceStatus: string;
  startedAt: string;
  endedAt: string | null;
  /** Who moved the issue into this status. Drives the activity feed. */
  authorId: string;
}

/**
 * A work item recorded against an issue — a commit, PR, review or comment.
 * Activity is what flow efficiency counts, and it rolls up the ancestor chain,
 * so a commit on a child also marks its parent's day active.
 */
export interface ActivityRecord {
  id: string;
  issueId: string;
  authorId: string;
  timestamp: string;
  workItemType: WorkItemType;
}

/** A day of an author's FTE attributed to an issue. Rolls up the ancestor chain. */
export interface EffortDailyRecord {
  id: string;
  issueId: string;
  authorId: string;
  date: string;
  fte: number;
}

/** A user-written note. Upstream this is the polymorphic `Annotation` entity. */
export interface AnnotationRecord {
  id: string;
  targetEntityType: string;
  targetEntityId: string;
  content: string;
  source: AnnotationSource;
  authorId: string;
  timestamp: string;
}

// --- fixtures ----------------------------------------------------------------

export const authors: AuthorRecord[] = [
  { id: 'a-dima', name: 'Dima Egorov', email: 'dima@dummy.example' },
  { id: 'a-aino', name: 'Aino Virtanen', email: 'aino@dummy.example' },
  { id: 'a-marcus', name: 'Marcus Reed', email: 'marcus@dummy.example' },
  { id: 'a-sara', name: 'Sara Lindqvist', email: 'sara@dummy.example' },
];

export const authorIdentities: AuthorIdentityRecord[] = authors.map(author => ({
  id: `ai-${author.id.slice(2)}`,
  authorId: author.id,
}));

export const installations: IssueSourceInstallationRecord[] = [
  {
    id: 'inst-jira',
    dataSource: 'Jira',
    siteUrl: 'https://dummy.atlassian.net',
    // "Waiting for QA" is deliberately absent: an unmapped source status, which
    // resolves to a null Swarmia status and counts towards no metric.
    statusMapping: {
      Backlog: 'TODO',
      'Selected for development': 'TODO',
      'In Progress': 'IN_PROGRESS',
      'In Review': 'IN_PROGRESS',
      Blocked: 'IN_PROGRESS',
      Done: 'DONE',
      "Won't do": 'WONT_DO',
    },
  },
];

export const projects: ProjectRecord[] = [
  { id: 'p-new-things', installationId: 'inst-jira', name: 'New things', color: 'var(--dataLightblue)' },
  { id: 'p-platform', installationId: 'inst-jira', name: 'Platform health', color: 'var(--dataPink)' },
  { id: 'p-growth', installationId: 'inst-jira', name: 'Growth', color: 'var(--dataYellow)' },
];

export const viewerAuthorId = 'a-dima';

export const issues: IssueRecord[] = [];
export const issueStatusPeriods: IssueStatusPeriodRecord[] = [];
export const activities: ActivityRecord[] = [];
export const effortDaily: EffortDailyRecord[] = [];
export const annotations: AnnotationRecord[] = [];

// --- lookups -----------------------------------------------------------------

export function findIssueByKey(issueKey: string): IssueRecord | undefined {
  return issues.find(issue => issue.issueKey.toLowerCase() === issueKey.toLowerCase());
}

export function findIssueById(id: string): IssueRecord | undefined {
  return issues.find(issue => issue.id === id);
}

export function findAuthor(id: string): AuthorRecord | undefined {
  return authors.find(author => author.id === id);
}

export function findAuthorByIdentity(identityId: string | null): AuthorRecord | undefined {
  if (!identityId) return undefined;
  const identity = authorIdentities.find(candidate => candidate.id === identityId);
  return identity ? findAuthor(identity.authorId) : undefined;
}

export function findInstallation(id: string): IssueSourceInstallationRecord {
  const installation = installations.find(candidate => candidate.id === id);
  if (!installation) throw new Error(`Unknown installation: ${id}`);
  return installation;
}

export function findProject(id: string | null): ProjectRecord | undefined {
  return id ? projects.find(project => project.id === id) : undefined;
}

export function statusPeriodsOf(issueId: string): IssueStatusPeriodRecord[] {
  return issueStatusPeriods
    .filter(period => period.issueId === issueId)
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt));
}

export function childrenOf(issueId: string): IssueRecord[] {
  return issues.filter(issue => issue.parentIssueId === issueId);
}

export function annotationsOf(issueId: string): AnnotationRecord[] {
  return annotations
    .filter(note => note.targetEntityType === 'Issue' && note.targetEntityId === issueId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function nextAnnotationId(): string {
  return randomUUID();
}
