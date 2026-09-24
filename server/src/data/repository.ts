/**
 * Every SQL statement in the app lives here. Callers get the camelCase record
 * types from `./types.ts` and never see a column name.
 *
 * Reads that feed the derivation (issues, status periods, activity, effort) are
 * loaded whole and cached by `src/domain/issue.ts`: the seeded data is immutable
 * at runtime, the working set is small, and the hierarchy walk needs the tree
 * anyway. Annotations — the only table this app writes to — are always queried
 * fresh.
 */

import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { db } from '../db/database.js';
import type {
  AnnotationRecord,
  ActivityRecord,
  DescendantStatusCounts,
  AuthorRecord,
  EffortDailyRecord,
  IssueRecord,
  IssueSourceInstallationRecord,
  IssueStatus,
  IssueStatusPeriodRecord,
  ProjectRecord,
  SwarmiaIssueType,
} from './types.js';

export interface GeneratedDataBatch {
  authors: AuthorRecord[];
  projects: ProjectRecord[];
  issues: IssueRecord[];
  statusPeriods: IssueStatusPeriodRecord[];
  activities: ActivityRecord[];
  effortDaily: EffortDailyRecord[];
}

/** Reserve a new numeric suffix without touching the hand-written fixture keys. */
export function nextGeneratedIssueNumber(connection: DatabaseSync): number {
  const row = connection.prepare(
    `SELECT COALESCE(MAX(CAST(SUBSTR(id, 17) AS INTEGER)), 0) + 1 AS next
     FROM issues WHERE id LIKE 'generated-issue-%'`,
  ).get() as { next: number };
  return row.next;
}

/** Insert source facts only. The caller owns the transaction. */
export function insertGeneratedData(connection: DatabaseSync, batch: GeneratedDataBatch): void {
  const author = connection.prepare('INSERT OR IGNORE INTO authors (id, name, email) VALUES (?, ?, ?)');
  const identity = connection.prepare('INSERT OR IGNORE INTO author_identities (id, author_id) VALUES (?, ?)');
  for (const row of batch.authors) {
    author.run(row.id, row.name, row.email);
    identity.run(`ai-${row.id}`, row.id);
  }

  const project = connection.prepare(
    'INSERT OR IGNORE INTO projects (id, installation_id, name, color) VALUES (?, ?, ?, ?)',
  );
  for (const row of batch.projects) project.run(row.id, row.installationId, row.name, row.color);

  const issue = connection.prepare(`INSERT INTO issues (
    id, installation_id, project_id, parent_issue_id, source_id, source_url, issue_key,
    source_issue_type, source_issue_type_icon_url, issue_type, priority_label, labels,
    estimate, title, description, assignee_identity_id, source_created_at, source_updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const row of batch.issues) issue.run(
    row.id, row.installationId, row.projectId, row.parentIssueId, row.sourceId,
    row.sourceUrl, row.issueKey, row.sourceIssueType, row.sourceIssueTypeIconUrl,
    row.issueType, row.priorityLabel, JSON.stringify(row.labels), row.estimate,
    row.title, row.description, row.assigneeIdentityId, row.sourceCreatedAt, row.sourceUpdatedAt,
  );

  const period = connection.prepare(`INSERT INTO issue_status_periods
    (id, issue_id, source_status, started_at, ended_at, author_id) VALUES (?, ?, ?, ?, ?, ?)`);
  for (const row of batch.statusPeriods) period.run(
    row.id, row.issueId, row.sourceStatus, row.startedAt, row.endedAt, row.authorId,
  );

  const activity = connection.prepare(`INSERT INTO activities
    (id, issue_id, author_id, timestamp, work_item_type) VALUES (?, ?, ?, ?, ?)`);
  for (const row of batch.activities) activity.run(
    row.id, row.issueId, row.authorId, row.timestamp, row.workItemType,
  );

  const effort = connection.prepare(`INSERT INTO effort_daily
    (id, issue_id, author_id, date, fte) VALUES (?, ?, ?, ?, ?)`);
  for (const row of batch.effortDaily) effort.run(
    row.id, row.issueId, row.authorId, row.date, row.fte,
  );
}

/** Whoever is "me" in this prototype. Upstream this comes from the session. */
export const viewerAuthorId = 'a-dima';

type Row = Record<string, unknown>;

/** Set DEBUG_SQL=1 to print every statement, to check a page's query count. */
const debugSql = process.env.DEBUG_SQL === '1';
let queryCount = 0;

export const sqlStats = {
  get count() {
    return queryCount;
  },
  reset() {
    queryCount = 0;
  },
};

const query = <T>(sql: string, parameters: unknown[], map: (row: Row) => T): T[] => {
  queryCount += 1;
  if (debugSql) {
    console.log(`[sql ${queryCount}] ${sql.trim().split('\n')[0]?.trim()} …`, parameters);
  }
  return (db()
    .prepare(sql)
    .all(...(parameters as never[])) as Row[]).map(map);
};

// --- mappers -----------------------------------------------------------------

const toAuthor = (row: Row): AuthorRecord => ({
  id: row.id as string,
  name: row.name as string,
  email: row.email as string,
});

const toProject = (row: Row): ProjectRecord => ({
  id: row.id as string,
  installationId: row.installation_id as string,
  name: row.name as string,
  color: row.color as string,
});

const toIssue = (row: Row): IssueRecord => ({
  id: row.id as string,
  installationId: row.installation_id as string,
  projectId: (row.project_id as string | null) ?? null,
  parentIssueId: (row.parent_issue_id as string | null) ?? null,
  sourceId: row.source_id as string,
  sourceUrl: row.source_url as string,
  issueKey: row.issue_key as string,
  sourceIssueType: row.source_issue_type as string,
  sourceIssueTypeIconUrl: (row.source_issue_type_icon_url as string | null) ?? null,
  issueType: (row.issue_type as SwarmiaIssueType | null) ?? null,
  priorityLabel: (row.priority_label as string | null) ?? null,
  // Arrays are JSON text in SQLite.
  labels: JSON.parse(row.labels as string) as string[],
  estimate: (row.estimate as number | null) ?? null,
  title: row.title as string,
  description: (row.description as string | null) ?? null,
  assigneeIdentityId: (row.assignee_identity_id as string | null) ?? null,
  sourceCreatedAt: row.source_created_at as string,
  sourceUpdatedAt: row.source_updated_at as string,
});

const toStatusPeriod = (row: Row): IssueStatusPeriodRecord => ({
  id: row.id as string,
  issueId: row.issue_id as string,
  sourceStatus: row.source_status as string,
  startedAt: row.started_at as string,
  endedAt: (row.ended_at as string | null) ?? null,
  authorId: row.author_id as string,
});

const toEffortDaily = (row: Row): EffortDailyRecord => ({
  id: row.id as string,
  issueId: row.issue_id as string,
  authorId: row.author_id as string,
  date: row.date as string,
  fte: row.fte as number,
});

const toAnnotation = (row: Row): AnnotationRecord => ({
  id: row.id as string,
  targetEntityType: row.target_entity_type as string,
  targetEntityId: row.target_entity_id as string,
  content: row.content as string,
  source: row.source as AnnotationRecord['source'],
  authorId: row.author_id as string,
  timestamp: row.timestamp as string,
});

// --- reference data ----------------------------------------------------------

export function getAuthors(): AuthorRecord[] {
  return query('SELECT id, name, email FROM authors ORDER BY name', [], toAuthor);
}

export function findAuthor(id: string): AuthorRecord | undefined {
  return query('SELECT id, name, email FROM authors WHERE id = ?', [id], toAuthor)[0];
}

export function findAuthorByIdentity(identityId: string | null): AuthorRecord | undefined {
  if (!identityId) return undefined;
  return query(
    `SELECT authors.id, authors.name, authors.email
     FROM authors
     JOIN author_identities ON author_identities.author_id = authors.id
     WHERE author_identities.id = ?`,
    [identityId],
    toAuthor,
  )[0];
}

export function getProjects(): ProjectRecord[] {
  return query(
    'SELECT id, installation_id, name, color FROM projects ORDER BY name',
    [],
    toProject,
  );
}

export function findProject(id: string | null): ProjectRecord | undefined {
  if (!id) return undefined;
  return query(
    'SELECT id, installation_id, name, color FROM projects WHERE id = ?',
    [id],
    toProject,
  )[0];
}

/**
 * Installations with their status mapping joined on.
 *
 * Upstream the mapping is resolved per read rather than materialized, so that
 * remapping a status takes effect immediately instead of needing every affected
 * status period recomputed. Same idea here: the mapping is data, not code.
 */
export function getInstallations(): IssueSourceInstallationRecord[] {
  const byId = new Map<string, IssueSourceInstallationRecord>();

  const rows = query(
    `SELECT
       installations.id, installations.data_source, installations.site_url,
       mappings.source_status, mappings.swarmia_status
     FROM issue_source_installations installations
     LEFT JOIN issue_status_mappings mappings
       ON mappings.installation_id = installations.id`,
    [],
    row => ({
      id: row.id as string,
      dataSource: row.data_source as IssueSourceInstallationRecord['dataSource'],
      siteUrl: row.site_url as string,
      sourceStatus: row.source_status as string | null,
      swarmiaStatus: row.swarmia_status as IssueStatus | null,
    }),
  );

  for (const row of rows) {
    const installation =
      byId.get(row.id) ??
      { id: row.id, dataSource: row.dataSource, siteUrl: row.siteUrl, statusMapping: {} };
    // LEFT JOIN: an installation with no mappings configured still comes back,
    // with every source status unmapped.
    if (row.sourceStatus && row.swarmiaStatus) {
      installation.statusMapping[row.sourceStatus] = row.swarmiaStatus;
    }
    byId.set(row.id, installation);
  }

  return [...byId.values()];
}

// --- issues ------------------------------------------------------------------

const ISSUE_COLUMNS = `
  id, installation_id, project_id, parent_issue_id, source_id, source_url, issue_key,
  source_issue_type, source_issue_type_icon_url, issue_type, priority_label, labels,
  estimate, title, description, assignee_identity_id, source_created_at, source_updated_at
`;

/** `?, ?, ?` for an IN clause — node:sqlite has no array binding. */
const placeholders = (count: number) => new Array(count).fill('?').join(', ');

export function findIssueByKey(issueKey: string): IssueRecord | undefined {
  return query(
    `SELECT ${ISSUE_COLUMNS} FROM issues WHERE issue_key = ? COLLATE NOCASE`,
    [issueKey],
    toIssue,
  )[0];
}

export function findIssueById(id: string): IssueRecord | undefined {
  return query(`SELECT ${ISSUE_COLUMNS} FROM issues WHERE id = ?`, [id], toIssue)[0];
}

export function getIssuesByIds(ids: readonly string[]): IssueRecord[] {
  if (ids.length === 0) return [];
  return query(
    `SELECT ${ISSUE_COLUMNS} FROM issues WHERE id IN (${placeholders(ids.length)})`,
    [...ids],
    toIssue,
  );
}

/**
 * Top-level issues, filtered in SQL.
 *
 * Status filtering goes through the `issue_current_status` view, so an issue is
 * excluded before anything is derived for it — previously every issue had to be
 * materialized just to find out what its status was. An empty status selection
 * imposes no condition, allowing unmapped issues to appear in the full list.
 */
export function getRootIssues(filter?: {
  statuses?: IssueStatus[] | null;
  projectId?: string | null;
  search?: string | null;
}): IssueRecord[] {
  const conditions = ['issues.parent_issue_id IS NULL'];
  const parameters: unknown[] = [];

  if (filter?.projectId) {
    conditions.push('issues.project_id = ?');
    parameters.push(filter.projectId);
  }
  if (filter?.statuses?.length) {
    conditions.push(`status.status IN (${placeholders(filter.statuses.length)})`);
    parameters.push(...filter.statuses);
  }
  const search = filter?.search?.trim();
  if (search) {
    // `searchableProperties: ['title', 'issueKey']` upstream.
    conditions.push('(issues.title LIKE ? COLLATE NOCASE OR issues.issue_key LIKE ? COLLATE NOCASE)');
    parameters.push(`%${search}%`, `%${search}%`);
  }

  return query(
    `SELECT ${ISSUE_COLUMNS.split(',')
      .map(column => `issues.${column.trim()}`)
      .join(', ')}
     FROM issues
     JOIN issue_current_status status ON status.issue_id = issues.id
     WHERE ${conditions.join(' AND ')}
     ORDER BY issues.source_updated_at DESC`,
    parameters,
    toIssue,
  );
}

// --- hierarchy: rapu's `ancestors` and `descendants` column groups -----------

/**
 * `descendant_ids` for several issues at once — each list includes its own issue.
 *
 * Ordering matches upstream, which builds the array as
 * `[self, ...children.flatMap(c => [c.id, ...c.descendantIds])]` — depth-first
 * pre-order. `path` is what produces that: sorting by it walks each branch to
 * the bottom before starting the next, where a plain recursive CTE would come
 * back breadth-first.
 */
export function getDescendantIds(ids: readonly string[]): Map<string, string[]> {
  const result = new Map<string, string[]>(ids.map(id => [id, []]));
  if (ids.length === 0) return result;

  const rows = query(
    `WITH RECURSIVE subtree(root_id, id, path) AS (
       SELECT id, id, id FROM issues WHERE id IN (${placeholders(ids.length)})
       UNION ALL
       SELECT subtree.root_id, issues.id, subtree.path || '/' || issues.id
       FROM issues
       JOIN subtree ON issues.parent_issue_id = subtree.id
     )
     SELECT root_id, id FROM subtree ORDER BY root_id, path`,
    [...ids],
    row => ({ rootId: row.root_id as string, id: row.id as string }),
  );
  for (const row of rows) result.get(row.rootId)?.push(row.id);
  return result;
}

/**
 * `ancestor_ids` for several issues at once: the direct parent first, up to the
 * root, never including the issue itself. `depth` reproduces that order.
 */
export function getAncestorIds(ids: readonly string[]): Map<string, string[]> {
  const result = new Map<string, string[]>(ids.map(id => [id, []]));
  if (ids.length === 0) return result;

  const rows = query(
    `WITH RECURSIVE chain(start_id, ancestor_id, depth) AS (
       SELECT id, parent_issue_id, 1
       FROM issues
       WHERE id IN (${placeholders(ids.length)}) AND parent_issue_id IS NOT NULL
       UNION ALL
       SELECT chain.start_id, issues.parent_issue_id, chain.depth + 1
       FROM issues
       JOIN chain ON issues.id = chain.ancestor_id
       WHERE issues.parent_issue_id IS NOT NULL
     )
     SELECT start_id, ancestor_id, depth FROM chain ORDER BY start_id, depth`,
    [...ids],
    row => ({ startId: row.start_id as string, ancestorId: row.ancestor_id as string }),
  );
  for (const row of rows) result.get(row.startId)?.push(row.ancestorId);
  return result;
}

/**
 * rapu's `descendantStatusCounts`: the status tally over each issue's subtree,
 * the issue itself included. Counted in SQL over the `issue_current_status`
 * view, so an unmapped status contributes to nothing — the same `if (status)`
 * guard the upstream column applies, expressed as `WHERE status IS NOT NULL`.
 */
export function getDescendantStatusCounts(
  ids: readonly string[],
): Map<string, DescendantStatusCounts> {
  const result = new Map<string, DescendantStatusCounts>(
    ids.map(id => [id, { TODO: 0, IN_PROGRESS: 0, DONE: 0, WONT_DO: 0 }]),
  );
  if (ids.length === 0) return result;

  const rows = query(
    `WITH RECURSIVE subtree(root_id, id) AS (
       SELECT id, id FROM issues WHERE id IN (${placeholders(ids.length)})
       UNION ALL
       SELECT subtree.root_id, issues.id
       FROM issues
       JOIN subtree ON issues.parent_issue_id = subtree.id
     )
     SELECT subtree.root_id, current.status, count(*) AS count
     FROM subtree
     JOIN issue_current_status current ON current.issue_id = subtree.id
     WHERE current.status IS NOT NULL
     GROUP BY subtree.root_id, current.status`,
    [...ids],
    row => ({
      rootId: row.root_id as string,
      status: row.status as IssueStatus,
      count: row.count as number,
    }),
  );
  for (const row of rows) {
    const counts = result.get(row.rootId);
    if (counts) counts[row.status] = row.count;
  }
  return result;
}

// --- per-issue detail --------------------------------------------------------

export function getStatusPeriodsForIssues(
  ids: readonly string[],
): IssueStatusPeriodRecord[] {
  if (ids.length === 0) return [];
  return query(
    `SELECT id, issue_id, source_status, started_at, ended_at, author_id
     FROM issue_status_periods
     WHERE issue_id IN (${placeholders(ids.length)})
     ORDER BY issue_id, started_at`,
    [...ids],
    toStatusPeriod,
  );
}

/**
 * Activity across a set of issues, as `(issueId, timestamp)` pairs.
 *
 * Only the timestamp is selected beyond the grouping key: flow efficiency counts
 * days, and nothing downstream looks at who did what or which kind of work item
 * it was. The issue id comes back so one query can serve every issue in a
 * subtree — each one unions the rows of its own descendants.
 */
export function getActivityForIssues(
  ids: readonly string[],
): { issueId: string; timestamp: string }[] {
  if (ids.length === 0) return [];
  return query(
    `SELECT issue_id, timestamp
     FROM activities
     WHERE issue_id IN (${placeholders(ids.length)})
     ORDER BY timestamp`,
    [...ids],
    row => ({ issueId: row.issue_id as string, timestamp: row.timestamp as string }),
  );
}

export function getEffortDailyForIssues(ids: readonly string[]): EffortDailyRecord[] {
  if (ids.length === 0) return [];
  return query(
    `SELECT id, issue_id, author_id, date, fte
     FROM effort_daily
     WHERE issue_id IN (${placeholders(ids.length)})`,
    [...ids],
    toEffortDaily,
  );
}

// --- annotations: the only writes ------------------------------------------

export function annotationsOf(issueId: string): AnnotationRecord[] {
  return query(
    `SELECT id, target_entity_type, target_entity_id, content, source, author_id, timestamp
     FROM annotations
     WHERE target_entity_type = 'Issue' AND target_entity_id = ?
     ORDER BY timestamp DESC`,
    [issueId],
    toAnnotation,
  );
}

export function insertAnnotation(annotation: Omit<AnnotationRecord, 'id'>): AnnotationRecord {
  const record: AnnotationRecord = { id: randomUUID(), ...annotation };
  db()
    .prepare(
      `INSERT INTO annotations
         (id, target_entity_type, target_entity_id, content, source, author_id, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      record.id,
      record.targetEntityType,
      record.targetEntityId,
      record.content,
      record.source,
      record.authorId,
      record.timestamp,
    );
  return record;
}

export function deleteAnnotation(issueId: string, annotationId: string): void {
  db()
    .prepare(
      `DELETE FROM annotations
       WHERE id = ? AND target_entity_type = 'Issue' AND target_entity_id = ?`,
    )
    .run(annotationId, issueId);
}
