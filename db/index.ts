import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import * as featureRequestContextFilesSchema from './schema/feature-request-context-files.schema';
import * as featureRequestRepositoriesSchema from './schema/feature-request-repositories.schema';
import * as featureRequestRunsSchema from './schema/feature-request-runs.schema';
import * as featuresSchema from './schema/feature-requests.schema';
import * as projectsSchema from './schema/projects.schema';
import * as repositoriesSchema from './schema/repositories.schema';
import * as repositoryOverviewsSchema from './schema/repository-overviews.schema';
import * as stepConfigurationsSchema from './schema/step-configurations.schema';

const schema = {
  ...featureRequestContextFilesSchema,
  ...featureRequestRepositoriesSchema,
  ...featureRequestRunsSchema,
  ...featuresSchema,
  ...projectsSchema,
  ...repositoriesSchema,
  ...repositoryOverviewsSchema,
  ...stepConfigurationsSchema,
};

export type DrizzleDatabase = BetterSQLite3Database<typeof schema>;

let db: DrizzleDatabase | null = null;
let sqlite: Database.Database | null = null;

export function closeDatabase(): void {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
    db = null;
  }
}

export function getDatabase(): DrizzleDatabase {
  if (!db) throw new Error('Database not initialized');
  return db;
}

export function initializeDatabase(dbPath: string): DrizzleDatabase {
  if (db) return db;

  sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  db = drizzle(sqlite, { schema });
  return db;
}
