/** Append a deterministic, company-sized Jira fixture to the ordinary seed. */
import { closeDatabase, db, initializeDatabase } from './database.js';
import { pathToFileURL } from 'node:url';
import { seed } from './seed.js';
import { insertGeneratedData, nextGeneratedIssueNumber, type GeneratedDataBatch } from '../data/repository.js';
import type { IssueRecord, IssueStatusPeriodRecord, SwarmiaIssueType, WorkItemType } from '../data/types.js';

const DAY = 86_400_000;
const projectKinds = [
  { key: 'PLAT', name: 'Core Platform', color: 'var(--dataPurple)', theme: 'service reliability', labels: ['platform', 'infrastructure'] },
  { key: 'PAY', name: 'Payments and Billing', color: 'var(--dataGreen)', theme: 'billing', labels: ['payments', 'compliance'] },
  { key: 'MOB', name: 'Mobile Experience', color: 'var(--dataLightblue)', theme: 'mobile onboarding', labels: ['mobile', 'customer'] },
  { key: 'DATA', name: 'Data and Analytics', color: 'var(--dataYellow)', theme: 'reporting pipeline', labels: ['analytics', 'data'] },
  { key: 'SEC', name: 'Security Operations', color: 'var(--dataRed)', theme: 'access controls', labels: ['security', 'compliance'] },
  { key: 'GROW', name: 'Growth Experiments', color: 'var(--dataPink)', theme: 'activation funnel', labels: ['growth', 'customer'] },
  { key: 'INT', name: 'Integrations', color: 'var(--dataBlue)', theme: 'partner integration', labels: ['integrations', 'platform'] },
  { key: 'OPS', name: 'Internal Operations', color: 'var(--dataCoffee)', theme: 'internal workflow', labels: ['operations', 'automation'] },
] as const;

const names = [
  'Alex Morgan', 'Priya Shah', 'Leo Martin', 'Mei Chen', 'Noah Williams', 'Fatima Ali',
  'Sofia Garcia', 'Oskar Niemi', 'Amara Okafor', 'Luca Rossi', 'Elena Petrova', 'Jun Park',
  'Maya Patel', 'Elias Andersson', 'Chloe Dubois', 'Sam Taylor', 'Nina Kovacs', 'Arun Kumar',
  'Olivia Brown', 'Hana Sato', 'Mateo Silva', 'Isabel Costa', 'Ibrahim Hassan', 'Ada Novak',
  'Daniel Kim', 'Ava Thompson', 'Lin Wei', 'Ravi Singh', 'Emma Wilson', 'Mika Laine',
  'Zara Ahmed', 'Theo Bernard',
];

const sourceTypes: { source: string; mapped: SwarmiaIssueType | null; weight: number }[] = [
  { source: 'Initiative', mapped: 'Epic', weight: 3 },
  { source: 'Epic', mapped: 'Epic', weight: 8 },
  { source: 'Feature', mapped: 'Story', weight: 9 },
  { source: 'Story', mapped: 'Story', weight: 22 },
  { source: 'Task', mapped: 'Task', weight: 20 },
  { source: 'Bug', mapped: 'Bug', weight: 15 },
  { source: 'Incident', mapped: 'Bug', weight: 7 },
  { source: 'Change', mapped: 'Task', weight: 6 },
  { source: 'Spike', mapped: 'Task', weight: 5 },
  { source: 'Support request', mapped: null, weight: 3 },
  { source: 'Sub-task', mapped: 'Task', weight: 2 },
];
const workTypes: WorkItemType[] = ['Commit', 'PullRequest', 'Review', 'Comment'];
const titles = [
  'Improve %s observability', 'Investigate intermittent %s failures',
  'Roll out %s to enterprise customers', 'Reduce latency in %s',
  'Document the %s migration path', 'Add audit trail for %s',
  'Resolve edge cases in %s', 'Automate %s release checks',
  'Review %s permissions', 'Update %s dashboards',
];

function randomFor(number: number): () => number {
  let state = (number ^ 0x9e3779b9) >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function pickType(random: () => number, depth: number) {
  const choices = sourceTypes.filter(type =>
    depth === 0
      ? type.source !== 'Sub-task'
      : depth === 1
        ? !['Initiative', 'Sub-task'].includes(type.source)
        : ['Task', 'Bug', 'Spike', 'Sub-task'].includes(type.source),
  );
  let position = random() * choices.reduce((sum, type) => sum + type.weight, 0);
  for (const type of choices) {
    position -= type.weight;
    if (position < 0) return type;
  }
  return choices[choices.length - 1]!;
}

function iso(time: number): string { return new Date(time).toISOString(); }

export function generateTestData(count: number, first: number, today = new Date()): GeneratedDataBatch {
  const midnight = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const authors = names.map((name, index) => ({
    id: `generated-author-${index + 1}`,
    name,
    email: `${name.toLowerCase().replaceAll(' ', '.')}@example.test`,
  }));
  const projects = projectKinds.map(kind => ({
    id: `generated-project-${kind.key}`,
    installationId: 'inst-jira',
    name: kind.name,
    color: kind.color,
  }));
  const batch: GeneratedDataBatch = { authors, projects, issues: [], statusPeriods: [], activities: [], effortDaily: [] };
  const latestRootByProject = new Map<string, IssueRecord>();
  const latestChildByProject = new Map<string, IssueRecord>();

  for (let offset = 0; offset < count; offset++) {
    const number = first + offset;
    const random = randomFor(number);
    const kind = projectKinds[(number - 1) % projectKinds.length]!;
    const projectId = `generated-project-${kind.key}`;
    const root = latestRootByProject.get(projectId);
    const child = latestChildByProject.get(projectId);
    // Several children per initiative, plus occasional grandchildren. Keep a
    // bounded tree so large runs remain usable in the issue details view.
    const slot = Math.floor((number - 1) / projectKinds.length) % 7;
    const parent = slot === 0 ? null : slot === 5 && child ? child : root ?? null;
    const type = pickType(random, parent ? (parent.parentIssueId ? 2 : 1) : 0);
    const id = `generated-issue-${number}`;
    const issueKey = `${kind.key}-${10000 + number}`;
    const author = authors[Math.floor(random() * authors.length)]!;
    const sampledCreated = midnight - (20 + Math.floor(random() * 170)) * DAY + (8 + Math.floor(random() * 8)) * 3_600_000;
    const created = parent
      ? Math.max(sampledCreated, new Date(parent.sourceCreatedAt).getTime() + DAY)
      : sampledCreated;
    const start = created + (1 + Math.floor(random() * 12)) * DAY;
    const age = midnight - start;
    const outcome = random();
    const completed = outcome < 0.47 && age > 8 * DAY;
    const discarded = outcome >= 0.47 && outcome < 0.55 && age > 8 * DAY;
    const review = start + (2 + Math.floor(random() * 8)) * DAY;
    const terminal = Math.min(midnight - 2 * 3_600_000, review + (2 + Math.floor(random() * 16)) * DAY);
    const neverStarted = outcome > 0.91;
    const transitions: { status: string; time: number }[] = [
      { status: 'Backlog', time: created },
    ];
    if (!neverStarted) {
      if (random() < 0.35) transitions.push({ status: 'Selected for development', time: created + DAY });
      transitions.push({ status: 'In Progress', time: start });
      if (review < midnight - DAY && random() < 0.7) {
        transitions.push({ status: 'In Review', time: review });
        if (review + DAY < midnight && random() < 0.24) transitions.push({ status: 'Blocked', time: review + DAY });
        if (review + 2 * DAY < midnight && random() < 0.24) transitions.push({ status: 'In Progress', time: review + 2 * DAY });
        if (review + 3 * DAY < midnight && random() < 0.13) transitions.push({ status: 'Waiting for QA', time: review + 3 * DAY });
      }
      if ((completed || discarded) && terminal > transitions[transitions.length - 1]!.time) {
        transitions.push({ status: discarded ? "Won't do" : 'Done', time: terminal });
      }
    }
    transitions.sort((a, b) => a.time - b.time);
    // A period must have positive duration; remove same-day ties near today.
    const distinct = transitions.filter((transition, index) => index === 0 || transition.time > transitions[index - 1]!.time);
    const title = titles[Math.floor(random() * titles.length)]!.replace('%s', kind.theme);
    const issue: IssueRecord = {
      id, installationId: 'inst-jira', projectId, parentIssueId: parent?.id ?? null,
      sourceId: String(500000 + number),
      sourceUrl: `https://dummy.atlassian.net/browse/${issueKey}`,
      issueKey, sourceIssueType: type.source, sourceIssueTypeIconUrl: null,
      issueType: type.mapped,
      priorityLabel: ['Highest', 'High', 'Medium', 'Low'][Math.floor(random() * 4)]!,
      labels: [...kind.labels, ...(random() < 0.28 ? ['cross-team'] : []), ...(random() < 0.16 ? ['customer-reported'] : [])],
      estimate: random() < 0.2 ? null : [1, 2, 3, 5, 8, 13][Math.floor(random() * 6)]!,
      title: `${title} (${issueKey})`,
      description: `Coordinate the ${kind.theme} work across the relevant teams.\n\nAcceptance: ship the change, verify telemetry, and document the rollout.`,
      assigneeIdentityId: random() < 0.08 ? null : `ai-${author.id}`,
      sourceCreatedAt: iso(created), sourceUpdatedAt: iso(distinct[distinct.length - 1]!.time),
    };
    batch.issues.push(issue);
    if (!parent) latestRootByProject.set(projectId, issue);
    else latestChildByProject.set(projectId, issue);

    distinct.forEach((transition, index) => {
      const next = distinct[index + 1];
      const period: IssueStatusPeriodRecord = {
        id: `generated-period-${number}-${index}`, issueId: id,
        sourceStatus: transition.status, startedAt: iso(transition.time),
        endedAt: next ? iso(next.time) : null, authorId: author.id,
      };
      batch.statusPeriods.push(period);
    });

    // Source activity and effort only on days spent in an active status.
    for (let index = 0; index < distinct.length; index++) {
      const transition = distinct[index]!;
      if (!['In Progress', 'In Review'].includes(transition.status)) continue;
      const end = distinct[index + 1]?.time ?? midnight;
      for (let day = Math.ceil(transition.time / DAY) * DAY; day + 10 * 3_600_000 < end && day < midnight; day += DAY) {
        const weekday = new Date(day).getUTCDay();
        if (random() > (weekday === 0 || weekday === 6 ? 0.06 : 0.58)) continue;
        const activityIndex = batch.activities.length;
        batch.activities.push({
          id: `generated-activity-${number}-${activityIndex}`, issueId: id,
          authorId: author.id, timestamp: iso(day + 10 * 3_600_000),
          workItemType: workTypes[Math.floor(random() * workTypes.length)]!,
        });
        batch.effortDaily.push({
          id: `generated-effort-${number}-${activityIndex}`, issueId: id,
          authorId: author.id, date: iso(day).slice(0, 10),
          fte: Math.round((0.15 + random() * 0.6) * 100) / 100,
        });
      }
    }
  }
  const usedProjects = new Set(batch.issues.map(issue => issue.projectId));
  batch.projects = batch.projects.filter(project => usedProjects.has(project.id));
  return batch;
}

function main(): void {
  const argument = process.argv[2];
  const count = Number(argument);
  if (!argument || !/^[1-9]\d*$/.test(argument) || !Number.isSafeInteger(count) || process.argv.length !== 3) {
    console.error('Usage: npm run db:generate -- <positive issue count>');
    process.exitCode = 1;
    return;
  }
  initializeDatabase(seed);
  const connection = db();
  connection.exec('BEGIN');
  try {
    const batch = generateTestData(count, nextGeneratedIssueNumber(connection));
    insertGeneratedData(connection, batch);
    connection.exec('COMMIT');
    console.log(`Created ${batch.issues.length} ${batch.issues.length === 1 ? 'issue' : 'issues'} across ${batch.projects.length} ${batch.projects.length === 1 ? 'project' : 'projects'}, ${batch.statusPeriods.length} status periods, ${batch.activities.length} activities.`);
  } catch (error) {
    connection.exec('ROLLBACK');
    throw error;
  } finally {
    closeDatabase();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
