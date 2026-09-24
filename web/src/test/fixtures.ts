import type { Author, Issue, IssueSummary } from '../gql/types';

export const author: Author & { __typename: 'Author' } = {
  __typename: 'Author', id: 'person-1', name: 'Ada Lovelace', email: 'ada@example.com', initials: 'AL',
};

export const child: IssueSummary = {
  id: 'issue-2', issueKey: 'DEMO-2', title: 'Child task', issueType: 'Task',
  sourceIssueType: 'Task', sourceIssueStatus: 'Done', status: 'DONE',
  assignee: author, project: null, createdAt: '2026-01-01T00:00:00Z',
  completedAt: '2026-01-04T00:00:00Z', inProgressTimeSeconds: 3600,
  progress: { completed: 1, total: 1, percent: 1, burnup: [] },
};

export const issue: Issue = {
  ...child,
  id: 'issue-1', issueKey: 'DEMO-1', title: 'Parent issue', sourceIssueStatus: 'In Progress',
  status: 'IN_PROGRESS', completedAt: null, project: { id: 'project-1', name: 'Demo', color: 'var(--blue500)' },
  description: 'First **important** paragraph.\n\nRun `npm test`.', dataSource: 'Jira',
  sourceUrl: 'https://jira.example.com/browse/DEMO-1', priorityLabel: 'High', labels: ['backend'],
  estimate: 3, startedAt: '2026-01-02T00:00:00Z', finalStatusAt: null,
  ageSeconds: 86400, lifetimeSeconds: 172800, flowEfficiency: 50,
  activityStatistics: { open: 3, openBusinessDays: 2, openBusinessAndActiveDays: 2, active: 1 },
  scopeIncrease: 0, initialIssueCount: 1, creepedIssueCount: 0, isLeafIssue: false,
  descendantStatusCounts: { todo: 0, inProgress: 1, done: 1, wontDo: 0 },
  children: [child],
  statusPeriods: [{ id: 'period-1', sourceStatus: 'In Progress', status: 'IN_PROGRESS',
    period: { start: '2026-01-02T00:00:00Z', end: null }, durationInSeconds: 172800,
    author, isCurrent: true }],
  statusTransitions: [],
  progress: { completed: 1, total: 2, percent: 0.5,
    burnup: [{ date: '2026-01-01T00:00:00Z', scope: 2, completed: 1 }] },
  effort: { lifetimeFte: 0.5, monthly: [{ month: '2026-01', fte: 0.5 }],
    contributors: [{ author, fte: 0.5, share: 1 }] },
  annotations: [{ id: 'note-1', content: 'A decision', source: 'Ui', author,
    timestamp: '2026-01-03T12:00:00Z' }],
};
