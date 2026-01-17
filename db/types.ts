// Re-export database types for renderer consumption
// This file provides a clean separation between database implementation
// (which imports drizzle-orm) and type definitions (which just re-export inferred types)

export type { NewProject, Project } from './schema/projects.schema';
export type { NewRepository, Repository } from './schema/repositories.schema';
