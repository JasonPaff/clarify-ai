import { tool } from 'ai';
import fg from 'fast-glob';
import * as path from 'path';
import { z } from 'zod';

import {
  DEFAULT_EXCLUDE_PATTERNS,
  isBinaryFile,
  isPathWithinRoot,
  isRelativeImport,
  parseImports,
  readFileContent,
  resolveRelativeImport,
} from './file-utils';

/** Maximum related files to return */
const MAX_RELATED_FILES = 50;

// Zod schema for related files tool input
const relatedFilesInputSchema = z.object({
  direction: z
    .enum(['imports', 'importedBy'])
    .describe("'imports' finds files this file imports, 'importedBy' finds files that import this file"),
  filePath: z.string().describe('File path relative to the repository root'),
  repositoryId: z.number().describe('The ID of the repository containing the file'),
});

/** A related file with import information */
export interface RelatedFileInfo {
  importStatement?: string;
  path: string;
}

export type RelatedFilesInput = z.infer<typeof relatedFilesInputSchema>;

/** Result of finding related files */
export interface RelatedFilesResult {
  count?: number;
  direction?: 'importedBy' | 'imports';
  error?: string;
  filePath?: string;
  relatedFiles?: Array<RelatedFileInfo>;
}

/**
 * Create a tool for finding import/export relationships between files.
 *
 * @param repositories - Map of repository ID to root path
 */
export function createRelatedFilesTool(repositories: Map<number, string>) {
  return tool({
    description:
      "Find files that are related to a specific file through imports. Use 'imports' to find what a file imports, or 'importedBy' to find files that import the specified file. This helps understand dependencies and impact of changes.",
    execute: async (input: RelatedFilesInput): Promise<RelatedFilesResult> => {
      const { direction, filePath, repositoryId } = input;
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

        if (direction === 'imports') {
          return await findImports(absolutePath, filePath, repoPath);
        } else {
          return await findImportedBy(filePath, repoPath);
        }
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Unknown error finding related files',
        };
      }
    },
    inputSchema: relatedFilesInputSchema,
  });
}

/**
 * Find files that import the given file
 */
async function findImportedBy(filePath: string, repoPath: string): Promise<RelatedFilesResult> {
  // Get the file name without extension for matching
  const fileBasename = path.basename(filePath);
  const fileWithoutExt = path.basename(filePath, path.extname(filePath));
  const fileDir = path.dirname(filePath);

  // Search patterns for this file
  // Look for imports that reference this file by name
  const searchPatterns = [
    fileBasename,
    fileWithoutExt,
    // Also search for the path alias pattern (e.g., @/lib/utils)
    filePath.replace(/\\/g, '/'),
  ];

  // Find all code files in the repository
  const codeExtensions = ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs'];
  const globPatterns = codeExtensions.map((ext) => `**/*.${ext}`);

  const files = await fg(globPatterns, {
    absolute: true,
    cwd: repoPath,
    dot: false,
    ignore: DEFAULT_EXCLUDE_PATTERNS,
    onlyFiles: true,
    suppressErrors: true,
  });

  const relatedFiles: Array<RelatedFileInfo> = [];

  for (const file of files) {
    if (relatedFiles.length >= MAX_RELATED_FILES) break;

    // Skip the file itself
    const fileRelativePath = path.relative(repoPath, file);
    if (fileRelativePath === filePath) continue;

    // Validate path
    if (!isPathWithinRoot(file, repoPath)) continue;
    if (isBinaryFile(file)) continue;

    // Read file content
    const content = await readFileContent(file);
    if (content === null) continue;

    // Parse imports and check if any import this file
    const imports = parseImports(content);

    for (const { importPath, statement } of imports) {
      // Check if this import references our target file
      if (matchesImport(importPath, filePath, fileRelativePath, fileDir, fileWithoutExt, searchPatterns)) {
        relatedFiles.push({
          importStatement: statement,
          path: fileRelativePath,
        });
        break; // Only add the file once
      }
    }
  }

  return {
    count: relatedFiles.length,
    direction: 'importedBy',
    filePath,
    relatedFiles,
  };
}

/**
 * Find files that a given file imports
 */
async function findImports(
  absolutePath: string,
  relativePath: string,
  repoPath: string
): Promise<RelatedFilesResult> {
  // Check if file is binary
  if (isBinaryFile(absolutePath)) {
    return {
      error: `File "${relativePath}" appears to be a binary file`,
    };
  }

  // Read file content
  const content = await readFileContent(absolutePath);
  if (content === null) {
    return {
      error: `Could not read file "${relativePath}"`,
    };
  }

  // Parse imports
  const imports = parseImports(content);
  const relatedFiles: Array<RelatedFileInfo> = [];

  for (const { importPath, statement } of imports) {
    // Only include relative imports (skip node_modules, etc.)
    if (isRelativeImport(importPath)) {
      const resolvedPath = resolveRelativeImport(importPath, relativePath, repoPath);
      if (resolvedPath) {
        // Try to find the actual file (with extension resolution)
        const actualPath = await resolveImportToFile(resolvedPath, repoPath);
        if (actualPath) {
          relatedFiles.push({
            importStatement: statement,
            path: actualPath,
          });
        } else {
          // Include the unresolved path anyway
          relatedFiles.push({
            importStatement: statement,
            path: resolvedPath,
          });
        }
      }
    }

    if (relatedFiles.length >= MAX_RELATED_FILES) break;
  }

  return {
    count: relatedFiles.length,
    direction: 'imports',
    filePath: relativePath,
    relatedFiles,
  };
}

/**
 * Check if an import path matches the target file
 */
function matchesImport(
  importPath: string,
  targetPath: string,
  importingFilePath: string,
  _targetDir: string,
  _targetBasename: string,
  searchPatterns: Array<string>
): boolean {
  // Normalize paths for comparison
  const normalizedImport = importPath.replace(/\\/g, '/');

  // Check if the import contains any of our search patterns
  for (const pattern of searchPatterns) {
    if (normalizedImport.includes(pattern)) {
      return true;
    }
  }

  // For relative imports, try to resolve and compare
  if (isRelativeImport(importPath)) {
    const importingDir = path.dirname(importingFilePath);
    const resolvedImport = path.normalize(path.join(importingDir, importPath)).replace(/\\/g, '/');

    // Check if resolved import matches target (with or without extension)
    const targetNormalized = targetPath.replace(/\\/g, '/');
    const targetWithoutExt = targetNormalized.replace(/\.[^.]+$/, '');

    if (
      resolvedImport === targetNormalized ||
      resolvedImport === targetWithoutExt ||
      resolvedImport + '/index' === targetWithoutExt
    ) {
      return true;
    }
  }

  // Check for path alias imports (e.g., @/lib/utils)
  if (importPath.startsWith('@/') || importPath.startsWith('~/')) {
    const aliasPath = importPath.slice(2); // Remove @/ or ~/
    const targetNormalized = targetPath.replace(/\\/g, '/');

    if (targetNormalized.endsWith(aliasPath) || targetNormalized.endsWith(aliasPath.replace(/\.[^.]+$/, ''))) {
      return true;
    }
  }

  return false;
}

/**
 * Try to resolve an import path to an actual file
 * Handles extension resolution (ts, tsx, js, jsx, index files)
 */
async function resolveImportToFile(importPath: string, repoPath: string): Promise<null | string> {
  const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];

  for (const ext of extensions) {
    const candidate = importPath + ext;
    const absolutePath = path.resolve(repoPath, candidate);

    try {
      const { stat } = await import('fs/promises');
      const stats = await stat(absolutePath);
      if (stats.isFile()) {
        return candidate;
      }
    } catch {
      // File doesn't exist, try next extension
    }
  }

  return null;
}
