import { tool } from 'ai';
import { z } from 'zod';

import { type DiscoveredFileEntry, discoveredFileEntrySchema } from '@/lib/validations/discovery';

// Zod schema for discovery tool input
// This is what the AI will call to report discovered files
const discoveryToolInputSchema = z.object({
  additionalNotes: z
    .string()
    .optional()
    .describe('Any additional notes about the discovery process or special considerations'),
  confidence: z.number().min(0).max(100).describe('Overall confidence score (0-100) for the discovery results'),
  files: z
    .array(discoveredFileEntrySchema)
    .describe('Array of discovered files relevant to the feature implementation'),
  missingFiles: z.array(z.string()).optional().describe('Paths of files that should exist but were not found'),
  reasoning: z.string().describe('Explanation of how files were identified and why they are relevant'),
  suggestedNewFiles: z
    .array(
      z.object({
        path: z.string().describe('Suggested path for the new file'),
        purpose: z.string().describe('Purpose and content description for the new file'),
      })
    )
    .optional()
    .describe('Suggested new files that should be created for this feature'),
  summary: z.string().describe('Brief summary of what was discovered and the scope of changes needed'),
});

export type DiscoveryToolInput = z.infer<typeof discoveryToolInputSchema>;

// Type for the tool result
export interface DiscoveryToolResult {
  additionalNotes?: string;
  completedAt: string;
  confidence: number;
  files: Array<DiscoveredFileEntry>;
  filesDiscovered: number;
  missingFiles: Array<string>;
  reasoning: string;
  suggestedNewFiles: Array<SuggestedNewFile>;
  summary: string;
}

// Type for suggested new file
export interface SuggestedNewFile {
  path: string;
  purpose: string;
}

// Create the discovery tool for Vercel AI SDK v6
// Using inputSchema instead of parameters
export const discoveryTool = tool({
  description:
    'Report discovered files relevant to implementing a feature. Analyze the codebase to identify files that need to be modified, created, reviewed, or deleted for the feature implementation.',
  execute: async (input: DiscoveryToolInput): Promise<DiscoveryToolResult> => {
    // The tool execution returns the structured data for the handler to process
    return {
      additionalNotes: input.additionalNotes,
      completedAt: new Date().toISOString(),
      confidence: input.confidence,
      files: input.files,
      filesDiscovered: input.files.length,
      missingFiles: input.missingFiles ?? [],
      reasoning: input.reasoning,
      suggestedNewFiles: input.suggestedNewFiles ?? [],
      summary: input.summary,
    };
  },
  inputSchema: discoveryToolInputSchema,
});
