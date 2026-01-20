import { and, eq, sql } from 'drizzle-orm';

import type { DrizzleDatabase } from '@/db';

import type {
  ContextFileType,
  FeatureRequestContextFile,
  NewFeatureRequestContextFile,
} from '../schema/feature-request-context-files.schema';

import { featureRequestContextFiles } from '../schema/feature-request-context-files.schema';

export interface FeatureRequestContextFilesRepository {
  bulkCreate(data: Array<NewFeatureRequestContextFile>): Array<FeatureRequestContextFile>;
  create(data: NewFeatureRequestContextFile): FeatureRequestContextFile;
  delete(id: number): boolean;
  getByFeatureRequestId(featureRequestId: number): Array<FeatureRequestContextFile>;
  getByFeatureRequestIdAndType(featureRequestId: number, fileType: ContextFileType): Array<FeatureRequestContextFile>;
  getById(id: number): FeatureRequestContextFile | undefined;
  setIncludedInContext(id: number, includedInContext: boolean): FeatureRequestContextFile | undefined;
  update(id: number, data: Partial<NewFeatureRequestContextFile>): FeatureRequestContextFile | undefined;
}

export function createFeatureRequestContextFilesRepository(db: DrizzleDatabase): FeatureRequestContextFilesRepository {
  return {
    bulkCreate(data: Array<NewFeatureRequestContextFile>): Array<FeatureRequestContextFile> {
      if (data.length === 0) {
        return [];
      }
      return db.insert(featureRequestContextFiles).values(data).returning().all();
    },

    create(data: NewFeatureRequestContextFile): FeatureRequestContextFile {
      return db.insert(featureRequestContextFiles).values(data).returning().get();
    },

    delete(id: number): boolean {
      const result = db.delete(featureRequestContextFiles).where(eq(featureRequestContextFiles.id, id)).run();
      return result.changes > 0;
    },

    getByFeatureRequestId(featureRequestId: number): Array<FeatureRequestContextFile> {
      return db
        .select()
        .from(featureRequestContextFiles)
        .where(eq(featureRequestContextFiles.featureRequestId, featureRequestId))
        .all();
    },

    getByFeatureRequestIdAndType(
      featureRequestId: number,
      fileType: ContextFileType
    ): Array<FeatureRequestContextFile> {
      return db
        .select()
        .from(featureRequestContextFiles)
        .where(
          and(
            eq(featureRequestContextFiles.featureRequestId, featureRequestId),
            eq(featureRequestContextFiles.fileType, fileType)
          )
        )
        .all();
    },

    getById(id: number): FeatureRequestContextFile | undefined {
      return db.select().from(featureRequestContextFiles).where(eq(featureRequestContextFiles.id, id)).get();
    },

    setIncludedInContext(id: number, includedInContext: boolean): FeatureRequestContextFile | undefined {
      return db
        .update(featureRequestContextFiles)
        .set({ includedInContext, updatedAt: sql`(CURRENT_TIMESTAMP)` })
        .where(eq(featureRequestContextFiles.id, id))
        .returning()
        .get();
    },

    update(id: number, data: Partial<NewFeatureRequestContextFile>): FeatureRequestContextFile | undefined {
      return db
        .update(featureRequestContextFiles)
        .set({ ...data, updatedAt: sql`(CURRENT_TIMESTAMP)` })
        .where(eq(featureRequestContextFiles.id, id))
        .returning()
        .get();
    },
  };
}
