import { createServer } from 'node:http';
import { createSchema, createYoga } from 'graphql-yoga';
import { DATABASE_PATH, initializeDatabase } from './db/database.js';
import { seed, seedCounts } from './db/seed.js';
import { createContext, resolvers } from './resolvers.js';
import { typeDefs } from './schema.js';

const port = Number(process.env.PORT ?? 4000);

// Creates and seeds the database on first run; a no-op afterwards.
const { seeded } = initializeDatabase(seed);
console.log(
  seeded
    ? `Seeded ${DATABASE_PATH} with ${seedCounts.issues} issues, ` +
        `${seedCounts.statusPeriods} status periods, ${seedCounts.activities} activities`
    : `Using existing database at ${DATABASE_PATH}`,
);

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
