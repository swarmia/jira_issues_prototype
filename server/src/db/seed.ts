/**
 * Seed data, written in the source-shaped form rapu stores.
 *
 * Parent issues carry a hand-written status-period history. Their children are
 * written compactly and expanded into periods below, because the interesting
 * thing about a child is when it was created, started and finished — those three
 * dates drive the parent's progress, burn-up and scope creep.
 *
 * Activity and daily effort are generated from each issue's in-progress window
 * with a seeded PRNG, so flow efficiency has a realistic scatter of active and
 * idle days while staying identical across restarts. Everything else is literal.
 *
 * The specs below expand into plain record arrays first and are inserted at the
 * bottom in one pass, so the shape of the fixture data stays readable and the
 * SQL stays in one place.
 */

import type { DatabaseSync } from 'node:sqlite';
import type {
  ActivityRecord,
  AnnotationRecord,
  EffortDailyRecord,
  IssueRecord,
  IssueStatus,
  IssueStatusPeriodRecord,
  SwarmiaIssueType,
  WorkItemType,
} from '../data/types.js';

const authors = [
  { id: 'a-dima', name: 'Dima Egorov', email: 'dima@dummy.example' },
  { id: 'a-aino', name: 'Aino Virtanen', email: 'aino@dummy.example' },
  { id: 'a-marcus', name: 'Marcus Reed', email: 'marcus@dummy.example' },
  { id: 'a-sara', name: 'Sara Lindqvist', email: 'sara@dummy.example' },
];

const authorIdentities = authors.map(author => ({
  id: `ai-${author.id.slice(2)}`,
  authorId: author.id,
}));

/**
 * The per-installation status mapping — rapu's `jira_issue_status_mappings`.
 * "Waiting for QA" is deliberately absent: an unmapped source status, which
 * resolves to a null Swarmia status and counts towards no metric.
 */
const statusMappings: { sourceStatus: string; swarmiaStatus: IssueStatus }[] = [
  { sourceStatus: 'Backlog', swarmiaStatus: 'TODO' },
  { sourceStatus: 'Selected for development', swarmiaStatus: 'TODO' },
  { sourceStatus: 'In Progress', swarmiaStatus: 'IN_PROGRESS' },
  { sourceStatus: 'In Review', swarmiaStatus: 'IN_PROGRESS' },
  { sourceStatus: 'Blocked', swarmiaStatus: 'IN_PROGRESS' },
  { sourceStatus: 'Done', swarmiaStatus: 'DONE' },
  { sourceStatus: "Won't do", swarmiaStatus: 'WONT_DO' },
];

const projects = [
  { id: 'p-new-things', installationId: 'inst-jira', name: 'New things', color: 'var(--dataLightblue)' },
  { id: 'p-platform', installationId: 'inst-jira', name: 'Platform health', color: 'var(--dataPink)' },
  { id: 'p-growth', installationId: 'inst-jira', name: 'Growth', color: 'var(--dataYellow)' },
];

const issues: IssueRecord[] = [];
const issueStatusPeriods: IssueStatusPeriodRecord[] = [];
const activities: ActivityRecord[] = [];
const effortDaily: EffortDailyRecord[] = [];
const annotations: AnnotationRecord[] = [];

const INSTALLATION_ID = 'inst-jira';
const SITE = 'https://dummy.atlassian.net';

interface ChildSpec {
  title: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  authorId: string;
  estimate?: number;
}

interface PeriodSpec {
  sourceStatus: string;
  startedAt: string;
  authorId: string;
}

interface IssueSpec {
  issueKey: string;
  title: string;
  issueType: SwarmiaIssueType;
  sourceIssueType: string;
  projectId: string;
  assigneeAuthorId: string;
  description: string;
  priorityLabel: string | null;
  labels: string[];
  estimate: number | null;
  /** Consecutive spans; each ends where the next begins, the last stays open. */
  periods: PeriodSpec[];
  children: ChildSpec[];
  notes?: { content: string; authorId: string; timestamp: string }[];
}

const SPECS: IssueSpec[] = [
  {
    issueKey: 'DUM-8829',
    title: 'Jira Connect -> Forge migration',
    issueType: 'Story',
    sourceIssueType: 'Story',
    projectId: 'p-new-things',
    assigneeAuthorId: 'a-dima',
    priorityLabel: 'High',
    labels: ['forge', 'migration', 'platform'],
    estimate: 13,
    description: [
      'Atlassian is deprecating Connect apps on March 31, 2026. After this date, we cannot update our Jira integration via Connect descriptors. We must migrate to Forge. **Good news:** this is an **incremental migration** — no rewrite needed. We wrap our existing Connect app in a Forge manifest while keeping all backend code unchanged. **Impact:** zero downtime, no customer disruption, all existing functionality continues to work.',
      'Scope: Forge manifest, app installation flow, webhook re-registration, and a staged rollout behind a feature flag for existing customers.',
      'Rollout plan: ship the manifest behind `jira-forge-migration`, migrate internal workspaces first, then batches of 50 customer sites per day with a 24h soak between batches. Roll back by flipping the flag — the Connect descriptor stays live until the final batch is verified.',
    ].join('\n\n'),
    periods: [
      { sourceStatus: 'Backlog', startedAt: '2026-02-23T09:12:00Z', authorId: 'a-dima' },
      { sourceStatus: 'In Progress', startedAt: '2026-02-23T12:36:00Z', authorId: 'a-dima' },
      { sourceStatus: 'In Review', startedAt: '2026-03-09T11:20:00Z', authorId: 'a-dima' },
      { sourceStatus: 'In Progress', startedAt: '2026-03-12T08:05:00Z', authorId: 'a-aino' },
      { sourceStatus: 'Blocked', startedAt: '2026-03-19T15:40:00Z', authorId: 'a-dima' },
      { sourceStatus: 'In Progress', startedAt: '2026-04-20T10:15:00Z', authorId: 'a-dima' },
      { sourceStatus: 'Waiting for QA', startedAt: '2026-05-21T09:30:00Z', authorId: 'a-aino' },
      { sourceStatus: 'Done', startedAt: '2026-05-27T16:04:00Z', authorId: 'a-dima' },
    ],
    children: [
      { title: 'Add Forge manifest to the app', createdAt: '2026-02-23T09:20:00Z', startedAt: '2026-02-23T13:00:00Z', completedAt: '2026-02-24T15:10:00Z', authorId: 'a-dima', estimate: 2 },
      { title: 'Wrap Connect descriptor in Forge', createdAt: '2026-02-23T09:22:00Z', startedAt: '2026-02-25T08:30:00Z', completedAt: '2026-03-03T16:40:00Z', authorId: 'a-dima', estimate: 3 },
      { title: 'Migrate lifecycle webhooks', createdAt: '2026-02-23T09:25:00Z', startedAt: '2026-03-02T09:00:00Z', completedAt: '2026-03-06T11:20:00Z', authorId: 'a-aino', estimate: 3 },
      { title: 'Port auth middleware to Forge context', createdAt: '2026-02-23T09:28:00Z', startedAt: '2026-03-04T10:15:00Z', completedAt: '2026-03-07T09:05:00Z', authorId: 'a-dima', estimate: 2 },
      { title: 'Feature flag: jira-forge-migration', createdAt: '2026-02-23T09:31:00Z', startedAt: '2026-03-06T13:45:00Z', completedAt: '2026-03-09T10:30:00Z', authorId: 'a-marcus', estimate: 1 },
      { title: 'Migrate internal workspaces', createdAt: '2026-02-23T09:34:00Z', startedAt: '2026-03-07T08:50:00Z', completedAt: '2026-03-09T14:25:00Z', authorId: 'a-dima', estimate: 2 },
      { title: 'Batch rollout script', createdAt: '2026-02-24T10:05:00Z', startedAt: '2026-03-09T09:10:00Z', completedAt: '2026-03-11T17:00:00Z', authorId: 'a-aino', estimate: 3 },
      { title: 'Soak monitoring for batches', createdAt: '2026-03-04T14:40:00Z', startedAt: '2026-03-10T08:20:00Z', completedAt: '2026-03-13T12:15:00Z', authorId: 'a-marcus', estimate: 2 },
      { title: 'Rollback runbook', createdAt: '2026-03-08T11:00:00Z', startedAt: '2026-03-11T09:40:00Z', completedAt: '2026-03-13T15:50:00Z', authorId: 'a-dima', estimate: 1 },
      { title: 'Customer comms for migration', createdAt: '2026-03-08T11:05:00Z', startedAt: '2026-03-12T10:00:00Z', completedAt: '2026-03-13T16:30:00Z', authorId: 'a-sara', estimate: 1 },
      { title: 'Final batch verification', createdAt: '2026-03-08T11:10:00Z', startedAt: '2026-05-21T10:00:00Z', completedAt: '2026-05-26T13:20:00Z', authorId: 'a-dima', estimate: 2 },
    ],
    notes: [
      {
        content:
          'Atlassian confirmed the Connect descriptor stays served until Jun 30, so the rollback path is safe for the whole rollout window.',
        authorId: 'a-aino',
        timestamp: '2026-04-21T07:45:00Z',
      },
    ],
  },
  {
    issueKey: 'DUM-9014',
    title: 'Webhook re-registration retries drop events',
    issueType: 'Bug',
    sourceIssueType: 'Bug',
    projectId: 'p-platform',
    assigneeAuthorId: 'a-aino',
    priorityLabel: 'Urgent',
    labels: ['forge', 'webhooks', 'data-loss'],
    estimate: 5,
    description:
      'During the Forge rollout, webhook re-registration retries overwrite the cursor for sites that were mid-sync, so issue updates between the two attempts are never ingested. Fix the retry to resume from the stored cursor instead of resetting it.',
    periods: [
      { sourceStatus: 'Backlog', startedAt: '2026-06-02T08:40:00Z', authorId: 'a-aino' },
      { sourceStatus: 'Selected for development', startedAt: '2026-06-08T09:05:00Z', authorId: 'a-marcus' },
      { sourceStatus: 'In Progress', startedAt: '2026-06-15T13:22:00Z', authorId: 'a-aino' },
      { sourceStatus: 'Blocked', startedAt: '2026-07-01T10:10:00Z', authorId: 'a-aino' },
      { sourceStatus: 'In Progress', startedAt: '2026-08-12T11:00:00Z', authorId: 'a-aino' },
      { sourceStatus: 'In Review', startedAt: '2026-09-08T14:35:00Z', authorId: 'a-marcus' },
    ],
    children: [
      { title: 'Reproduce cursor reset in staging', createdAt: '2026-06-02T08:50:00Z', startedAt: '2026-06-15T14:00:00Z', completedAt: '2026-06-18T10:20:00Z', authorId: 'a-aino', estimate: 1 },
      { title: 'Resume retries from stored cursor', createdAt: '2026-06-02T08:52:00Z', startedAt: '2026-06-19T09:30:00Z', completedAt: '2026-07-08T15:40:00Z', authorId: 'a-aino', estimate: 3 },
      { title: 'Backfill missed events for affected sites', createdAt: '2026-06-02T08:55:00Z', startedAt: '2026-08-12T11:30:00Z', completedAt: '2026-08-18T14:10:00Z', authorId: 'a-aino', estimate: 3 },
      { title: 'Alert on cursor regression', createdAt: '2026-06-02T08:58:00Z', startedAt: '2026-09-01T09:00:00Z', completedAt: '2026-09-09T11:45:00Z', authorId: 'a-marcus', estimate: 2 },
      { title: 'Add integration test for mid-sync retry', createdAt: '2026-06-20T13:10:00Z', startedAt: '2026-09-10T10:00:00Z', completedAt: null, authorId: 'a-aino', estimate: 2 },
      { title: 'Document the retry contract', createdAt: '2026-07-10T09:15:00Z', startedAt: null, completedAt: null, authorId: 'a-marcus', estimate: 1 },
    ],
  },
  {
    issueKey: 'DUM-8977',
    title: 'Forge app installation flow for existing customers',
    issueType: 'Story',
    sourceIssueType: 'Story',
    projectId: 'p-new-things',
    assigneeAuthorId: 'a-marcus',
    priorityLabel: 'High',
    labels: ['forge', 'onboarding'],
    estimate: 8,
    description:
      'Existing Connect installs need a one-click upgrade path to the Forge app that preserves the site mapping and OAuth grants. Covers the upgrade prompt, the consent screen copy, and the migration status page in settings.',
    periods: [
      { sourceStatus: 'Backlog', startedAt: '2026-04-06T07:30:00Z', authorId: 'a-marcus' },
      { sourceStatus: 'In Progress', startedAt: '2026-04-27T09:00:00Z', authorId: 'a-marcus' },
      { sourceStatus: 'In Review', startedAt: '2026-05-18T16:20:00Z', authorId: 'a-dima' },
      { sourceStatus: 'Waiting for QA', startedAt: '2026-05-22T08:45:00Z', authorId: 'a-marcus' },
      { sourceStatus: 'Done', startedAt: '2026-06-01T12:00:00Z', authorId: 'a-sara' },
    ],
    children: [
      { title: 'Upgrade prompt in the Connect app', createdAt: '2026-04-06T07:40:00Z', startedAt: '2026-04-13T09:00:00Z', completedAt: '2026-04-20T14:30:00Z', authorId: 'a-marcus', estimate: 2 },
      { title: 'Preserve site mapping on upgrade', createdAt: '2026-04-06T07:42:00Z', startedAt: '2026-04-21T10:15:00Z', completedAt: '2026-04-26T16:00:00Z', authorId: 'a-marcus', estimate: 3 },
      { title: 'Carry over OAuth grants', createdAt: '2026-04-06T07:45:00Z', startedAt: '2026-04-27T09:30:00Z', completedAt: '2026-05-05T11:20:00Z', authorId: 'a-dima', estimate: 3 },
      { title: 'Consent screen copy', createdAt: '2026-04-06T07:47:00Z', startedAt: '2026-05-04T08:40:00Z', completedAt: '2026-05-08T15:10:00Z', authorId: 'a-sara', estimate: 1 },
      { title: 'Migration status page in settings', createdAt: '2026-04-06T07:50:00Z', startedAt: '2026-05-05T09:20:00Z', completedAt: '2026-05-10T12:45:00Z', authorId: 'a-marcus', estimate: 2 },
      { title: 'Handle partial upgrade failures', createdAt: '2026-04-06T07:52:00Z', startedAt: '2026-05-12T10:00:00Z', completedAt: '2026-05-20T13:30:00Z', authorId: 'a-marcus', estimate: 3 },
      { title: 'Telemetry for upgrade funnel', createdAt: '2026-04-06T07:55:00Z', startedAt: '2026-05-18T09:00:00Z', completedAt: '2026-05-24T10:50:00Z', authorId: 'a-dima', estimate: 2 },
      { title: 'Retry path for expired grants', createdAt: '2026-04-29T11:20:00Z', startedAt: '2026-05-21T09:45:00Z', completedAt: '2026-05-28T14:00:00Z', authorId: 'a-marcus', estimate: 2 },
      { title: 'QA pass on upgrade flow', createdAt: '2026-05-02T10:05:00Z', startedAt: '2026-05-26T09:00:00Z', completedAt: '2026-06-01T11:40:00Z', authorId: 'a-sara', estimate: 1 },
    ],
  },
  {
    issueKey: 'DUM-9102',
    title: 'Deprecate Connect descriptor endpoints',
    issueType: 'Task',
    sourceIssueType: 'Task',
    projectId: 'p-platform',
    assigneeAuthorId: 'a-dima',
    priorityLabel: 'Low',
    labels: ['cleanup', 'forge'],
    estimate: 5,
    description:
      'Once every site is on Forge, remove the Connect descriptor routes, the lifecycle webhooks they registered, and the shared-secret handling in the auth middleware.',
    periods: [{ sourceStatus: 'Backlog', startedAt: '2026-08-28T10:05:00Z', authorId: 'a-dima' }],
    children: [
      { title: 'Remove descriptor routes', createdAt: '2026-08-28T10:10:00Z', startedAt: null, completedAt: null, authorId: 'a-dima', estimate: 1 },
      { title: 'Drop lifecycle webhook registrations', createdAt: '2026-08-28T10:12:00Z', startedAt: null, completedAt: null, authorId: 'a-dima', estimate: 1 },
      { title: 'Remove shared-secret auth path', createdAt: '2026-08-28T10:14:00Z', startedAt: null, completedAt: null, authorId: 'a-aino', estimate: 2 },
      { title: 'Delete Connect-only config', createdAt: '2026-08-28T10:16:00Z', startedAt: null, completedAt: null, authorId: 'a-dima', estimate: 1 },
      { title: 'Update integration docs', createdAt: '2026-08-28T10:18:00Z', startedAt: null, completedAt: null, authorId: 'a-sara', estimate: 1 },
    ],
  },
  {
    issueKey: 'DUM-8845',
    title: 'Staged rollout dashboard for the migration',
    issueType: 'Task',
    sourceIssueType: 'Task',
    projectId: 'p-growth',
    assigneeAuthorId: 'a-sara',
    priorityLabel: 'Medium',
    labels: ['rollout', 'internal-tools'],
    estimate: 3,
    description:
      'Internal dashboard showing, per batch, how many sites are on Forge, how many failed the upgrade, and the error breakdown. Used to decide whether to continue the rollout each morning.',
    periods: [
      { sourceStatus: 'Backlog', startedAt: '2026-03-16T11:45:00Z', authorId: 'a-sara' },
      { sourceStatus: 'In Progress', startedAt: '2026-03-30T09:15:00Z', authorId: 'a-sara' },
      { sourceStatus: 'Done', startedAt: '2026-04-09T15:00:00Z', authorId: 'a-sara' },
    ],
    children: [
      { title: 'Batch status query', createdAt: '2026-03-16T11:50:00Z', startedAt: '2026-03-30T09:30:00Z', completedAt: '2026-04-01T14:10:00Z', authorId: 'a-sara', estimate: 1 },
      { title: 'Error breakdown panel', createdAt: '2026-03-16T11:52:00Z', startedAt: '2026-04-01T10:00:00Z', completedAt: '2026-04-03T16:20:00Z', authorId: 'a-sara', estimate: 1 },
      { title: 'Per-site drill-down', createdAt: '2026-03-16T11:54:00Z', startedAt: '2026-04-03T09:15:00Z', completedAt: '2026-04-07T11:30:00Z', authorId: 'a-sara', estimate: 1 },
      { title: 'Daily rollout summary', createdAt: '2026-03-16T11:56:00Z', startedAt: '2026-04-07T13:00:00Z', completedAt: '2026-04-09T14:40:00Z', authorId: 'a-marcus', estimate: 1 },
    ],
  },
];

// --- expansion ---------------------------------------------------------------

let sequence = 0;
const nextId = (prefix: string) => `${prefix}-${++sequence}`;

function pushPeriods(issueId: string, specs: PeriodSpec[]): void {
  specs.forEach((spec, index) => {
    const next = specs[index + 1];
    const period: IssueStatusPeriodRecord = {
      id: nextId('sp'),
      issueId,
      sourceStatus: spec.sourceStatus,
      startedAt: spec.startedAt,
      endedAt: next ? next.startedAt : null,
      authorId: spec.authorId,
    };
    issueStatusPeriods.push(period);
  });
}

/** A child's three dates become the same Backlog -> In Progress -> Done spans. */
function childPeriods(child: ChildSpec): PeriodSpec[] {
  const specs: PeriodSpec[] = [
    { sourceStatus: 'Backlog', startedAt: child.createdAt, authorId: child.authorId },
  ];
  if (child.startedAt) {
    specs.push({ sourceStatus: 'In Progress', startedAt: child.startedAt, authorId: child.authorId });
  }
  if (child.completedAt) {
    specs.push({ sourceStatus: 'Done', startedAt: child.completedAt, authorId: child.authorId });
  }
  return specs;
}

let childKeyCounter = 9200;

for (const spec of SPECS) {
  const id = nextId('i');
  const project = projects.find(candidate => candidate.id === spec.projectId);

  const parent: IssueRecord = {
    id,
    installationId: INSTALLATION_ID,
    projectId: project?.id ?? null,
    parentIssueId: null,
    sourceId: `10${sequence}`,
    sourceUrl: `${SITE}/browse/${spec.issueKey}`,
    issueKey: spec.issueKey,
    sourceIssueType: spec.sourceIssueType,
    sourceIssueTypeIconUrl: null,
    issueType: spec.issueType,
    priorityLabel: spec.priorityLabel,
    labels: spec.labels,
    estimate: spec.estimate,
    title: spec.title,
    description: spec.description,
    assigneeIdentityId: `ai-${spec.assigneeAuthorId.slice(2)}`,
    sourceCreatedAt: spec.periods[0]!.startedAt,
    sourceUpdatedAt: spec.periods[spec.periods.length - 1]!.startedAt,
  };
  issues.push(parent);
  pushPeriods(parent.id, spec.periods);

  for (const child of spec.children) {
    const childId = nextId('i');
    const childRecord: IssueRecord = {
      id: childId,
      installationId: INSTALLATION_ID,
      projectId: parent.projectId,
      parentIssueId: parent.id,
      sourceId: `10${sequence}`,
      sourceUrl: `${SITE}/browse/DUM-${++childKeyCounter}`,
      issueKey: `DUM-${childKeyCounter}`,
      sourceIssueType: 'Sub-task',
      sourceIssueTypeIconUrl: null,
      issueType: 'Task',
      priorityLabel: null,
      labels: [],
      estimate: child.estimate ?? null,
      title: child.title,
      description: null,
      assigneeIdentityId: `ai-${child.authorId.slice(2)}`,
      sourceCreatedAt: child.createdAt,
      sourceUpdatedAt: child.completedAt ?? child.startedAt ?? child.createdAt,
    };
    issues.push(childRecord);
    pushPeriods(childId, childPeriods(child));
  }

  for (const note of spec.notes ?? []) {
    annotations.push({
      id: nextId('an'),
      targetEntityType: 'Issue',
      targetEntityId: parent.id,
      content: note.content,
      source: 'Ui',
      authorId: note.authorId,
      timestamp: note.timestamp,
    });
  }
}

// --- generated activity and effort -------------------------------------------

/** mulberry32, seeded off the issue key so a given issue always gets the same days. */
function seededRandom(seed: string): () => number {
  let state = 0;
  for (const character of seed) {
    state = (state * 31 + character.charCodeAt(0)) >>> 0;
  }
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const WORK_ITEM_TYPES: WorkItemType[] = ['Commit', 'PullRequest', 'Review', 'Comment'];

/**
 * Emit activity and daily effort across each issue's own in-progress window.
 * Parents get their own activity too — upstream a parent accumulates its
 * children's activity through the ancestor chain, which the domain layer does,
 * but work is logged against parents directly as well.
 */
for (const issue of issues) {
  const periods = issueStatusPeriods.filter(period => period.issueId === issue.id);
  const working = periods.filter(period =>
    ['In Progress', 'In Review'].includes(period.sourceStatus),
  );
  if (working.length === 0) continue;

  const random = seededRandom(issue.issueKey);
  const authorId = issue.assigneeIdentityId
    ? `a-${issue.assigneeIdentityId.slice(3)}`
    : 'a-dima';

  for (const period of working) {
    const start = new Date(period.startedAt);
    // Cap the open period so generation terminates on a fixed horizon.
    const end = period.endedAt ? new Date(period.endedAt) : new Date('2026-09-23T00:00:00Z');

    for (
      let day = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
      day <= end;
      day = new Date(day.getTime() + 86_400_000)
    ) {
      const weekend = day.getUTCDay() === 0 || day.getUTCDay() === 6;
      const chance = weekend ? 0.08 : 0.62;
      if (random() > chance) continue;

      const count = 1 + Math.floor(random() * 3);
      for (let index = 0; index < count; index++) {
        activities.push({
          id: nextId('act'),
          issueId: issue.id,
          authorId,
          timestamp: new Date(day.getTime() + 9 * 3_600_000 + index * 1_800_000).toISOString(),
          workItemType: WORK_ITEM_TYPES[Math.floor(random() * WORK_ITEM_TYPES.length)]!,
        });
      }

      effortDaily.push({
        id: nextId('ed'),
        issueId: issue.id,
        authorId,
        date: day.toISOString().slice(0, 10),
        fte: Math.round((0.2 + random() * 0.5) * 100) / 100,
      });
    }
  }
}

// --- insertion ---------------------------------------------------------------

/**
 * Write the expanded fixture data. Called inside the caller's transaction, so
 * nothing here commits or rolls back on its own.
 */
export function seed(connection: DatabaseSync): void {
  const insertMany = <T>(sql: string, rows: readonly T[], toValues: (row: T) => unknown[]) => {
    const statement = connection.prepare(sql);
    for (const row of rows) statement.run(...(toValues(row) as never[]));
  };

  insertMany('INSERT INTO authors (id, name, email) VALUES (?, ?, ?)', authors, author => [
    author.id,
    author.name,
    author.email,
  ]);

  insertMany(
    'INSERT INTO author_identities (id, author_id) VALUES (?, ?)',
    authorIdentities,
    identity => [identity.id, identity.authorId],
  );

  connection
    .prepare(
      'INSERT INTO issue_source_installations (id, data_source, site_url) VALUES (?, ?, ?)',
    )
    .run(INSTALLATION_ID, 'Jira', SITE);

  insertMany(
    `INSERT INTO issue_status_mappings (installation_id, source_status, swarmia_status)
     VALUES (?, ?, ?)`,
    statusMappings,
    mapping => [INSTALLATION_ID, mapping.sourceStatus, mapping.swarmiaStatus],
  );

  insertMany(
    'INSERT INTO projects (id, installation_id, name, color) VALUES (?, ?, ?, ?)',
    projects,
    project => [project.id, project.installationId, project.name, project.color],
  );

  // Parents before children: `parent_issue_id` is a self-referencing foreign
  // key, and the expansion above already emits each parent ahead of its own
  // children.
  insertMany(
    `INSERT INTO issues (
       id, installation_id, project_id, parent_issue_id, source_id, source_url, issue_key,
       source_issue_type, source_issue_type_icon_url, issue_type, priority_label, labels,
       estimate, title, description, assignee_identity_id, source_created_at, source_updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    issues,
    issue => [
      issue.id,
      issue.installationId,
      issue.projectId,
      issue.parentIssueId,
      issue.sourceId,
      issue.sourceUrl,
      issue.issueKey,
      issue.sourceIssueType,
      issue.sourceIssueTypeIconUrl,
      issue.issueType,
      issue.priorityLabel,
      JSON.stringify(issue.labels),
      issue.estimate,
      issue.title,
      issue.description,
      issue.assigneeIdentityId,
      issue.sourceCreatedAt,
      issue.sourceUpdatedAt,
    ],
  );

  insertMany(
    `INSERT INTO issue_status_periods (id, issue_id, source_status, started_at, ended_at, author_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    issueStatusPeriods,
    period => [
      period.id,
      period.issueId,
      period.sourceStatus,
      period.startedAt,
      period.endedAt,
      period.authorId,
    ],
  );

  insertMany(
    `INSERT INTO activities (id, issue_id, author_id, timestamp, work_item_type)
     VALUES (?, ?, ?, ?, ?)`,
    activities,
    activity => [
      activity.id,
      activity.issueId,
      activity.authorId,
      activity.timestamp,
      activity.workItemType,
    ],
  );

  insertMany(
    'INSERT INTO effort_daily (id, issue_id, author_id, date, fte) VALUES (?, ?, ?, ?, ?)',
    effortDaily,
    row => [row.id, row.issueId, row.authorId, row.date, row.fte],
  );

  insertMany(
    `INSERT INTO annotations
       (id, target_entity_type, target_entity_id, content, source, author_id, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    annotations,
    note => [
      note.id,
      note.targetEntityType,
      note.targetEntityId,
      note.content,
      note.source,
      note.authorId,
      note.timestamp,
    ],
  );
}

/** Row counts, for the startup log line. */
export const seedCounts = {
  get issues() {
    return issues.length;
  },
  get statusPeriods() {
    return issueStatusPeriods.length;
  },
  get activities() {
    return activities.length;
  },
  get effortDaily() {
    return effortDaily.length;
  },
};
