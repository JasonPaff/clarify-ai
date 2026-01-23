import { tool } from 'ai';
import * as path from 'path';
import { z } from 'zod';

import { detectLanguage, isBinaryFile, isPathWithinRoot, readFileContent } from './file-utils';

// Zod schema for file read tool input
const fileReadInputSchema = z.object({
  endLine: z.number().positive().optional().describe('End line number (1-indexed, inclusive)'),
  filePath: z.string().describe('File path relative to the repository root'),
  repositoryId: z.number().describe('The ID of the repository containing the file'),
  startLine: z.number().positive().optional().describe('Start line number (1-indexed)'),
});

export type FileReadInput = z.infer<typeof fileReadInputSchema>;

/** Result of reading a file */
export interface FileReadResult {
  content?: string;
  error?: string;
  filePath?: string;
  language?: string;
  requestedRange?: string;
  totalLines?: number;
}

/**
 * Create a tool for reading file contents from repositories.
 *
 * @param repositories - Map of repository ID to root path
 */
export function createFileReadTool(repositories: Map<number, string>) {
  return tool({
    description:
      'Read the contents of a specific file from the repository. Use this to examine file context before including it in the discovery results. Supports reading specific line ranges for large files.',
    execute: async (input: FileReadInput): Promise<FileReadResult> => {
      const { endLine, filePath, repositoryId, startLine } = input;
      const repoPath = repositories.get(repositoryId);

      if (!repoPath) {
        return {
          error: `Repository with ID ${repositoryId} not found. Available IDs: ${Array.from(repositories.keys()).join(', ')}`,
        };
      }

      try {
        // Resolve absolute path
        const absolutePath = path.resolve(repoPath, filePath);

        // Validate path is within repository root
        if (!isPathWithinRoot(absolutePath, repoPath)) {
          return {
            error: `File path "${filePath}" is outside the repository root`,
          };
        }

        // Check if file is binary
        if (isBinaryFile(absolutePath)) {
          return {
            error: `File "${filePath}" appears to be a binary file and cannot be read as text`,
          };
        }

        // Read file content
        const content = await readFileContent(absolutePath);
        if (content === null) {
          return {
            error: `Could not read file "${filePath}". It may be too large (>5MB), not exist, or have permission issues`,
          };
        }

        // Split into lines
        const lines = content.split('\n');
        const totalLines = lines.length;

        // Apply line range if specified
        let resultContent: string;
        let requestedRange: string;

        if (startLine !== undefined || endLine !== undefined) {
          const start = startLine ? startLine - 1 : 0; // Convert to 0-indexed
          const end = endLine ? Math.min(endLine, totalLines) : totalLines;

          if (start >= totalLines) {
            return {
              error: `Start line ${startLine} exceeds total lines (${totalLines})`,
            };
          }

          resultContent = lines.slice(start, end).join('\n');
          requestedRange = `${start + 1}-${end}`;
        } else {
          resultContent = content;
          requestedRange = 'all';
        }

        // Detect language from extension
        const language = detectLanguage(absolutePath);

        return {
          content: resultContent,
          filePath,
          language,
          requestedRange,
          totalLines,
        };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Unknown error reading file',
        };
      }
    },
    inputSchema: fileReadInputSchema,
  });
}
