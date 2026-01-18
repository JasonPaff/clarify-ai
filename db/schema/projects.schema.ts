import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const projects = sqliteTable(
  'projects',
  {
    createdAt: text('created_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    description: text('description'),
    id: integer('id').primaryKey({ autoIncrement: true }),
    isFavorited: integer('is_favorited', { mode: 'boolean' }).notNull().default(false),
    name: text('name').notNull(),
    updatedAt: text('updated_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index('projects_created_at_idx').on(table.createdAt),
    index('projects_is_favorited_idx').on(table.isFavorited),
    index('projects_name_idx').on(table.name),
    index('projects_updated_at_idx').on(table.updatedAt),
  ]
);

export type NewProject = typeof projects.$inferInsert;
export type Project = typeof projects.$inferSelect;
