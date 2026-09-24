/**
 * Bridges GraphQL fields to stored records and request-scoped derivation. List
 * filters are passed to the repository before roots enter the materialization
 * cache, preserving one batched derivation pass for every page of results.
 */
import { GraphQLScalarType, Kind } from 'graphql';
import {
  annotationsOf,
  deleteAnnotation,
  findAuthor,
  findAuthorByIdentity,
  findIssueById,
  findIssueByKey,
  findProject,
  getInstallations,
  getProjects,
  getRootIssues,
  insertAnnotation,
  viewerAuthorId,
} from './data/repository.js';
import type {
  AnnotationRecord,
  AuthorRecord,
  IssueRecord,
  IssueStatus,
} from './data/types.js';
import { rollUpEffort } from './domain/effort.js';
import {
  effortRowsFor,
  materializeSubtrees,
  type MaterializedIssue,
} from './domain/issue.js';
import { progressOf } from './domain/progress.js';
import { durationSeconds } from './domain/ranges.js';
import { statusTransitionsOf } from './domain/transitions.js';

/**
 * One clock and one materialization cache per request.
 *
 * Both matter: every duration on an open range is measured against `now`, so a
 * single response must use one value or `lifetimeSeconds` and the status-period
 * durations can disagree. The cache also keeps the subtree walk from being
 * repeated for every field a query asks for.
 */
export interface RequestContext {
  now: Date;
  materialized: Map<string, MaterializedIssue>;
  /**
   * Issues the current query is about, recorded before anything derived is
   * asked for. The first field that needs derivation derives all of them at
   * once; a query that only reads stored columns never derives anything.
   */
  pendingRoots: IssueRecord[];
}

export function createContext(): RequestContext {
  return { now: new Date(), materialized: new Map(), pendingRoots: [] };
}

/**
 * Derive an issue, pulling its whole subtree into the request cache as it goes.
 *
 * A query that asks for an issue nearly always goes on to ask about its
 * children, and deriving the parent already requires the subtree — so one
 * seven-query pass serves all of them, and the children are cache hits.
 */
function view(issue: IssueRecord, context: RequestContext): MaterializedIssue {
  const cached = context.materialized.get(issue.id);
  if (cached) return cached;

  // Fold in whatever else this query is about, so a list page costs one pass.
  const pending = context.pendingRoots;
  context.pendingRoots = [];
  warm([issue, ...pending], context);

  const found = context.materialized.get(issue.id);
  if (!found) throw new Error(`Could not derive issue ${issue.issueKey}`);
  return found;
}

/** Derive a set of issues and their subtrees in one pass, into the request cache. */
function warm(issues: readonly IssueRecord[], context: RequestContext): void {
  const missing = issues.filter(issue => !context.materialized.has(issue.id));
  if (missing.length === 0) return;

  for (const [id, materialized] of materializeSubtrees(
    missing.map(issue => issue.id),
    context.now,
  )) {
    context.materialized.set(id, materialized);
  }
}

/**
 * Direct children, read out of the subtree `view` already loaded rather than
 * queried again — `children` and `progress` both want them.
 */
function childrenOf(issue: IssueRecord, context: RequestContext): IssueRecord[] {
  view(issue, context);
  return [...context.materialized.values()]
    .map(materialized => materialized.record)
    .filter(record => record.parentIssueId === issue.id)
    .sort((a, b) => a.sourceCreatedAt.localeCompare(b.sourceCreatedAt));
}

const DateTime = new GraphQLScalarType<Date | null, string | null>({
  name: 'DateTime',
  description: 'An ISO-8601 timestamp.',
  serialize(value) {
    if (value == null) return null;
    const date = value instanceof Date ? value : new Date(String(value));
    return date.toISOString();
  },
  parseValue(value) {
    return new Date(String(value));
  },
  parseLiteral(node) {
    return node.kind === Kind.STRING ? new Date(node.value) : null;
  },
});

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]!.toUpperCase())
    .join('');
}

function withInitials(author: AuthorRecord | undefined) {
  return author ? { ...author, initials: initials(author.name) } : null;
}

function requireInstallation(id: string) {
  const installation = getInstallations().find(candidate => candidate.id === id);
  if (!installation) throw new Error(`Unknown installation: ${id}`);
  return installation;
}

function requireIssue(issueKey: string): IssueRecord {
  const issue = findIssueByKey(issueKey);
  if (!issue) throw new Error(`Issue ${issueKey} not found`);
  return issue;
}

export const resolvers = {
  DateTime,

  Query: {
    // Filtered in SQL, statuses included: the `issue_current_status` view means an
    // issue can be excluded without deriving anything for it.
    issues: (
      _: unknown,
      args: { filter?: { statuses?: IssueStatus[]; projectId?: string; search?: string } },
      context: RequestContext,
    ) => {
      const roots = getRootIssues(args.filter);
      // Not derived yet — only recorded. If the query goes on to ask for a
      // derived field, the first one pulls the whole page through in one pass.
      context.pendingRoots = roots;
      return roots;
    },
    issue: (_: unknown, args: { issueKey: string }) => findIssueByKey(args.issueKey) ?? null,
    projects: () => getProjects(),
    viewer: () => withInitials(findAuthor(viewerAuthorId)),
  },

  Mutation: {
    addAnnotation: (_: unknown, args: { issueKey: string; content: string }) => {
      const content = args.content.trim();
      if (!content) throw new Error('An annotation needs content');
      const issue = requireIssue(args.issueKey);
      const annotation = insertAnnotation({
        targetEntityType: 'Issue',
        targetEntityId: issue.id,
        content,
        source: 'Ui',
        authorId: viewerAuthorId,
        timestamp: new Date().toISOString(),
      });
      return { issue, annotation };
    },
    deleteAnnotation: (_: unknown, args: { issueKey: string; annotationId: string }) => {
      const issue = requireIssue(args.issueKey);
      deleteAnnotation(issue.id, args.annotationId);
      return issue;
    },
  },

  Issue: {
    dataSource: (issue: IssueRecord) => requireInstallation(issue.installationId).dataSource,
    installation: (issue: IssueRecord) => requireInstallation(issue.installationId),
    project: (issue: IssueRecord) => findProject(issue.projectId) ?? null,
    assignee: (issue: IssueRecord) => withInitials(findAuthorByIdentity(issue.assigneeIdentityId)),
    createdAt: (issue: IssueRecord) => new Date(issue.sourceCreatedAt),
    updatedAt: (issue: IssueRecord) => new Date(issue.sourceUpdatedAt),

    sourceIssueStatus: (issue: IssueRecord, _: unknown, context: RequestContext) =>
      view(issue, context).sourceIssueStatus,
    status: (issue: IssueRecord, _: unknown, context: RequestContext) =>
      view(issue, context).status,
    startedAt: (issue: IssueRecord, _: unknown, context: RequestContext) =>
      view(issue, context).startedAt,
    completedAt: (issue: IssueRecord, _: unknown, context: RequestContext) =>
      view(issue, context).completedAt,
    finalStatusAt: (issue: IssueRecord, _: unknown, context: RequestContext) =>
      view(issue, context).finalStatusAt,
    inProgressPeriods: (issue: IssueRecord, _: unknown, context: RequestContext) =>
      view(issue, context).inProgressPeriods,
    inProgressTimeSeconds: (issue: IssueRecord, _: unknown, context: RequestContext) =>
      view(issue, context).inProgressTimeSeconds,
    ageSeconds: (issue: IssueRecord, _: unknown, context: RequestContext) =>
      view(issue, context).ageSeconds,
    lifetimeSeconds: (issue: IssueRecord, _: unknown, context: RequestContext) =>
      view(issue, context).lifetimeSeconds,
    flowEfficiency: (issue: IssueRecord, _: unknown, context: RequestContext) =>
      view(issue, context).flowEfficiency,
    activityStatistics: (issue: IssueRecord, _: unknown, context: RequestContext) =>
      view(issue, context).activityStatistics,

    scopeIncrease: (issue: IssueRecord, _: unknown, context: RequestContext) =>
      view(issue, context).scopeCreep.scopeIncrease,
    initialIssueCount: (issue: IssueRecord, _: unknown, context: RequestContext) =>
      view(issue, context).scopeCreep.initialIssueCount,
    creepedIssueCount: (issue: IssueRecord, _: unknown, context: RequestContext) =>
      view(issue, context).scopeCreep.creepedIssueCount,

    parentIssue: (issue: IssueRecord) =>
      issue.parentIssueId ? (findIssueById(issue.parentIssueId) ?? null) : null,
    children: (issue: IssueRecord, _: unknown, context: RequestContext) =>
      childrenOf(issue, context),
    isLeafIssue: (issue: IssueRecord, _: unknown, context: RequestContext) =>
      view(issue, context).isLeafIssue,
    descendantStatusCounts: (issue: IssueRecord, _: unknown, context: RequestContext) => {
      const counts = view(issue, context).descendantStatusCounts;
      return {
        todo: counts.TODO,
        inProgress: counts.IN_PROGRESS,
        done: counts.DONE,
        wontDo: counts.WONT_DO,
      };
    },

    statusPeriods: (issue: IssueRecord, _: unknown, context: RequestContext) =>
      view(issue, context).statusPeriods,
    statusTransitions: (issue: IssueRecord, _: unknown, context: RequestContext) =>
      statusTransitionsOf(view(issue, context).statusPeriods),
    progress: (issue: IssueRecord, _: unknown, context: RequestContext) =>
      progressOf(childrenOf(issue, context).map(child => view(child, context))),
    effort: (issue: IssueRecord, _: unknown, context: RequestContext) =>
      rollUpEffort(effortRowsFor(view(issue, context).descendantIssueIds)),
    annotations: (issue: IssueRecord) => annotationsOf(issue.id),
  },

  IssueStatusPeriod: {
    durationInSeconds: (
      period: MaterializedIssue['statusPeriods'][number],
      _: unknown,
      context: RequestContext,
    ) => durationSeconds(period.period, context.now),
    isCurrent: (period: MaterializedIssue['statusPeriods'][number]) => period.period.end === null,
    author: (period: MaterializedIssue['statusPeriods'][number]) =>
      withInitials(findAuthor(period.authorId)),
  },

  EffortContributor: {
    author: (contributor: { authorId: string }) => withInitials(findAuthor(contributor.authorId)),
  },

  Annotation: {
    author: (annotation: AnnotationRecord) => withInitials(findAuthor(annotation.authorId)),
    timestamp: (annotation: AnnotationRecord) => new Date(annotation.timestamp),
  },

  IssueSourceInstallation: {
    dataSource: (installation: { dataSource: string }) => installation.dataSource,
  },
};
