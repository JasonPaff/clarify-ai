import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { projects } from './projects.schema';

export const repositories = sqliteTable(
  'repositories',
  {
    createdAt: text('created_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    fileCount: integer('file_count'),
    id: integer('id').primaryKey({ autoIncrement: true }),
    lastScannedAt: text('last_scanned_at'),
    name: text('name').notNull(),
    path: text('path').notNull(),
    projectId: integer('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    updatedAt: text('updated_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [index('repositories_project_id_idx').on(table.projectId), index('repositories_path_idx').on(table.path)]
);

export type NewRepository = typeof repositories.$inferInsert;
export type Repository = typeof repositories.$inferSelect;
