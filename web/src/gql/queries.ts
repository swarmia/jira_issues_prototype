import { gql } from '@apollo/client';

export const AUTHOR_FIELDS = gql`
  fragment AuthorFields on Author {
    id
    name
    email
    initials
  }
`;

export const ANNOTATION_FIELDS = gql`
  ${AUTHOR_FIELDS}
  fragment AnnotationFields on Annotation {
    id
    content
    source
    timestamp
    author {
      ...AuthorFields
    }
  }
`;

export const ISSUE_LIST_QUERY = gql`
  ${AUTHOR_FIELDS}
  query IssueList($filter: IssueFilter) {
    projects {
      id
      name
      color
    }
    issues(filter: $filter) {
      id
      issueKey
      title
      issueType
      sourceIssueType
      sourceIssueStatus
      status
      createdAt
      completedAt
      inProgressTimeSeconds
      assignee {
        ...AuthorFields
      }
      project {
        id
        name
        color
      }
      progress {
        completed
        total
        percent
      }
    }
  }
`;

export const ISSUE_DETAIL_QUERY = gql`
  ${AUTHOR_FIELDS}
  ${ANNOTATION_FIELDS}
  query IssueDetail($issueKey: ID!) {
    issue(issueKey: $issueKey) {
      id
      issueKey
      title
      description
      dataSource
      sourceUrl
      sourceIssueType
      issueType
      sourceIssueStatus
      status
      priorityLabel
      labels
      estimate

      createdAt
      updatedAt
      startedAt
      completedAt
      finalStatusAt

      inProgressTimeSeconds
      ageSeconds
      lifetimeSeconds
      flowEfficiency
      activityStatistics {
        open
        openBusinessDays
        openBusinessAndActiveDays
        active
      }

      scopeIncrease
      initialIssueCount
      creepedIssueCount
      isLeafIssue
      descendantStatusCounts {
        todo
        inProgress
        done
        wontDo
      }

      assignee {
        ...AuthorFields
      }
      project {
        id
        name
        color
      }

      children {
        id
        issueKey
        title
        status
        sourceIssueStatus
        createdAt
        completedAt
        assignee {
          ...AuthorFields
        }
      }

      statusPeriods {
        id
        sourceStatus
        status
        durationInSeconds
        isCurrent
        period {
          start
          end
        }
        author {
          ...AuthorFields
        }
      }

      statusTransitions {
        id
        fromSourceStatus
        toSourceStatus
        occurrences
        timestamp
      }

      progress {
        completed
        total
        percent
        burnup {
          date
          scope
          completed
        }
      }

      effort {
        lifetimeFte
        monthly {
          month
          fte
        }
        contributors {
          author {
            ...AuthorFields
          }
          fte
          share
        }
      }

      annotations {
        ...AnnotationFields
      }
    }
  }
`;

export const ADD_ANNOTATION_MUTATION = gql`
  ${ANNOTATION_FIELDS}
  mutation AddAnnotation($issueKey: ID!, $content: String!) {
    addAnnotation(issueKey: $issueKey, content: $content) {
      issue {
        id
        annotations {
          ...AnnotationFields
        }
      }
    }
  }
`;

export const DELETE_ANNOTATION_MUTATION = gql`
  ${ANNOTATION_FIELDS}
  mutation DeleteAnnotation($issueKey: ID!, $annotationId: ID!) {
    deleteAnnotation(issueKey: $issueKey, annotationId: $annotationId) {
      id
      annotations {
        ...AnnotationFields
      }
    }
  }
`;
