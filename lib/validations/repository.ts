import { z } from 'zod';

// Shared field validations for DRY compliance
const repositoryNameSchema = z.string().min(1, 'Repository name is required').max(255, 'Repository name is too long');

const repositoryPathSchema = z.string().min(1, 'Repository path is required');

// Schema for creating a new repository
export const createRepositorySchema = z.object({
  name: repositoryNameSchema,
  path: repositoryPathSchema,
});

export type CreateRepositoryFormValues = z.infer<typeof createRepositorySchema>;

// Schema for updating an existing repository
export const updateRepositorySchema = z.object({
  name: repositoryNameSchema,
  path: repositoryPathSchema,
});

export type UpdateRepositoryFormValues = z.infer<typeof updateRepositorySchema>;
