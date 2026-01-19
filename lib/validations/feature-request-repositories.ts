import { z } from 'zod';

// Repository IDs schema for create/edit forms
// Empty array is valid - repository selection is optional
export const repositoryIdsSchema = z.array(z.number().int().positive());

export type RepositoryIds = z.infer<typeof repositoryIdsSchema>;

// Required repository IDs schema for research step
// Enforces at least one repository must be selected
export const requiredRepositoryIdsSchema = z
  .array(z.number().int().positive())
  .min(1, 'At least one repository must be selected');

export type RequiredRepositoryIds = z.infer<typeof requiredRepositoryIdsSchema>;

// Form schema for research step - wraps the required IDs in an object for TanStack Form
export const researchStepFormSchema = z.object({
  repositoryIds: requiredRepositoryIdsSchema,
});

export type ResearchStepFormValues = z.infer<typeof researchStepFormSchema>;
