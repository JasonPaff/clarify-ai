import { and, desc, eq, sql } from 'drizzle-orm';

import type { DrizzleDatabase } from '@/db';

import type {
  FeatureRequestRun,
  FeatureRequestRunStatus,
  FeatureRequestRunStep,
  NewFeatureRequestRun,
} from '../schema/feature-request-runs.schema';

import { featureRequestRuns } from '../schema/feature-request-runs.schema';

export interface FeatureRequestRunsRepository {
  create(data: NewFeatureRequestRun): FeatureRequestRun;
  delete(id: number): boolean;
  getByFeatureRequestId(featureRequestId: number): Array<FeatureRequestRun>;
  getByFeatureRequestIdAndStatus(featureRequestId: number, status: FeatureRequestRunStatus): Array<FeatureRequestRun>;
  getByFeatureRequestIdAndStep(featureRequestId: number, step: FeatureRequestRunStep): Array<FeatureRequestRun>;
  getById(id: number): FeatureRequestRun | undefined;
  getLatestByFeatureRequestId(featureRequestId: number): FeatureRequestRun | undefined;
  getLatestByFeatureRequestIdAndStep(
    featureRequestId: number,
    step: FeatureRequestRunStep
  ): FeatureRequestRun | undefined;
  update(id: number, data: Partial<NewFeatureRequestRun>): FeatureRequestRun | undefined;
}

export function createFeatureRequestRunsRepository(db: DrizzleDatabase): FeatureRequestRunsRepository {
  return {
    create(data: NewFeatureRequestRun): FeatureRequestRun {
      return db.insert(featureRequestRuns).values(data).returning().get();
    },

    delete(id: number): boolean {
      const result = db.delete(featureRequestRuns).where(eq(featureRequestRuns.id, id)).run();
      return result.changes > 0;
    },

    getByFeatureRequestId(featureRequestId: number): Array<FeatureRequestRun> {
      return db
        .select()
        .from(featureRequestRuns)
        .where(eq(featureRequestRuns.featureRequestId, featureRequestId))
        .orderBy(desc(featureRequestRuns.createdAt))
        .all();
    },

    getByFeatureRequestIdAndStatus(
      featureRequestId: number,
      status: FeatureRequestRunStatus
    ): Array<FeatureRequestRun> {
      return db
        .select()
        .from(featureRequestRuns)
        .where(and(eq(featureRequestRuns.featureRequestId, featureRequestId), eq(featureRequestRuns.status, status)))
        .orderBy(desc(featureRequestRuns.createdAt))
        .all();
    },

    getByFeatureRequestIdAndStep(featureRequestId: number, step: FeatureRequestRunStep): Array<FeatureRequestRun> {
      return db
        .select()
        .from(featureRequestRuns)
        .where(and(eq(featureRequestRuns.featureRequestId, featureRequestId), eq(featureRequestRuns.step, step)))
        .orderBy(desc(featureRequestRuns.createdAt))
        .all();
    },

    getById(id: number): FeatureRequestRun | undefined {
      return db.select().from(featureRequestRuns).where(eq(featureRequestRuns.id, id)).get();
    },

    getLatestByFeatureRequestId(featureRequestId: number): FeatureRequestRun | undefined {
      return db
        .select()
        .from(featureRequestRuns)
        .where(eq(featureRequestRuns.featureRequestId, featureRequestId))
        .orderBy(desc(featureRequestRuns.createdAt))
        .limit(1)
        .get();
    },

    getLatestByFeatureRequestIdAndStep(
      featureRequestId: number,
      step: FeatureRequestRunStep
    ): FeatureRequestRun | undefined {
      return db
        .select()
        .from(featureRequestRuns)
        .where(and(eq(featureRequestRuns.featureRequestId, featureRequestId), eq(featureRequestRuns.step, step)))
        .orderBy(desc(featureRequestRuns.createdAt))
        .limit(1)
        .get();
    },

    update(id: number, data: Partial<NewFeatureRequestRun>): FeatureRequestRun | undefined {
      return db
        .update(featureRequestRuns)
        .set({ ...data, updatedAt: sql`(CURRENT_TIMESTAMP)` })
        .where(eq(featureRequestRuns.id, id))
        .returning()
        .get();
    },
  };
}
