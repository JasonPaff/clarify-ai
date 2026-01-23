/**
 * File Tree Pruning Utility
 *
 * Generates a pruned file tree structure from repository paths,
 * applying configurable ignore patterns to exclude non-source directories.
 * This provides a condensed view of repository structure for AI discovery
 * that fits within token budgets.
 */

import fg from 'fast-glob';
import path from 'path';

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration for building a pruned file tree.
 */
export interface PrunedFileTreeConfig {
  /** Additional glob patterns to exclude beyond defaults */
  additionalExcludePatterns?: Array<string>;
  /** Whether to include hidden files/directories (starting with .) */
  includeHidden?: boolean;
  /** Glob patterns to include only specific files (if specified, only matching files are included) */
  includePatterns?: Array<string>;
  /** Maximum depth to traverse in directory tree */
  maxDepth?: number;
  /** Maximum number of files to include in the tree */
  maxFiles?: number;
}

/**
 * Result from building a pruned file tree.
 */
export interface PrunedFileTreeResult {
  /** The formatted file tree string */
  fileTree: string;
  /** Estimated token count for the tree */
  tokenCount: number;
  /** Total number of directories in the tree */
  totalDirectories: number;
  /** Total number of files in the tree */
  totalFiles: number;
  /** Whether the tree was truncated due to limits */
  wasTruncated: boolean;
}

/**
 * Options for token estimation.
 */
export interface TokenEstimationOptions {
  /** Characters per token ratio (default: 4 - conservative estimate) */
  charsPerToken?: number;
}

/**
 * Options for tree truncation.
 */
export interface TruncateTreeOptions {
  /** Characters per token ratio (default: 4) */
  charsPerToken?: number;
  /** Maximum tokens allowed in the tree */
  maxTokens: number;
  /** Suffix to append when tree is truncated */
  truncationSuffix?: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default glob patterns to exclude from file tree.
 * These patterns exclude common non-source directories and files.
 */
export const DEFAULT_IGNORE_PATTERNS: Array<string> = [
  // Version control
  '**/.git/**',
  '**/.hg/**',
  '**/.svn/**',

  // Dependencies
  '**/node_modules/**',
  '**/vendor/**',
  '**/bower_components/**',
  '**/.pnpm/**',

  // Build outputs
  '**/dist/**',
  '**/build/**',
  '**/out/**',
  '**/.next/**',
  '**/.nuxt/**',
  '**/.output/**',

  // Test coverage
  '**/coverage/**',
  '**/.nyc_output/**',

  // Cache directories
  '**/.cache/**',
  '**/.turbo/**',
  '**/.parcel-cache/**',
  '**/.webpack/**',

  // IDE/Editor settings
  '**/.idea/**',
  '**/.vscode/**',
  '**/.vs/**',

  // Python
  '**/__pycache__/**',
  '**/.venv/**',
  '**/venv/**',
  '**/env/**',
  '**/*.egg-info/**',
  '**/.eggs/**',

  // Deployment
  '**/.netlify/**',
  '**/.vercel/**',

  // Logs
  '**/logs/**',
  '**/*.log',

  // Temporary files
  '**/tmp/**',
  '**/temp/**',

  // Lock files (often large and not useful for context)
  '**/package-lock.json',
  '**/pnpm-lock.yaml',
  '**/yarn.lock',
  '**/Gemfile.lock',
  '**/poetry.lock',
  '**/Cargo.lock',

  // Minified files
  '**/*.min.js',
  '**/*.min.css',

  // Source maps
  '**/*.map',

  // Binary/media files
  '**/*.png',
  '**/*.jpg',
  '**/*.jpeg',
  '**/*.gif',
  '**/*.ico',
  '**/*.svg',
  '**/*.webp',
  '**/*.pdf',
  '**/*.zip',
  '**/*.tar',
  '**/*.gz',
  '**/*.rar',
  '**/*.7z',
  '**/*.woff',
  '**/*.woff2',
  '**/*.ttf',
  '**/*.eot',
  '**/*.mp3',
  '**/*.mp4',
  '**/*.avi',
  '**/*.mov',
  '**/*.webm',

  // Database files
  '**/*.sqlite',
  '**/*.sqlite3',
  '**/*.db',
];

/** Default maximum depth for directory traversal */
const DEFAULT_MAX_DEPTH = 10;

/** Default maximum number of files to include */
const DEFAULT_MAX_FILES = 5000;

/** Default characters per token ratio (conservative estimate) */
const DEFAULT_CHARS_PER_TOKEN = 4;

/** Default truncation suffix */
const DEFAULT_TRUNCATION_SUFFIX = '\n... (tree truncated due to token limit)';

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Internal node structure for building the tree.
 */
interface TreeNode {
  children: Map<string, TreeNode>;
  isFile: boolean;
  name: string;
}

/**
 * Builds a pruned file tree from a repository path.
 * Uses fast-glob to discover files while respecting ignore patterns.
 *
 * @param repoPath - Absolute path to the repository root
 * @param config - Configuration options for the file tree
 * @returns Formatted file tree string with metadata
 */
export async function buildPrunedFileTree(repoPath: string, config?: PrunedFileTreeConfig): Promise<PrunedFileTreeResult> {
  const {
    additionalExcludePatterns,
    includeHidden = false,
    includePatterns = ['**/*'],
    maxDepth = DEFAULT_MAX_DEPTH,
    maxFiles = DEFAULT_MAX_FILES,
  } = config ?? {};

  // Merge ignore patterns
  const ignorePatterns = mergeIgnorePatterns(additionalExcludePatterns);

  // Discover files using fast-glob
  const files = await fg(includePatterns, {
    absolute: false,
    cwd: repoPath,
    deep: maxDepth,
    dot: includeHidden,
    ignore: ignorePatterns,
    onlyFiles: true,
    suppressErrors: true,
  });

  // Check if we need to truncate files
  const wasTruncated = files.length > maxFiles;
  const truncatedFiles = wasTruncated ? files.slice(0, maxFiles) : files;

  // Build tree structure from file paths
  const { directories, fileTree } = buildTreeFromPaths(truncatedFiles, path.basename(repoPath));

  // Calculate token count
  const tokenCount = countFileTreeTokens(fileTree);

  return {
    fileTree,
    tokenCount,
    totalDirectories: directories,
    totalFiles: truncatedFiles.length,
    wasTruncated,
  };
}

/**
 * Estimates token count from text using a character-based heuristic.
 * Uses ~4 characters per token as a conservative estimate.
 *
 * @param text - Text to estimate tokens for
 * @param options - Token estimation options
 * @returns Estimated token count
 */
export function countFileTreeTokens(text: string, options?: TokenEstimationOptions): number {
  if (!text || text.length === 0) {
    return 0;
  }
  const charsPerToken = options?.charsPerToken ?? DEFAULT_CHARS_PER_TOKEN;
  return Math.ceil(text.length / charsPerToken);
}

/**
 * Merges user-provided ignore patterns with default patterns.
 * User patterns are prepended to defaults, allowing them to override.
 *
 * @param userPatterns - Additional patterns to exclude
 * @returns Combined array of ignore patterns
 */
export function mergeIgnorePatterns(userPatterns?: Array<string>): Array<string> {
  if (!userPatterns || userPatterns.length === 0) {
    return [...DEFAULT_IGNORE_PATTERNS];
  }
  // User patterns come first, then defaults
  return [...userPatterns, ...DEFAULT_IGNORE_PATTERNS];
}

// ============================================================================
// Internal Helper Functions
// ============================================================================

/**
 * Truncates a file tree string to fit within a token budget.
 * Preserves the structure by cutting at line boundaries and appending a suffix.
 *
 * @param fileTree - The file tree string to truncate
 * @param options - Truncation options including max tokens
 * @returns Truncated tree and metadata
 */
export function truncateFileTree(
  fileTree: string,
  options: TruncateTreeOptions
): { tokenCount: number; truncatedTree: string; wasTruncated: boolean } {
  const { charsPerToken = DEFAULT_CHARS_PER_TOKEN, maxTokens, truncationSuffix = DEFAULT_TRUNCATION_SUFFIX } = options;

  const currentTokens = countFileTreeTokens(fileTree, { charsPerToken });

  // If already within budget, return as-is
  if (currentTokens <= maxTokens) {
    return {
      tokenCount: currentTokens,
      truncatedTree: fileTree,
      wasTruncated: false,
    };
  }

  // Calculate target character count (accounting for suffix)
  const suffixTokens = countFileTreeTokens(truncationSuffix, { charsPerToken });
  const targetTokens = maxTokens - suffixTokens;
  const targetChars = targetTokens * charsPerToken;

  // Split into lines and accumulate until we exceed the target
  const lines = fileTree.split('\n');
  const resultLines: Array<string> = [];
  let charCount = 0;

  for (const line of lines) {
    const lineLength = line.length + 1; // +1 for newline
    if (charCount + lineLength > targetChars) {
      break;
    }
    resultLines.push(line);
    charCount += lineLength;
  }

  const truncatedTree = resultLines.join('\n') + truncationSuffix;
  const finalTokens = countFileTreeTokens(truncatedTree, { charsPerToken });

  return {
    tokenCount: finalTokens,
    truncatedTree,
    wasTruncated: true,
  };
}

/**
 * Builds a formatted tree string from a list of file paths.
 *
 * @param filePaths - Array of relative file paths
 * @param rootName - Name of the root directory
 * @returns Formatted tree string and directory count
 */
function buildTreeFromPaths(filePaths: Array<string>, rootName: string): { directories: number; fileTree: string } {
  // Build tree structure
  const root: TreeNode = {
    children: new Map(),
    isFile: false,
    name: rootName,
  };

  // Insert all paths into the tree
  for (const filePath of filePaths) {
    const parts = filePath.split(/[/\\]/);
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;

      const isLastPart = i === parts.length - 1;

      if (!current.children.has(part)) {
        current.children.set(part, {
          children: new Map(),
          isFile: isLastPart,
          name: part,
        });
      }

      current = current.children.get(part)!;
    }
  }

  // Count directories and render tree to ASCII
  let directoryCount = 0;
  const lines: Array<string> = [];

  // Add root directory
  lines.push(rootName + '/');

  // Render children
  function renderNode(node: TreeNode, prefix: string): void {
    // Sort children: directories first, then files, alphabetically within each group
    const sortedChildren = Array.from(node.children.values()).sort((a, b) => {
      if (!a.isFile && b.isFile) return -1;
      if (a.isFile && !b.isFile) return 1;
      return a.name.localeCompare(b.name);
    });

    for (let i = 0; i < sortedChildren.length; i++) {
      const child = sortedChildren[i];
      if (!child) continue;

      const isLast = i === sortedChildren.length - 1;
      const connector = isLast ? '\u2514\u2500\u2500 ' : '\u251C\u2500\u2500 ';
      const childPrefix = isLast ? prefix + '    ' : prefix + '\u2502   ';

      const displayName = child.isFile ? child.name : child.name + '/';
      lines.push(prefix + connector + displayName);

      if (!child.isFile) {
        directoryCount++;
        renderNode(child, childPrefix);
      }
    }
  }

  renderNode(root, '');

  return {
    directories: directoryCount,
    fileTree: lines.join('\n'),
  };
}
