/** Mirrors the server schema, which follows rapu's entity vocabulary. */

export type IssueStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'WONT_DO';

export type IssueDataSource = 'Jira' | 'Linear' | 'AzureDevops' | 'Shortcut' | 'Github';

export type AnnotationSource = 'Ui' | 'SwarmiaAi' | 'GithubBotPing';

export interface Author {
  id: string;
  name: string;
  email: string;
  initials: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
}

/** Half-open; a null end means the range is still open. */
export interface TimestampRange {
  start: string;
  end: string | null;
}

export interface IssueStatusPeriod {
  id: string;
  sourceStatus: string;
  /** Null when the source status is unmapped in the installation. */
  status: IssueStatus | null;
  period: TimestampRange;
  durationInSeconds: number;
  author: Author;
  isCurrent: boolean;
}

export interface IssueStatusTransition {
  id: string;
  fromSourceStatus: string;
  toSourceStatus: string;
  occurrences: number;
  timestamp: string;
}

export interface DescendantStatusCounts {
  todo: number;
  inProgress: number;
  done: number;
  wontDo: number;
}

export interface ActivityStatistics {
  open: number;
  openBusinessDays: number;
  openBusinessAndActiveDays: number;
  active: number;
}

export interface BurnupPoint {
  date: string;
  scope: number;
  completed: number;
}

export interface Progress {
  completed: number;
  total: number;
  percent: number;
  burnup: BurnupPoint[];
}

export interface Effort {
  lifetimeFte: number;
  monthly: { month: string; fte: number }[];
  contributors: { author: Author; fte: number; share: number }[];
}

export interface Annotation {
  id: string;
  content: string;
  source: AnnotationSource;
  author: Author | null;
  timestamp: string;
}

export interface IssueSummary {
  id: string;
  issueKey: string;
  title: string;
  issueType: string | null;
  sourceIssueType: string;
  sourceIssueStatus: string | null;
  status: IssueStatus | null;
  assignee: Author | null;
  project: Project | null;
  createdAt: string;
  completedAt: string | null;
  /** Null when the issue has never been in progress. */
  inProgressTimeSeconds: number | null;
  progress: Progress;
}

export interface Issue extends IssueSummary {
  description: string | null;
  dataSource: IssueDataSource;
  sourceUrl: string;
  priorityLabel: string | null;
  labels: string[];
  estimate: number | null;
  startedAt: string | null;
  finalStatusAt: string | null;
  ageSeconds: number;
  lifetimeSeconds: number;
  /** 0..100. */
  flowEfficiency: number;
  activityStatistics: ActivityStatistics;
  /** Null when undefined: never started, or no initial children. */
  scopeIncrease: number | null;
  initialIssueCount: number;
  creepedIssueCount: number;
  isLeafIssue: boolean;
  descendantStatusCounts: DescendantStatusCounts;
  children: IssueSummary[];
  statusPeriods: IssueStatusPeriod[];
  statusTransitions: IssueStatusTransition[];
  effort: Effort;
  annotations: Annotation[];
}

export interface IssueFilter {
  statuses?: IssueStatus[] | null;
  projectId?: string | null;
  search?: string | null;
}
