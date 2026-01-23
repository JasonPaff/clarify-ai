import { tool } from 'ai';
import * as path from 'path';
import { z } from 'zod';

import { scanRepository } from '../../repository-scanner';
import { isPathWithinRoot } from './file-utils';

// Zod schema for project structure tool input
const projectStructureInputSchema = z.object({
  directory: z.string().optional().describe('Subdirectory to start from (relative to repo root). Default: root'),
  maxDepth: z.number().min(1).max(6).optional().describe('Maximum depth to traverse (1-6). Default: 3'),
  repositoryId: z.number().describe('The ID of the repository to analyze'),
});

export type ProjectStructureInput = z.infer<typeof projectStructureInputSchema>;

/** Result of getting project structure */
export interface ProjectStructureResult {
  directories?: Array<string>;
  error?: string;
  fileCount?: number;
  structure?: string;
}

/**
 * Create a tool for getting project directory structure.
 *
 * @param repositories - Map of repository ID to root path
 */
export function createProjectStructureTool(repositories: Map<number, string>) {
  return tool({
    description:
      'Get the directory tree structure of a repository or subdirectory. Use this to understand codebase organization, explore unfamiliar areas, and identify key directories. Returns an ASCII tree representation.',
    execute: async (input: ProjectStructureInput): Promise<ProjectStructureResult> => {
      const { directory, maxDepth = 3, repositoryId } = input;
      const repoPath = repositories.get(repositoryId);

      if (!repoPath) {
        return {
          error: `Repository with ID ${repositoryId} not found. Available IDs: ${Array.from(repositories.keys()).join(', ')}`,
        };
      }

      try {
        // Determine the scan path
        let scanPath = repoPath;
        if (directory) {
          scanPath = path.resolve(repoPath, directory);

          // Validate path is within repository root
          if (!isPathWithinRoot(scanPath, repoPath)) {
            return {
              error: `Directory "${directory}" is outside the repository root`,
            };
          }
        }

        // Scan the directory
        const result = await scanRepository(scanPath, {
          maxDepth,
          respectGitignore: true,
        });

        // Extract directory paths from the tree
        const directories = extractDirectories(result.fileTree);

        return {
          directories,
          fileCount: result.totalFiles,
          structure: result.fileTree,
        };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Unknown error analyzing project structure',
        };
      }
    },
    inputSchema: projectStructureInputSchema,
  });
}

/**
 * Extract directory paths from an ASCII tree representation
 */
function extractDirectories(tree: string): Array<string> {
  const lines = tree.split('\n');
  const directories: Array<string> = [];

  for (const line of lines) {
    // Match lines ending with / (directories)
    if (line.endsWith('/')) {
      // Remove tree characters and extract the path
      const cleaned = line.replace(/^[│├└─\s]+/, '').replace(/\/$/, '');
      if (cleaned) {
        directories.push(cleaned);
      }
    }
  }

  return directories;
}
