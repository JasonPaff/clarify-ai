import { z } from 'zod';

// Input method enum for selecting how to provide overview content
const inputMethodSchema = z.enum(['file', 'paste']);

// Content field validation - non-empty trimmed string
const contentSchema = z
  .string()
  .transform((val) => val.trim())
  .pipe(z.string().min(1, 'Overview content is required'));

// Schema for importing repository overview
export const importRepositoryOverviewSchema = z.object({
  content: contentSchema,
  inputMethod: inputMethodSchema,
});

export type ImportRepositoryOverviewFormValues = z.infer<typeof importRepositoryOverviewSchema>;

// Export input method options for use in form components
export const inputMethodOptions = inputMethodSchema.options;
export type InputMethod = z.infer<typeof inputMethodSchema>;
