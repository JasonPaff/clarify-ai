import { z } from 'zod';

// Shared field validations for DRY compliance
const projectNameSchema = z.string().min(1, 'Project name is required').max(255, 'Project name is too long');

const projectDescriptionSchema = z.string();

const projectPlanExportFolderSchema = z.string().optional();

// Schema for creating a new project
export const createProjectSchema = z.object({
  description: projectDescriptionSchema,
  name: projectNameSchema,
  planExportFolder: projectPlanExportFolderSchema,
});

export type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

// Schema for updating an existing project
export const updateProjectSchema = z.object({
  description: projectDescriptionSchema,
  name: projectNameSchema,
  planExportFolder: projectPlanExportFolderSchema,
});

export type UpdateProjectFormValues = z.infer<typeof updateProjectSchema>;
