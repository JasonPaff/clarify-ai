import { tool } from 'ai';
import { z } from 'zod';

import {
  aiDiscoveryFileActionSchema,
  type AiDiscoveryFileEntry,
  type AiDiscoveryResult,
  aiDiscoveryRiskLevelSchema,
} from '@/lib/validations/ai-discovery';

// ============================================================================
// AI Discovery Tool Input Schema
// ============================================================================

// Zod schema for AI discovery tool input
// This is what the AI will call to report discovered files with justifications
const aiDiscoveryToolInputSchema = z.object({
  // Overall confidence in the discovery results (0-100)
  confidence: z
    .number()
    .min(0)
    .max(100)
    .describe('Overall confidence score (0-100) for the discovery results'),
  // Array of discovered files with justifications
  files: z
    .array(
      z.object({
        // Suggested action for this file (create, modify, review, delete)
        action: aiDiscoveryFileActionSchema.describe('Suggested action for this file'),
        // Confidence score for this specific file (0-100)
        confidence: z
          .number()
          .min(0)
          .max(100)
          .optional()
          .describe('Confidence score (0-100) for this file being relevant'),
        // 1-2 sentence justification (REQUIRED) explaining why this file is relevant
        justification: z
          .string()
          .min(1)
          .max(500)
          .describe(
            'REQUIRED: 1-2 sentence justification explaining why this file is relevant to the feature implementation'
          ),
        // Full file path relative to repository root
        path: z.string().min(1).describe('Full file path relative to repository root'),
        // Risk level for modifying this file
        risk: aiDiscoveryRiskLevelSchema.describe(
          'Risk level (low, medium, high) for modifying this file'
        ),
      })
    )
    .describe('Array of discovered files relevant to the feature implementation'),
  // Explanation of the discovery approach and reasoning
  reasoning: z
    .string()
    .describe(
      'Explanation of how files were identified, patterns recognized, and overall discovery approach'
    ),
  // Brief summary of what was discovered
  summary: z
    .string()
    .describe('Brief summary of what was discovered and the scope of files involved'),
  // Total files analyzed during discovery
  totalFilesAnalyzed: z
    .number()
    .nonnegative()
    .describe('Total number of files analyzed during discovery'),
});

export type AiDiscoveryToolInput = z.infer<typeof aiDiscoveryToolInputSchema>;

// ============================================================================
// AI Discovery Tool Result Type
// ============================================================================

// Type for the tool result matching AiDiscoveryResult schema
export interface AiDiscoveryToolResult {
  // When discovery was completed
  completedAt: string;
  // Discovered files with justifications
  files: Array<AiDiscoveryFileEntry>;
  // AI model used (set by handler, not the tool)
  modelUsed?: string;
  // AI-generated reasoning about discovery approach
  reasoning: string;
  // AI-generated summary
  summary: string;
  // When discovery started (same as completedAt for tool execution)
  timestamp: string;
  // Total files analyzed
  totalFilesAnalyzed: number;
  // Total relevant files discovered
  totalFilesDiscovered: number;
}

// ============================================================================
// AI Discovery Tool Definition
// ============================================================================

/**
 * AI Discovery Tool for Vercel AI SDK v6
 *
 * This tool structures the AI's output for file discovery with justifications.
 * The AI calls this tool to report which files are relevant to implementing
 * a feature, along with a 1-2 sentence justification for each file.
 *
 * Key features:
 * - Justification is REQUIRED for each file (1-2 sentences explaining relevance)
 * - Each file includes action (create/modify/review/delete) and risk level
 * - Optional confidence scores at both file and overall level
 * - Summary and reasoning fields for transparency
 */
export const aiDiscoveryTool = tool({
  description:
    'Report discovered files relevant to implementing a feature. For EACH file, you MUST provide a justification (1-2 sentences) explaining why it is relevant. Include action type (create, modify, review, delete) and risk level for each file.',
  execute: async (input: AiDiscoveryToolInput): Promise<AiDiscoveryToolResult> => {
    const now = new Date().toISOString();

    // Transform input files to match AiDiscoveryFileEntry schema
    const files: Array<AiDiscoveryFileEntry> = input.files.map((file) => ({
      action: file.action,
      confidence: file.confidence,
      justification: file.justification,
      path: file.path,
      risk: file.risk,
    }));

    // Return structured result for the handler to process
    return {
      completedAt: now,
      files,
      reasoning: input.reasoning,
      summary: input.summary,
      timestamp: now,
      totalFilesAnalyzed: input.totalFilesAnalyzed,
      totalFilesDiscovered: files.length,
    };
  },
  inputSchema: aiDiscoveryToolInputSchema,
});

// ============================================================================
// Type Re-exports
// ============================================================================

// Re-export types from validation schema for convenience
export type { AiDiscoveryFileEntry, AiDiscoveryResult };
