import { sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { featureRequests } from './feature-requests.schema';

/**
 * Step configuration step values for the orchestration workflow:
 * - 'refine': Feature refinement step
 * - 'research': File discovery/research step
 * - 'plan': Implementation planning step
 */
export type StepConfigurationStep = 'plan' | 'refine' | 'research';

export const stepConfigurations = sqliteTable(
  'step_configurations',
  {
    createdAt: text('created_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    customSystemPrompt: text('custom_system_prompt'),
    customUserPromptTemplate: text('custom_user_prompt_template'),
    featureRequestId: integer('feature_request_id')
      .notNull()
      .references(() => featureRequests.id, { onDelete: 'cascade' }),
    id: integer('id').primaryKey({ autoIncrement: true }),
    maxTokens: integer('max_tokens'),
    modelId: text('model_id'),
    modelProvider: text('model_provider'),
    step: text('step').$type<StepConfigurationStep>().notNull(),
    temperature: real('temperature'),
    thinkingBudget: integer('thinking_budget'),
    thinkingEnabled: integer('thinking_enabled', { mode: 'boolean' }).notNull().default(false),
    updatedAt: text('updated_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('step_configurations_feature_request_id_step_idx').on(table.featureRequestId, table.step),
    index('step_configurations_feature_request_id_idx').on(table.featureRequestId),
  ]
);

export type NewStepConfiguration = typeof stepConfigurations.$inferInsert;
export type StepConfiguration = typeof stepConfigurations.$inferSelect;
