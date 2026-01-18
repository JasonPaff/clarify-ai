import { eq, sql } from 'drizzle-orm';

import type { DrizzleDatabase } from '../index';
import type { FeatureRequest, NewFeatureRequest } from '../schema/feature-requests.schema';

import { featureRequests } from '../schema/feature-requests.schema';

export interface FeatureRequestsRepository {
  create(data: NewFeatureRequest): FeatureRequest;
  delete(id: number): boolean;
  getById(id: number): FeatureRequest | undefined;
  getByProjectId(projectId: number): Array<FeatureRequest>;
  update(id: number, data: Partial<NewFeatureRequest>): FeatureRequest | undefined;
}

export function createFeatureRequestsRepository(db: DrizzleDatabase): FeatureRequestsRepository {
  return {
    create(data: NewFeatureRequest): FeatureRequest {
      return db.insert(featureRequests).values(data).returning().get();
    },

    delete(id: number): boolean {
      const result = db.delete(featureRequests).where(eq(featureRequests.id, id)).run();
      return result.changes > 0;
    },

    getById(id: number): FeatureRequest | undefined {
      return db.select().from(featureRequests).where(eq(featureRequests.id, id)).get();
    },

    getByProjectId(projectId: number): Array<FeatureRequest> {
      return db.select().from(featureRequests).where(eq(featureRequests.projectId, projectId)).all();
    },

    update(id: number, data: Partial<NewFeatureRequest>): FeatureRequest | undefined {
      return db
        .update(featureRequests)
        .set({ ...data, updatedAt: sql`(CURRENT_TIMESTAMP)` })
        .where(eq(featureRequests.id, id))
        .returning()
        .get();
    },
  };
}
