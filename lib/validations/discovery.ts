import { z } from 'zod';

// Status enum for discovery workflow stages
// - 'idle': Initial state, not started
// - 'scanning': Scanning repository files
// - 'analyzing': AI is analyzing files for relevance
// - 'completed': Discovery finished successfully
// - 'failed': Discovery encountered an error
export const discoveryStatusSchema = z.enum(['analyzing', 'completed', 'failed', 'idle', 'scanning']);

export type DiscoveryStatus = z.infer<typeof discoveryStatusSchema>;

// Action type for discovered files
export const discoveryFileActionSchema = z.enum(['create', 'delete', 'modify', 'review']);

export type DiscoveryFileAction = z.infer<typeof discoveryFileActionSchema>;

// Risk level for discovered files
export const discoveryRiskLevelSchema = z.enum(['high', 'low', 'medium']);

export type DiscoveryRiskLevel = z.infer<typeof discoveryRiskLevelSchema>;

// A code snippet associated with a discovered file
export const discoveryCodeSnippetSchema = z.object({
  code: z.string(),
  endLine: z.number().optional(),
  explanation: z.string().optional(),
  startLine: z.number().optional(),
});

export type DiscoveryCodeSnippet = z.infer<typeof discoveryCodeSnippetSchema>;

// A single discovered file entry
export const discoveredFileEntrySchema = z.object({
  action: discoveryFileActionSchema,
  confidence: z.number().min(0).max(100).optional(),
  dependencies: z.array(z.string()).optional(),
  isEdited: z.boolean().optional(),
  isManuallyAdded: z.boolean().optional(),
  path: z.string(),
  reason: z.string(),
  repositoryId: z.number().optional(),
  risk: discoveryRiskLevelSchema,
  snippets: z.array(discoveryCodeSnippetSchema).optional(),
});

export type DiscoveredFileEntry = z.infer<typeof discoveredFileEntrySchema>;

// Array of discovered files
export const discoveredFilesSchema = z.array(discoveredFileEntrySchema);

export type DiscoveredFiles = z.infer<typeof discoveredFilesSchema>;

// Scope configuration for discovery
export const discoveryScopeConfigSchema = z.object({
  excludePatterns: z.array(z.string()).optional(),
  includePatterns: z.array(z.string()).optional(),
  maxFiles: z.number().positive().optional(),
  repositoryIds: z.array(z.number()).optional(),
});

export type DiscoveryScopeConfig = z.infer<typeof discoveryScopeConfigSchema>;

// Complete discovery results with metadata
export const discoveryResultsSchema = z.object({
  files: discoveredFilesSchema,
  modelUsed: z.string().optional(),
  scopeConfig: discoveryScopeConfigSchema.optional(),
  summary: z.string().optional(),
  timestamp: z.string(),
  totalFiles: z.number(),
});

export type DiscoveryResults = z.infer<typeof discoveryResultsSchema>;

// Parse discovered files from JSON string (used when reading from database)
// Handles both direct array format (legacy) and object format (DiscoveryResults with files property)
export function parseDiscoveredFiles(json: null | string | undefined): DiscoveredFiles {
  if (!json) return [];
  try {
    const parsed: unknown = JSON.parse(json);

    // Handle object format (DiscoveryResults with files property)
    if (parsed && typeof parsed === 'object' && 'files' in parsed) {
      const obj = parsed as { files: unknown };
      if (Array.isArray(obj.files)) {
        return discoveredFilesSchema.parse(obj.files);
      }
    }

    // Handle direct array format (legacy)
    return discoveredFilesSchema.parse(parsed);
  } catch {
    return [];
  }
}

// Parse discovery results from JSON string (used when reading from database)
export function parseDiscoveryResults(json: null | string | undefined): DiscoveryResults | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    return discoveryResultsSchema.parse(parsed);
  } catch {
    return null;
  }
}

// Parse scope config from JSON string (used when reading from database)
export function parseDiscoveryScopeConfig(json: null | string | undefined): DiscoveryScopeConfig | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    return discoveryScopeConfigSchema.parse(parsed);
  } catch {
    return null;
  }
}

// Parse discovery status from string (used when reading from database)
export function parseDiscoveryStatus(status: null | string | undefined): DiscoveryStatus {
  if (!status) return 'idle';
  const result = discoveryStatusSchema.safeParse(status);
  return result.success ? result.data : 'idle';
}

// Stringify discovered files for database storage
export function stringifyDiscoveredFiles(files: DiscoveredFiles): string {
  return JSON.stringify(files);
}

// Stringify discovery results for database storage
export function stringifyDiscoveryResults(results: DiscoveryResults): string {
  return JSON.stringify(results);
}

// Stringify scope config for database storage
export function stringifyDiscoveryScopeConfig(config: DiscoveryScopeConfig): string {
  return JSON.stringify(config);
}

// Form schema for manually adding a discovered file
export const addDiscoveredFileSchema = z.object({
  action: z.string().min(1, 'Please select an action type'),
  path: z
    .string()
    .min(1, 'File path is required')
    .regex(/^[^<>:"|?*]+$/, 'Invalid file path characters'),
  reason: z.string().min(1, 'Please provide a reason for including this file'),
  repositoryId: z.string(),
  risk: z.string().min(1, 'Please select a risk level'),
});

export type AddDiscoveredFileFormValues = z.infer<typeof addDiscoveredFileSchema>;
