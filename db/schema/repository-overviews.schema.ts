import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { repositories } from './repositories.schema';

export const repositoryOverviews = sqliteTable(
  'repository_overviews',
  {
    content: text('content').notNull(),
    createdAt: text('created_at')
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`)
      .notNull(),
    generatedAt: text('generated_at').notNull(),
    id: integer('id').primaryKey({ autoIncrement: true }),
    lastEditedAt: text('last_edited_at'),
    manualContent: text('manual_content'),
    modelId: text('model_id').notNull(),
    promptUsed: text('prompt_used').notNull(),
    repositoryId: integer('repository_id')
      .notNull()
      .references(() => repositories.id, { onDelete: 'cascade' })
      .unique(),
    updatedAt: text('updated_at')
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`)
      .notNull(),
  },
  (table) => [index('repository_overviews_repository_id_idx').on(table.repositoryId)]
);

export type NewRepositoryOverview = typeof repositoryOverviews.$inferInsert;
export type RepositoryOverview = typeof repositoryOverviews.$inferSelect;
