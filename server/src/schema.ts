export const typeDefs = /* GraphQL */ `
  scalar DateTime

  enum IssueDataSource {
    Jira
    Linear
    AzureDevops
    Shortcut
    Github
  }

  "Swarmia status. WONT_DO is terminal but is not a completion."
  enum IssueStatus {
    TODO
    IN_PROGRESS
    DONE
    WONT_DO
  }

  enum AnnotationSource {
    Ui
    SwarmiaAi
    GithubBotPing
  }

  enum WorkItemType {
    Commit
    PullRequest
    Review
    Comment
  }

  type Author {
    id: ID!
    name: String!
    email: String!
    initials: String!
  }

  type IssueSourceInstallation {
    id: ID!
    dataSource: IssueDataSource!
    siteUrl: String!
  }

  type Project {
    id: ID!
    name: String!
    color: String!
  }

  "A half-open time range. A null end means the range is still open."
  type TimestampRange {
    start: DateTime!
    end: DateTime
  }

  "One contiguous span the issue spent in one source status."
  type IssueStatusPeriod {
    id: ID!
    sourceStatus: String!
    "Null when the source status has no mapping in this installation."
    status: IssueStatus
    period: TimestampRange!
    "Counted up to now while the issue is still in this status."
    durationInSeconds: Float!
    author: Author!
    isCurrent: Boolean!
  }

  """
  One row per ordered pair of source statuses the issue moved between directly.
  An aggregate, not an event log: repeated moves raise \`occurrences\` and
  \`timestamp\` stays at the first one.
  """
  type IssueStatusTransition {
    id: ID!
    fromSourceStatus: String!
    toSourceStatus: String!
    occurrences: Int!
    timestamp: DateTime!
  }

  "Status tally over the issue's subtree, the issue itself included."
  type DescendantStatusCounts {
    todo: Int!
    inProgress: Int!
    done: Int!
    wontDo: Int!
  }

  "The day counts behind flow efficiency."
  type ActivityStatistics {
    "Inclusive day span of the activity window."
    open: Int!
    openBusinessDays: Int!
    "The flow-efficiency denominator: business days plus worked weekend days."
    openBusinessAndActiveDays: Int!
    "Days that had any work-item activity."
    active: Int!
  }

  type BurnupPoint {
    date: DateTime!
    scope: Int!
    completed: Int!
  }

  "Child-issue rollup. Won't-do children are out of scope entirely."
  type Progress {
    completed: Int!
    total: Int!
    percent: Float!
    burnup: [BurnupPoint!]!
  }

  type EffortMonthly {
    month: String!
    fte: Float!
  }

  type EffortContributor {
    author: Author!
    fte: Float!
    share: Float!
  }

  type Effort {
    lifetimeFte: Float!
    monthly: [EffortMonthly!]!
    contributors: [EffortContributor!]!
  }

  "A user-written note. Polymorphic upstream; here it only targets issues."
  type Annotation {
    id: ID!
    content: String!
    source: AnnotationSource!
    author: Author
    timestamp: DateTime!
  }

  type Issue {
    id: ID!
    issueKey: ID!
    title: String!
    "Markdown, as it comes from the tracker."
    description: String

    dataSource: IssueDataSource!
    sourceId: String!
    sourceUrl: String!
    sourceIssueType: String!
    issueType: String
    "Raw tracker status right now."
    sourceIssueStatus: String
    "Null when the current source status is unmapped."
    status: IssueStatus
    priorityLabel: String
    labels: [String!]!
    estimate: Float

    installation: IssueSourceInstallation!
    project: Project
    assignee: Author

    createdAt: DateTime!
    updatedAt: DateTime!
    "First time the issue entered an in-progress status."
    startedAt: DateTime
    "Null unless the issue is currently in a done status."
    completedAt: DateTime
    "When the issue's status last changed."
    finalStatusAt: DateTime

    inProgressPeriods: [TimestampRange!]!
    "Null when the issue has never been in progress — never 0."
    inProgressTimeSeconds: Float
    "Creation through completion, or through now if not completed."
    ageSeconds: Float!
    "Inclusive day span of activity and in-progress time, in seconds."
    lifetimeSeconds: Float!
    "Share of days with activity, 0..100."
    flowEfficiency: Float!
    activityStatistics: ActivityStatistics!

    "Ratio of children created after the start to those created before it. Null when undefined."
    scopeIncrease: Float
    initialIssueCount: Int!
    creepedIssueCount: Int!

    parentIssue: Issue
    children: [Issue!]!
    isLeafIssue: Boolean!
    descendantStatusCounts: DescendantStatusCounts!

    statusPeriods: [IssueStatusPeriod!]!
    statusTransitions: [IssueStatusTransition!]!
    progress: Progress!
    effort: Effort!
    annotations: [Annotation!]!
  }

  input IssueFilter {
    status: IssueStatus
    projectId: ID
    search: String
  }

  type Query {
    "Top-level issues only; children are reached through the hierarchy."
    issues(filter: IssueFilter): [Issue!]!
    issue(issueKey: ID!): Issue
    projects: [Project!]!
    viewer: Author!
  }

  type AddAnnotationPayload {
    issue: Issue!
    annotation: Annotation!
  }

  type Mutation {
    addAnnotation(issueKey: ID!, content: String!): AddAnnotationPayload!
    deleteAnnotation(issueKey: ID!, annotationId: ID!): Issue!
  }
`;
