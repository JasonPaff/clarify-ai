import { z } from 'zod';

// Status enum for feature request workflow stages
const featureRequestStatusSchema = z.enum(['completed', 'draft', 'planning', 'refining', 'researching']);

// Shared field validations for DRY compliance
const featureRequestDescriptionSchema = z.string();

const featureRequestRawRequestSchema = z.string();

const featureRequestTitleSchema = z.string().min(1, 'Title is required').max(255, 'Title is too long');

// Schema for creating a new feature request
export const createFeatureRequestSchema = z.object({
  description: featureRequestDescriptionSchema,
  title: featureRequestTitleSchema,
});

export type CreateFeatureRequestFormValues = z.infer<typeof createFeatureRequestSchema>;

// Schema for the Entry step form
export const entryStepFormSchema = z.object({
  rawRequest: featureRequestRawRequestSchema,
});

export type EntryStepFormValues = z.infer<typeof entryStepFormSchema>;

// Schema for updating an existing feature request (API-level, allows partial updates)
export const updateFeatureRequestSchema = z.object({
  description: featureRequestDescriptionSchema,
  rawRequest: featureRequestRawRequestSchema.optional(),
  status: featureRequestStatusSchema.optional(),
  title: featureRequestTitleSchema.optional(),
});

export type UpdateFeatureRequestFormValues = z.infer<typeof updateFeatureRequestSchema>;

// Schema for the edit form (requires all fields since form always provides them)
export const editFeatureRequestFormSchema = z.object({
  description: featureRequestDescriptionSchema,
  status: featureRequestStatusSchema,
  title: featureRequestTitleSchema,
});

export type EditFeatureRequestFormValues = z.infer<typeof editFeatureRequestFormSchema>;

// Export status schema for reuse in form components
export const featureRequestStatuses = featureRequestStatusSchema.options;
export type FeatureRequestStatus = z.infer<typeof featureRequestStatusSchema>;
