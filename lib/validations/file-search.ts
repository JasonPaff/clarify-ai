import { z } from 'zod';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validates a regex pattern string
 * @param pattern - The regex pattern to validate
 * @returns Object with isValid boolean and optional error message
 */
export function validateRegexPattern(pattern: string): { error?: string; isValid: boolean } {
  if (!pattern) {
    return { isValid: true };
  }

  try {
    new RegExp(pattern);
    return { isValid: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid regex pattern';
    return { error: message, isValid: false };
  }
}

// ============================================================================
// File Type Schema
// ============================================================================

// Common file types for filtering
export const fileTypeSchema = z.enum(['all', 'code', 'config', 'documentation', 'styles', 'tests', 'types']);

export type FileType = z.infer<typeof fileTypeSchema>;

// ============================================================================
// Match Type Schema
// ============================================================================

// How a file was matched in search results
export const matchTypeSchema = z.enum(['filename', 'content', 'both']);

export type MatchType = z.infer<typeof matchTypeSchema>;

// ============================================================================
// Snippet Schemas
// ============================================================================

// Highlight range within a snippet line
export const highlightRangeSchema = z.object({
  end: z.number().nonnegative(),
  start: z.number().nonnegative(),
});

export type HighlightRange = z.infer<typeof highlightRangeSchema>;

// A code snippet with contextual information
export const fileSearchSnippetSchema = z.object({
  content: z.string(),
  highlightRanges: z.array(highlightRangeSchema).optional(),
  lineNumber: z.number().positive(),
});

export type FileSearchSnippet = z.infer<typeof fileSearchSnippetSchema>;

// ============================================================================
// Search Result Schema
// ============================================================================

// Individual file search result
export const fileSearchResultSchema = z.object({
  filePath: z.string().min(1),
  matchCount: z.number().nonnegative(),
  // matchType indicates how the file was discovered: by filename, content, or both
  // Optional during transition; handler will populate once filename matching is implemented
  matchType: matchTypeSchema.optional(),
  repositoryId: z.number(),
  repositoryName: z.string(),
  snippets: z.array(fileSearchSnippetSchema).optional(),
});

export type FileSearchResult = z.infer<typeof fileSearchResultSchema>;

// Array of search results
export const fileSearchResultsSchema = z.array(fileSearchResultSchema);

export type FileSearchResults = z.infer<typeof fileSearchResultsSchema>;

// ============================================================================
// Search Request Schema
// ============================================================================

// Search request parameters (sent to main process)
export const fileSearchRequestSchema = z.object({
  excludeGlobs: z.array(z.string()).optional(),
  fileTypes: z.array(fileTypeSchema).optional(),
  includeGlobs: z.array(z.string()).optional(),
  maxResults: z.number().positive().max(1000).optional(),
  query: z.string().min(1, 'Search query is required'),
  repositoryIds: z.array(z.number()).optional(),
  snippetDepth: z.number().nonnegative().max(10).optional(),
  useRegex: z.boolean().optional(),
});

export type FileSearchRequest = z.infer<typeof fileSearchRequestSchema>;

// ============================================================================
// Form Schema
// ============================================================================

// Default values for form
export const FILE_SEARCH_FORM_DEFAULTS = {
  excludeGlobs: '',
  fileTypes: ['all'] as Array<FileType>,
  includeGlobs: '',
  maxResults: 100,
  query: '',
  snippetDepth: 2,
  useRegex: false,
} as const;

// Form validation schema with user-friendly error messages
export const fileSearchFormSchema = z
  .object({
    excludeGlobs: z.string().optional(),
    fileTypes: z.array(fileTypeSchema).min(1, 'Select at least one file type'),
    includeGlobs: z.string().optional(),
    maxResults: z.number().positive('Max results must be positive').max(1000, 'Max results cannot exceed 1000'),
    query: z.string().min(1, 'Search query is required'),
    snippetDepth: z.number().nonnegative('Snippet depth cannot be negative').max(10, 'Snippet depth cannot exceed 10'),
    useRegex: z.boolean(),
  })
  .superRefine((data, ctx) => {
    // Validate query as regex if useRegex is true
    if (data.useRegex && data.query) {
      const validation = validateRegexPattern(data.query);
      if (!validation.isValid) {
        ctx.addIssue({
          code: 'custom',
          message: validation.error ?? 'Invalid regex pattern',
          path: ['query'],
        });
      }
    }
  });

export type FileSearchFormValues = z.infer<typeof fileSearchFormSchema>;

// ============================================================================
// Response Schema
// ============================================================================

// Complete search response with metadata
export const fileSearchResponseSchema = z.object({
  hasMore: z.boolean(),
  results: fileSearchResultsSchema,
  searchDuration: z.number().nonnegative().optional(),
  totalMatches: z.number().nonnegative(),
});

export type FileSearchResponse = z.infer<typeof fileSearchResponseSchema>;

// ============================================================================
// Utility Functions for Parsing
// ============================================================================

/**
 * Convert form values to search request
 * Handles conversion of comma-separated glob strings to arrays
 */
export function formValuesToSearchRequest(
  values: FileSearchFormValues,
  repositoryIds?: Array<number>
): FileSearchRequest {
  const excludeGlobs = values.excludeGlobs
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const includeGlobs = values.includeGlobs
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    excludeGlobs: excludeGlobs?.length ? excludeGlobs : undefined,
    fileTypes: values.fileTypes.includes('all') ? undefined : values.fileTypes,
    includeGlobs: includeGlobs?.length ? includeGlobs : undefined,
    maxResults: values.maxResults,
    query: values.query,
    repositoryIds,
    snippetDepth: values.snippetDepth,
    useRegex: values.useRegex,
  };
}

/**
 * Parse file search response from JSON string
 */
export function parseFileSearchResponse(json: null | string | undefined): FileSearchResponse | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    return fileSearchResponseSchema.parse(parsed);
  } catch {
    return null;
  }
}

/**
 * Parse file search results from JSON string
 */
export function parseFileSearchResults(json: null | string | undefined): FileSearchResults {
  if (!json) return [];
  try {
    const parsed: unknown = JSON.parse(json);
    return fileSearchResultsSchema.parse(parsed);
  } catch {
    return [];
  }
}
