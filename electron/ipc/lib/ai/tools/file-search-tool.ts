import { tool } from 'ai';
import fg from 'fast-glob';
import { z } from 'zod';

import type { DiscoveryScopeConfig } from '@/lib/validations/discovery';

/** Default patterns to exclude from search */
const DEFAULT_EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/coverage/**',
  '**/.turbo/**',
  '**/out/**',
  '**/*.min.js',
  '**/*.min.css',
  '**/package-lock.json',
  '**/pnpm-lock.yaml',
  '**/yarn.lock',
];

// Zod schema for file search tool input
const searchFilesToolInputSchema = z.object({
  pattern: z.string().describe('Glob pattern to search for (e.g. "**/*.ts", "src/components/*.tsx")'),
  repositoryId: z.number().describe('The ID of the repository to search in'),
});

export type SearchFilesToolInput = z.infer<typeof searchFilesToolInputSchema>;

/**
 * Create a tool for searching files in repositories.
 *
 * @param repositories - Map of repository ID to root path
 * @param scopeConfig - Optional scope configuration
 */
export function createFileSearchTool(
  repositories: Map<number, string>,
  scopeConfig?: DiscoveryScopeConfig
) {
  return tool({
    description: 'Search for files in the repository using glob patterns. Use this to find relevant files based on naming conventions or directory structures.',
    execute: async (input: SearchFilesToolInput) => {
      const { pattern, repositoryId } = input;
      const repoPath = repositories.get(repositoryId);

      if (!repoPath) {
        return {
          error: `Repository with ID ${repositoryId} not found. Available IDs: ${Array.from(repositories.keys()).join(', ')}`,
          files: [],
        };
      }

      try {
        // Merge default excludes with scope excludes
        const excludes = [
          ...DEFAULT_EXCLUDE_PATTERNS,
          ...(scopeConfig?.excludePatterns ?? []),
        ];

        // Perform glob search
        const files = await fg(pattern, {
          absolute: false, // Return relative paths
          cwd: repoPath,
          dot: false,
          ignore: excludes,
          onlyFiles: true,
          suppressErrors: true,
        });

        return {
          count: files.length,
          files: files.slice(0, 100), // Limit to 100 files to avoid overwhelming context
          truncated: files.length > 100,
        };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Unknown error during file search',
          files: [],
        };
      }
    },
    inputSchema: searchFilesToolInputSchema,
  });
}
