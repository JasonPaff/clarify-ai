import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { projects } from './projects.schema';

export const featureRequests = sqliteTable(
  'feature_requests',
  {
    clarificationAnalysis: text('clarification_analysis'),
    clarificationAnswers: text('clarification_answers'),
    clarificationDetailScore: integer('clarification_detail_score'),
    clarificationModel: text('clarification_model'),
    clarificationPrompt: text('clarification_prompt'),
    clarificationQuestions: text('clarification_questions'),
    clarificationStatus: text('clarification_status'),
    createdAt: text('created_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    description: text('description'),
    id: integer('id').primaryKey({ autoIncrement: true }),
    implementationPlan: text('implementation_plan'),
    projectId: integer('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    rawRequest: text('raw_request'),
    refinedRequirements: text('refined_requirements'),
    researchFindings: text('research_findings'),
    status: text('status').notNull().default('draft'),
    title: text('title').notNull(),
    updatedAt: text('updated_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index('feature_requests_project_id_idx').on(table.projectId),
    index('feature_requests_status_idx').on(table.status),
  ]
);

export type FeatureRequest = typeof featureRequests.$inferSelect;
export type NewFeatureRequest = typeof featureRequests.$inferInsert;
