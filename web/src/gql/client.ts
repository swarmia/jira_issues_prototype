import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';

export const client = new ApolloClient({
  link: new HttpLink({ uri: import.meta.env.VITE_GRAPHQL_URL ?? '/graphql' }),
  cache: new InMemoryCache({
    typePolicies: {
      // `issueKey` is the stable business key; `id` is the internal uuid, and
      // the list, the detail page and the child lists all carry the key.
      Issue: { keyFields: ['issueKey'] },
      // Status periods and transitions only exist inside an issue, and their
      // ids are unique per issue, so normalizing them buys nothing.
      IssueStatusPeriod: { keyFields: false },
      IssueStatusTransition: { keyFields: false },
      Query: {
        fields: {
          issue: {
            read(existing, { args, toReference }) {
              // Serve a detail page straight from the cache when the list already fetched it.
              return existing ?? toReference({ __typename: 'Issue', issueKey: args?.issueKey });
            },
          },
        },
      },
    },
  }),
});
