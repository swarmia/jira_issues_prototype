/**
 * SQLite connection and first-run setup.
 *
 * Uses Node's built-in `node:sqlite`, so there is no dependency to install and
 * no native build step. It is still flagged experimental, hence the
 * `--disable-warning=ExperimentalWarning` in the package scripts.
 *
 * The database file is created and seeded on first run. Delete it (or run
 * `npm run db:reset -w server`) to start over.
 */

import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

export const DATABASE_PATH =
  process.env.DATABASE_PATH ?? join(here, '..', '..', 'data', 'jira-issues.db');

/**
 * Bumped whenever schema.sql changes. The database file is disposable, so a
 * mismatch asks for a reset rather than trying to migrate.
 */
const SCHEMA_VERSION = 2;

let database: DatabaseSync | null = null;

export function db(): DatabaseSync {
  if (database) return database;

  if (DATABASE_PATH !== ':memory:') mkdirSync(dirname(DATABASE_PATH), { recursive: true });

  database = new DatabaseSync(DATABASE_PATH);
  database.exec('PRAGMA foreign_keys = ON');
  // WAL keeps a read during a write from blocking; harmless for a single
  // process, and the right default if this ever grows a second one.
  if (DATABASE_PATH !== ':memory:') database.exec('PRAGMA journal_mode = WAL');

  return database;
}

/** True when the schema has not been applied yet. */
function isEmpty(connection: DatabaseSync): boolean {
  const row = connection
    .prepare(`SELECT count(*) AS count FROM sqlite_master WHERE type = 'table' AND name = 'issues'`)
    .get() as { count: number };
  return row.count === 0;
}

export function applySchema(connection: DatabaseSync): void {
  // The .sql file is read at runtime rather than inlined, so the schema stays
  // one readable artifact. tsc does not copy it, so the build script does.
  connection.exec(readFileSync(join(here, 'schema.sql'), 'utf8'));
  connection.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}

function schemaVersion(connection: DatabaseSync): number {
  const row = connection.prepare('PRAGMA user_version').get() as { user_version: number };
  return row.user_version;
}

/**
 * Open the database, creating and seeding it if this is the first run.
 * Returns whether it seeded, so the caller can say so on startup.
 */
export function initializeDatabase(seed: (connection: DatabaseSync) => void): {
  seeded: boolean;
} {
  const connection = db();

  if (!isEmpty(connection)) {
    const found = schemaVersion(connection);
    if (found !== SCHEMA_VERSION) {
      throw new Error(
        `Database at ${DATABASE_PATH} is on schema version ${found}, but this build ` +
          `expects ${SCHEMA_VERSION}. Run \`npm run db:reset\` to recreate it.`,
      );
    }
    return { seeded: false };
  }

  applySchema(connection);
  // One transaction: a half-seeded database is worse than no database, because
  // `isEmpty` would then report it as ready.
  connection.exec('BEGIN');
  try {
    seed(connection);
    connection.exec('COMMIT');
  } catch (error) {
    connection.exec('ROLLBACK');
    throw error;
  }
  return { seeded: true };
}

export function closeDatabase(): void {
  database?.close();
  database = null;
}
