import { z } from 'zod';

import { repositoryIdsSchema, requiredRepositoryIdsSchema } from './feature-request-repositories';

/**
 * Status enum for feature request workflow stages:
 * - 'draft': Initial state, not yet started
 * - 'describing': Currently in the Describe step
 * - 'clarifying': Currently in the Clarify step
 * - 'researching': Currently in the Discover step
 * - 'planning': Currently in the Plan step
 * - 'completed': All steps finished successfully
 * - 'failed': An error occurred during processing
 */
const featureRequestStatusSchema = z.enum([
  'clarifying',
  'completed',
  'describing',
  'draft',
  'failed',
  'planning',
  'researching',
]);

// Shared field validations for DRY compliance
const featureRequestDescriptionSchema = z.string();

const featureRequestRawRequestSchema = z.string().min(1, 'Please describe your feature request');

const featureRequestTitleSchema = z.string().min(1, 'Title is required').max(255, 'Title is too long');

// Schema for creating a new feature request
// Requires at least one repository to be selected for discovery and planning workflow
export const createFeatureRequestSchema = z.object({
  description: featureRequestDescriptionSchema,
  repositoryIds: requiredRepositoryIdsSchema,
  title: featureRequestTitleSchema,
});

export type CreateFeatureRequestFormValues = z.infer<typeof createFeatureRequestSchema>;

// Schema for the Entry step form (deprecated - use describeStepFormSchema instead)
export const entryStepFormSchema = z.object({
  rawRequest: featureRequestRawRequestSchema,
});

export type EntryStepFormValues = z.infer<typeof entryStepFormSchema>;

// Schema for the DescribeStep form - combines raw request content and repository selection
export const describeStepFormSchema = z.object({
  rawRequest: featureRequestRawRequestSchema,
  repositoryIds: repositoryIdsSchema,
});

export type DescribeStepFormValues = z.infer<typeof describeStepFormSchema>;

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
  repositoryIds: repositoryIdsSchema,
  status: featureRequestStatusSchema,
  title: featureRequestTitleSchema,
});

export type EditFeatureRequestFormValues = z.infer<typeof editFeatureRequestFormSchema>;

// Export status schema for reuse in form components
export const featureRequestStatuses = featureRequestStatusSchema.options;
export type FeatureRequestStatus = z.infer<typeof featureRequestStatusSchema>;
