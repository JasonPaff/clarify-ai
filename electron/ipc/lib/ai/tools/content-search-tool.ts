import { tool } from 'ai';
import fg from 'fast-glob';
import * as path from 'path';
import { z } from 'zod';

import type { DiscoveryScopeConfig } from '@/lib/validations/discovery';

import {
  DEFAULT_EXCLUDE_PATTERNS,
  extractMatches,
  isBinaryFile,
  isPathWithinRoot,
  readFileContent,
} from './file-utils';

/** Maximum matches to return per search (to avoid context overflow) */
const MAX_MATCHES = 50;

// Zod schema for content search tool input
const contentSearchInputSchema = z.object({
  contextLines: z.number().min(0).max(10).optional().describe('Lines of context before/after each match (default: 2)'),
  fileExtensions: z.array(z.string()).optional().describe('Filter by file extensions (e.g., ["ts", "tsx", "js"])'),
  pattern: z.string().describe('Text pattern or regex to search for in file contents'),
  repositoryId: z.number().describe('The ID of the repository to search in'),
});

export type ContentSearchInput = z.infer<typeof contentSearchInputSchema>;

/** Result of a content search */
export interface ContentSearchResult {
  error?: string;
  filesSearched: number;
  matchCount: number;
  matches: Array<{
    content: string;
    context?: string;
    filePath: string;
    lineNumber: number;
  }>;
  truncated: boolean;
}

/**
 * Create a tool for searching file contents in repositories.
 *
 * @param repositories - Map of repository ID to root path
 * @param scopeConfig - Optional scope configuration
 */
export function createContentSearchTool(repositories: Map<number, string>, scopeConfig?: DiscoveryScopeConfig) {
  return tool({
    description:
      'Search for text patterns or regex in file contents across the repository. Use this to find specific code patterns, function calls, class definitions, or variable usage. Returns matching lines with surrounding context.',
    execute: async (input: ContentSearchInput): Promise<ContentSearchResult> => {
      const { contextLines = 2, fileExtensions, pattern, repositoryId } = input;
      const repoPath = repositories.get(repositoryId);

      if (!repoPath) {
        return {
          error: `Repository with ID ${repositoryId} not found. Available IDs: ${Array.from(repositories.keys()).join(', ')}`,
          filesSearched: 0,
          matchCount: 0,
          matches: [],
          truncated: false,
        };
      }

      try {
        // Build glob patterns for file extensions
        let globPatterns: Array<string>;
        if (fileExtensions && fileExtensions.length > 0) {
          globPatterns = fileExtensions.map((ext) => `**/*.${ext.replace(/^\./, '')}`);
        } else {
          globPatterns = ['**/*'];
        }

        // Merge default excludes with scope excludes
        const excludes = [...DEFAULT_EXCLUDE_PATTERNS, ...(scopeConfig?.excludePatterns ?? [])];

        // Find files to search
        const files = await fg(globPatterns, {
          absolute: true,
          cwd: repoPath,
          dot: false,
          ignore: excludes,
          onlyFiles: true,
          suppressErrors: true,
        });

        // Filter files by scope and security
        const validFiles = files.filter((file) => {
          if (!isPathWithinRoot(file, repoPath)) return false;
          if (isBinaryFile(file)) return false;
          return true;
        });

        // Search through files
        const allMatches: ContentSearchResult['matches'] = [];
        let totalMatchCount = 0;
        let filesSearched = 0;

        // Compile regex pattern (or use plain text search)
        let searchPattern: RegExp | string;
        try {
          // Try to compile as regex first
          searchPattern = new RegExp(pattern, 'gi');
        } catch {
          // Fall back to plain text search
          searchPattern = pattern;
        }

        for (const file of validFiles) {
          if (allMatches.length >= MAX_MATCHES) break;

          const content = await readFileContent(file);
          if (content === null) continue;

          filesSearched++;

          const relativePath = path.relative(repoPath, file);
          const { matchCount, matches } = extractMatches(content, searchPattern, contextLines, relativePath);

          totalMatchCount += matchCount;

          // Add matches up to the limit
          for (const match of matches) {
            if (allMatches.length >= MAX_MATCHES) break;
            allMatches.push(match);
          }
        }

        return {
          filesSearched,
          matchCount: totalMatchCount,
          matches: allMatches,
          truncated: totalMatchCount > MAX_MATCHES,
        };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Unknown error during content search',
          filesSearched: 0,
          matchCount: 0,
          matches: [],
          truncated: false,
        };
      }
    },
    inputSchema: contentSearchInputSchema,
  });
}
