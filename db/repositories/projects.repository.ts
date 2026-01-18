import { eq, sql } from 'drizzle-orm';

import type { DrizzleDatabase } from '../index';
import type { NewProject, Project } from '../schema/projects.schema';

import { projects } from '../schema/projects.schema';

export interface ProjectsRepository {
  create(data: NewProject): Project;
  delete(id: number): boolean;
  getAll(): Array<Project>;
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

    getAll(): Array<Project> {
      return db.select().from(projects).all();
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
