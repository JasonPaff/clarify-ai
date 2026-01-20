import { eq, sql } from 'drizzle-orm';

import type { DrizzleDatabase } from '../index';
import type { NewProject, Project, ProjectWithFeatureCount } from '../schema/projects.schema';

import { featureRequests } from '../schema/feature-requests.schema';
import { projects } from '../schema/projects.schema';

export interface ProjectsRepository {
  create(data: NewProject): Project;
  delete(id: number): boolean;
  getAll(): Array<ProjectWithFeatureCount>;
  getById(id: number): Project | undefined;
  getFavorited(): Array<Project>;
  update(id: number, data: Partial<NewProject>): Project | undefined;
}

export function createProjectsRepository(db: DrizzleDatabase): ProjectsRepository {
  return {
    create(data: NewProject): Project {
      return db.insert(projects).values(data).returning().get();
    },

    delete(id: number): boolean {
      const result = db.delete(projects).where(eq(projects.id, id)).run();
      return result.changes > 0;
    },

    getAll(): Array<ProjectWithFeatureCount> {
      const featureCountSubquery = db
        .select({
          count: sql<number>`count(*)`.as('count'),
          projectId: featureRequests.projectId,
        })
        .from(featureRequests)
        .groupBy(featureRequests.projectId)
        .as('feature_counts');

      return db
        .select({
          createdAt: projects.createdAt,
          description: projects.description,
          featureCount: sql<number>`coalesce(${featureCountSubquery.count}, 0)`,
          id: projects.id,
          isFavorited: projects.isFavorited,
          name: projects.name,
          updatedAt: projects.updatedAt,
        })
        .from(projects)
        .leftJoin(featureCountSubquery, eq(projects.id, featureCountSubquery.projectId))
        .all();
    },

    getById(id: number): Project | undefined {
      return db.select().from(projects).where(eq(projects.id, id)).get();
    },

    getFavorited(): Array<Project> {
      return db.select().from(projects).where(eq(projects.isFavorited, true)).all();
    },

    update(id: number, data: Partial<NewProject>): Project | undefined {
      return db
        .update(projects)
        .set({ ...data, updatedAt: sql`(CURRENT_TIMESTAMP)` })
        .where(eq(projects.id, id))
        .returning()
        .get();
    },
  };
}
