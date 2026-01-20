import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { featureRequests } from './feature-requests.schema';

/**
 * File type values for context files:
 * - 'repository': Files from associated code repositories
 * - 'document': Document files (markdown, text, etc.)
 * - 'image': Image files (png, jpg, etc.)
 */
export type ContextFileType = 'document' | 'image' | 'repository';

export const featureRequestContextFiles = sqliteTable(
  'feature_request_context_files',
  {
    createdAt: text('created_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    displayName: text('display_name').notNull(),
    featureRequestId: integer('feature_request_id')
      .notNull()
      .references(() => featureRequests.id, { onDelete: 'cascade' }),
    filePath: text('file_path').notNull(),
    fileType: text('file_type').$type<ContextFileType>().notNull(),
    id: integer('id').primaryKey({ autoIncrement: true }),
    includedInContext: integer('included_in_context', { mode: 'boolean' }).notNull().default(true),
    sizeBytes: integer('size_bytes').notNull(),
    updatedAt: text('updated_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('feature_request_context_files_feature_request_id_file_path_idx').on(
      table.featureRequestId,
      table.filePath
    ),
    index('feature_request_context_files_feature_request_id_idx').on(table.featureRequestId),
    index('feature_request_context_files_file_type_idx').on(table.fileType),
  ]
);

export type FeatureRequestContextFile = typeof featureRequestContextFiles.$inferSelect;
export type NewFeatureRequestContextFile = typeof featureRequestContextFiles.$inferInsert;
