import { createServer } from 'node:http';
import { createSchema, createYoga } from 'graphql-yoga';
// Populates the store. Imported for its side effects, before anything reads it.
import './data/fixtures.js';
import { createContext, resolvers } from './resolvers.js';
import { typeDefs } from './schema.js';

const port = Number(process.env.PORT ?? 4000);

const yoga = createYoga({
  schema: createSchema({ typeDefs, resolvers }),
  // One clock and one materialization cache per request.
  context: createContext,
  graphqlEndpoint: '/graphql',
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'],
    credentials: true,
  },
});

createServer(yoga).listen(port, () => {
  console.log(`GraphQL API ready at http://localhost:${port}/graphql`);
});
