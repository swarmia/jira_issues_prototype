import { GraphQLScalarType, Kind } from 'graphql';
import {
  annotations,
  annotationsOf,
  findAuthor,
  findAuthorByIdentity,
  findInstallation,
  findIssueByKey,
  findIssueById,
  findProject,
  installations,
  issues,
  nextAnnotationId,
  projects,
  viewerAuthorId,
  type AnnotationRecord,
  type AuthorRecord,
  type IssueRecord,
  type IssueStatus,
} from './data/store.js';
import { rollUpEffort } from './domain/effort.js';
import {
  childrenOfIssue,
  effortRowsFor,
  materializeIssue,
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
}

export function createContext(): RequestContext {
  return { now: new Date(), materialized: new Map() };
}

function view(issue: IssueRecord, context: RequestContext): MaterializedIssue {
  const cached = context.materialized.get(issue.id);
  if (cached) return cached;
  const materialized = materializeIssue(issue, context.now);
  context.materialized.set(issue.id, materialized);
  return materialized;
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

function requireIssue(issueKey: string): IssueRecord {
  const issue = findIssueByKey(issueKey);
  if (!issue) throw new Error(`Issue ${issueKey} not found`);
  return issue;
}

function matchesFilter(
  issue: IssueRecord,
  filter: { status?: IssueStatus; projectId?: string; search?: string } | null | undefined,
  context: RequestContext,
): boolean {
  if (!filter) return true;
  if (filter.projectId && issue.projectId !== filter.projectId) return false;
  if (filter.status && view(issue, context).status !== filter.status) return false;
  if (filter.search) {
    const needle = filter.search.trim().toLowerCase();
    // `searchableProperties: ['title', 'issueKey']` upstream.
    const haystack = `${issue.issueKey} ${issue.title}`.toLowerCase();
    if (needle && !haystack.includes(needle)) return false;
  }
  return true;
}

export const resolvers = {
  DateTime,

  Query: {
    issues: (
      _: unknown,
      args: { filter?: Parameters<typeof matchesFilter>[1] },
      context: RequestContext,
    ) =>
      issues
        .filter(issue => issue.parentIssueId === null)
        .filter(issue => matchesFilter(issue, args.filter, context)),
    issue: (_: unknown, args: { issueKey: string }) => findIssueByKey(args.issueKey) ?? null,
    projects: () => projects,
    viewer: () => withInitials(findAuthor(viewerAuthorId)),
  },

  Mutation: {
    addAnnotation: (_: unknown, args: { issueKey: string; content: string }) => {
      const content = args.content.trim();
      if (!content) throw new Error('An annotation needs content');
      const issue = requireIssue(args.issueKey);
      const annotation: AnnotationRecord = {
        id: nextAnnotationId(),
        targetEntityType: 'Issue',
        targetEntityId: issue.id,
        content,
        source: 'Ui',
        authorId: viewerAuthorId,
        timestamp: new Date().toISOString(),
      };
      annotations.push(annotation);
      return { issue, annotation };
    },
    deleteAnnotation: (_: unknown, args: { issueKey: string; annotationId: string }) => {
      const issue = requireIssue(args.issueKey);
      const index = annotations.findIndex(
        candidate => candidate.id === args.annotationId && candidate.targetEntityId === issue.id,
      );
      if (index >= 0) annotations.splice(index, 1);
      return issue;
    },
  },

  Issue: {
    dataSource: (issue: IssueRecord) => findInstallation(issue.installationId).dataSource,
    installation: (issue: IssueRecord) => findInstallation(issue.installationId),
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
    children: (issue: IssueRecord) => childrenOfIssue(issue.id),
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
      progressOf(childrenOfIssue(issue.id).map(child => view(child, context))),
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

export { installations };
