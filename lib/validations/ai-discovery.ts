import { z } from 'zod';

// ============================================================================
// AI Discovery Status Schema
// ============================================================================

// Status enum for AI discovery workflow stages
// - 'idle': Initial state, not started
// - 'building_tree': Building the file tree from repository
// - 'analyzing': AI is analyzing files for relevance
// - 'streaming': AI is streaming discovery results
// - 'completed': Discovery finished successfully
// - 'failed': Discovery encountered an error
export const aiDiscoveryStatusSchema = z.enum([
  'analyzing',
  'building_tree',
  'completed',
  'failed',
  'idle',
  'streaming',
]);

export type AiDiscoveryStatus = z.infer<typeof aiDiscoveryStatusSchema>;

// ============================================================================
// File Tree Prune Configuration Schema
// ============================================================================

// Configuration for pruning/filtering the file tree before AI analysis
export const fileTreePruneConfigSchema = z.object({
  // File extensions to exclude (e.g., ['.min.js', '.map'])
  excludeExtensions: z.array(z.string()).optional(),
  // Glob patterns to exclude (e.g., ['**/node_modules/**', '**/dist/**'])
  excludePatterns: z.array(z.string()).optional(),
  // File extensions to include (if specified, only these are included)
  includeExtensions: z.array(z.string()).optional(),
  // Glob patterns to include (if specified, only matching files are included)
  includePatterns: z.array(z.string()).optional(),
  // Maximum depth to traverse in directory tree
  maxDepth: z.number().positive().optional(),
  // Maximum number of files to include in the tree
  maxFiles: z.number().positive().optional(),
  // Whether to include hidden files/directories (starting with .)
  showHidden: z.boolean().optional(),
});

export type FileTreePruneConfig = z.infer<typeof fileTreePruneConfigSchema>;

// ============================================================================
// AI Discovery File Entry Schema
// ============================================================================

// Action type for discovered files (same as discovery.ts for consistency)
export const aiDiscoveryFileActionSchema = z.enum(['create', 'delete', 'modify', 'review']);

export type AiDiscoveryFileAction = z.infer<typeof aiDiscoveryFileActionSchema>;

// Risk level for discovered files
export const aiDiscoveryRiskLevelSchema = z.enum(['high', 'low', 'medium']);

export type AiDiscoveryRiskLevel = z.infer<typeof aiDiscoveryRiskLevelSchema>;

// A single file entry discovered by AI with justification
export const aiDiscoveryFileEntrySchema = z.object({
  // Suggested action for this file
  action: aiDiscoveryFileActionSchema,
  // Confidence score (0-100) for this file's relevance
  confidence: z.number().min(0).max(100).optional(),
  // 1-2 sentence justification explaining why this file is relevant
  justification: z.string().min(1).max(500),
  // Full file path relative to repository root
  path: z.string().min(1),
  // Repository ID this file belongs to
  repositoryId: z.number().optional(),
  // Risk level for modifying this file
  risk: aiDiscoveryRiskLevelSchema,
});

export type AiDiscoveryFileEntry = z.infer<typeof aiDiscoveryFileEntrySchema>;

// Array of AI-discovered file entries
export const aiDiscoveryFileEntriesSchema = z.array(aiDiscoveryFileEntrySchema);

export type AiDiscoveryFileEntries = z.infer<typeof aiDiscoveryFileEntriesSchema>;

// ============================================================================
// AI Discovery Request Schema
// ============================================================================

// Request payload for generating AI file discovery
export const aiDiscoveryRequestSchema = z.object({
  // Clarified/refined feature request description
  featureDescription: z.string().min(1, 'Feature description is required'),
  // Feature request ID for context
  featureRequestId: z.number(),
  // AI model to use for discovery (e.g., 'claude-3-opus', 'gpt-4')
  model: z.string().optional(),
  // Project ID for context
  projectId: z.number(),
  // Configuration for pruning the file tree
  pruneConfig: fileTreePruneConfigSchema.optional(),
  // Repository IDs to analyze (if not specified, all project repositories)
  repositoryIds: z.array(z.number()).optional(),
  // Custom system prompt override
  systemPrompt: z.string().optional(),
});

export type AiDiscoveryRequest = z.infer<typeof aiDiscoveryRequestSchema>;

// ============================================================================
// AI Discovery Progress Schema
// ============================================================================

// Progress update during AI discovery streaming
export const aiDiscoveryProgressSchema = z.object({
  // Current status of the discovery process
  currentStatus: aiDiscoveryStatusSchema,
  // Error message if status is 'failed'
  error: z.string().optional(),
  // Files discovered so far (partial results during streaming)
  filesDiscovered: z.number().nonnegative().optional(),
  // Human-readable message about current progress
  message: z.string().optional(),
  // Progress percentage (0-100)
  progress: z.number().min(0).max(100).optional(),
  // Total files being analyzed
  totalFilesAnalyzed: z.number().nonnegative().optional(),
});

export type AiDiscoveryProgress = z.infer<typeof aiDiscoveryProgressSchema>;

// ============================================================================
// AI Discovery Result Schema
// ============================================================================

// Complete AI discovery result with file justifications
export const aiDiscoveryResultSchema = z.object({
  // When the discovery was completed
  completedAt: z.string().optional(),
  // Discovered files with justifications
  files: aiDiscoveryFileEntriesSchema,
  // AI model used for this discovery
  modelUsed: z.string().optional(),
  // Prune config used for file tree generation
  pruneConfig: fileTreePruneConfigSchema.optional(),
  // AI-generated reasoning about the overall discovery approach
  reasoning: z.string().optional(),
  // AI-generated summary of what was discovered
  summary: z.string().optional(),
  // When the discovery was started
  timestamp: z.string(),
  // Total number of files analyzed
  totalFilesAnalyzed: z.number().nonnegative(),
  // Total number of relevant files discovered
  totalFilesDiscovered: z.number().nonnegative(),
});

export type AiDiscoveryResult = z.infer<typeof aiDiscoveryResultSchema>;

// ============================================================================
// Parse Functions
// ============================================================================

/**
 * Parse AI discovery file entries from JSON string
 * Handles both direct array format and object format with files property
 */
export function parseAiDiscoveryFileEntries(json: null | string | undefined): AiDiscoveryFileEntries {
  if (!json) return [];
  try {
    const parsed: unknown = JSON.parse(json);

    // Handle object format (AiDiscoveryResult with files property)
    if (parsed && typeof parsed === 'object' && 'files' in parsed) {
      const obj = parsed as { files: unknown };
      if (Array.isArray(obj.files)) {
        return aiDiscoveryFileEntriesSchema.parse(obj.files);
      }
    }

    // Handle direct array format
    return aiDiscoveryFileEntriesSchema.parse(parsed);
  } catch {
    return [];
  }
}

/**
 * Parse AI discovery progress from JSON string
 */
export function parseAiDiscoveryProgress(json: null | string | undefined): AiDiscoveryProgress | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    return aiDiscoveryProgressSchema.parse(parsed);
  } catch {
    return null;
  }
}

/**
 * Parse AI discovery request from JSON string
 */
export function parseAiDiscoveryRequest(json: null | string | undefined): AiDiscoveryRequest | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    return aiDiscoveryRequestSchema.parse(parsed);
  } catch {
    return null;
  }
}

/**
 * Parse AI discovery result from JSON string
 */
export function parseAiDiscoveryResult(json: null | string | undefined): AiDiscoveryResult | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    return aiDiscoveryResultSchema.parse(parsed);
  } catch {
    return null;
  }
}

/**
 * Parse AI discovery status from string
 */
export function parseAiDiscoveryStatus(status: null | string | undefined): AiDiscoveryStatus {
  if (!status) return 'idle';
  const result = aiDiscoveryStatusSchema.safeParse(status);
  return result.success ? result.data : 'idle';
}

/**
 * Parse file tree prune config from JSON string
 */
export function parseFileTreePruneConfig(json: null | string | undefined): FileTreePruneConfig | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    return fileTreePruneConfigSchema.parse(parsed);
  } catch {
    return null;
  }
}

// ============================================================================
// Stringify Functions
// ============================================================================

/**
 * Stringify AI discovery file entries for storage
 */
export function stringifyAiDiscoveryFileEntries(files: AiDiscoveryFileEntries): string {
  return JSON.stringify(files);
}

/**
 * Stringify AI discovery progress for transmission
 */
export function stringifyAiDiscoveryProgress(progress: AiDiscoveryProgress): string {
  return JSON.stringify(progress);
}

/**
 * Stringify AI discovery request for transmission
 */
export function stringifyAiDiscoveryRequest(request: AiDiscoveryRequest): string {
  return JSON.stringify(request);
}

/**
 * Stringify AI discovery result for storage
 */
export function stringifyAiDiscoveryResult(result: AiDiscoveryResult): string {
  return JSON.stringify(result);
}

/**
 * Stringify file tree prune config for storage
 */
export function stringifyFileTreePruneConfig(config: FileTreePruneConfig): string {
  return JSON.stringify(config);
}

// ============================================================================
// Default Values
// ============================================================================

// Default prune configuration for file tree generation
export const DEFAULT_FILE_TREE_PRUNE_CONFIG: FileTreePruneConfig = {
  excludePatterns: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.git/**',
    '**/coverage/**',
    '**/.next/**',
    '**/out/**',
  ],
  maxDepth: 10,
  maxFiles: 5000,
  showHidden: false,
};
