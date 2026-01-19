import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { featureRequests } from './feature-requests.schema';
import { repositories } from './repositories.schema';

export const featureRequestRepositories = sqliteTable(
  'feature_request_repositories',
  {
    createdAt: text('created_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    featureRequestId: integer('feature_request_id')
      .notNull()
      .references(() => featureRequests.id, { onDelete: 'cascade' }),
    id: integer('id').primaryKey({ autoIncrement: true }),
    repositoryId: integer('repository_id')
      .notNull()
      .references(() => repositories.id, { onDelete: 'cascade' }),
  },
  (table) => [
    uniqueIndex('feature_request_repositories_feature_request_id_repository_id_idx').on(
      table.featureRequestId,
      table.repositoryId
    ),
    index('feature_request_repositories_feature_request_id_idx').on(table.featureRequestId),
    index('feature_request_repositories_repository_id_idx').on(table.repositoryId),
  ]
);

export type FeatureRequestRepository = typeof featureRequestRepositories.$inferSelect;
export type NewFeatureRequestRepository = typeof featureRequestRepositories.$inferInsert;
