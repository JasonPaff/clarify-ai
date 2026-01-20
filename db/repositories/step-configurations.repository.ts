import { and, eq, sql } from 'drizzle-orm';

import type { DrizzleDatabase } from '@/db';

import type {
  NewStepConfiguration,
  StepConfiguration,
  StepConfigurationStep,
} from '../schema/step-configurations.schema';

import { stepConfigurations } from '../schema/step-configurations.schema';

export interface StepConfigurationsRepository {
  create(data: NewStepConfiguration): StepConfiguration;
  delete(id: number): boolean;
  getByFeatureRequestId(featureRequestId: number): Array<StepConfiguration>;
  getByFeatureRequestIdAndStep(featureRequestId: number, step: StepConfigurationStep): StepConfiguration | undefined;
  getById(id: number): StepConfiguration | undefined;
  update(id: number, data: Partial<NewStepConfiguration>): StepConfiguration | undefined;
  upsert(
    featureRequestId: number,
    step: StepConfigurationStep,
    data: Omit<NewStepConfiguration, 'featureRequestId' | 'step'>
  ): StepConfiguration;
}

export function createStepConfigurationsRepository(db: DrizzleDatabase): StepConfigurationsRepository {
  return {
    create(data: NewStepConfiguration): StepConfiguration {
      return db.insert(stepConfigurations).values(data).returning().get();
    },

    delete(id: number): boolean {
      const result = db.delete(stepConfigurations).where(eq(stepConfigurations.id, id)).run();
      return result.changes > 0;
    },

    getByFeatureRequestId(featureRequestId: number): Array<StepConfiguration> {
      return db
        .select()
        .from(stepConfigurations)
        .where(eq(stepConfigurations.featureRequestId, featureRequestId))
        .all();
    },

    getByFeatureRequestIdAndStep(featureRequestId: number, step: StepConfigurationStep): StepConfiguration | undefined {
      return db
        .select()
        .from(stepConfigurations)
        .where(and(eq(stepConfigurations.featureRequestId, featureRequestId), eq(stepConfigurations.step, step)))
        .get();
    },

    getById(id: number): StepConfiguration | undefined {
      return db.select().from(stepConfigurations).where(eq(stepConfigurations.id, id)).get();
    },

    update(id: number, data: Partial<NewStepConfiguration>): StepConfiguration | undefined {
      return db
        .update(stepConfigurations)
        .set({ ...data, updatedAt: sql`(CURRENT_TIMESTAMP)` })
        .where(eq(stepConfigurations.id, id))
        .returning()
        .get();
    },

    upsert(
      featureRequestId: number,
      step: StepConfigurationStep,
      data: Omit<NewStepConfiguration, 'featureRequestId' | 'step'>
    ): StepConfiguration {
      const existing = db
        .select()
        .from(stepConfigurations)
        .where(and(eq(stepConfigurations.featureRequestId, featureRequestId), eq(stepConfigurations.step, step)))
        .get();

      if (existing) {
        return db
          .update(stepConfigurations)
          .set({ ...data, updatedAt: sql`(CURRENT_TIMESTAMP)` })
          .where(eq(stepConfigurations.id, existing.id))
          .returning()
          .get();
      }

      return db
        .insert(stepConfigurations)
        .values({ ...data, featureRequestId, step })
        .returning()
        .get();
    },
  };
}
