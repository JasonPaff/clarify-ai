import dirTree, { type DirectoryTree } from 'directory-tree';
import * as fs from 'fs/promises';
import ignore, { type Ignore } from 'ignore';
import linguist from 'linguist-js';
import * as path from 'path';

/** Default directories to ignore when no .gitignore exists */
const DEFAULT_IGNORES = [
  // Build outputs
  'dist',
  'build',
  'out',
  '.next',
  '.nuxt',
  '.output',
  // Dependencies
  'node_modules',
  'vendor',
  // Version control
  '.git',
  '.hg',
  '.svn',
  // IDE/Editor
  '.idea',
  '.vscode',
  // Cache/temp
  '.cache',
  '.turbo',
  'coverage',
  '.nyc_output',
  // Python
  '__pycache__',
  '.venv',
  'venv',
  'env',
  // Deployment
  '.netlify',
  '.vercel',
];

/** Languages to exclude from primary language stats (non-code files) */
const EXCLUDED_LANGUAGES = new Set(['JSON', 'Markdown', 'Plain Text', 'Text', 'YAML']);

export interface ScanOptions {
  /** Maximum depth for file tree traversal. Default: 4 */
  maxDepth?: number;
  /** Whether to respect .gitignore. Default: true */
  respectGitignore?: boolean;
}

export interface ScanResult {
  /** ASCII representation of the file tree */
  fileTree: string;
  /** Map of language name to file count */
  languageStats: Record<string, number>;
  /** Top languages sorted by usage */
  primaryLanguages: Array<string>;
  /** Total number of directories found */
  totalDirectories: number;
  /** Total number of files found */
  totalFiles: number;
}

/**
 * Scans a repository and returns file tree, language stats, and other metadata.
 * Uses .gitignore rules when available, falls back to sensible defaults.
 */
export async function scanRepository(repoPath: string, options: ScanOptions = {}): Promise<ScanResult> {
  const { maxDepth = 4, respectGitignore = true } = options;

  // Load gitignore rules
  const ig = respectGitignore ? await loadGitignore(repoPath) : ignore().add(DEFAULT_IGNORES);

  // Build file tree using directory-tree
  const tree = dirTree(repoPath, {
    attributes: ['type'],
    depth: maxDepth,
    // Quick regex excludes for performance - these are always ignored
    exclude: /node_modules|\.git/,
  });

  // Filter tree through gitignore and count stats
  const stats = { directories: 0, files: 0 };
  const filteredTree = tree ? filterTreeWithIgnore(tree, ig, repoPath, stats) : null;

  // Render tree to ASCII
  const fileTree = filteredTree
    ? renderTreeToAscii(filteredTree, path.basename(repoPath))
    : path.basename(repoPath) + '/';

  // Detect languages using linguist-js
  const languageResult = await detectLanguages(repoPath);

  return {
    fileTree,
    languageStats: languageResult.stats,
    primaryLanguages: languageResult.primary,
    totalDirectories: stats.directories,
    totalFiles: stats.files,
  };
}

/**
 * Detects programming languages in a repository using linguist-js.
 * Uses quick mode for performance.
 */
async function detectLanguages(repoPath: string): Promise<{
  primary: Array<string>;
  stats: Record<string, number>;
}> {
  try {
    // Use quick mode for performance - samples files instead of full scan
    const result = await linguist(repoPath, {
      quick: true,
    });

    // Count files per language from file results
    const fileCountByLanguage = new Map<string, number>();
    for (const lang of Object.values(result.files.results)) {
      if (lang && !EXCLUDED_LANGUAGES.has(lang)) {
        fileCountByLanguage.set(lang, (fileCountByLanguage.get(lang) ?? 0) + 1);
      }
    }

    // Get language results and filter out non-code languages
    const languageResults = result.languages.results;
    const sorted = Object.entries(languageResults)
      .filter(([lang]) => !EXCLUDED_LANGUAGES.has(lang))
      .sort((a, b) => b[1].bytes - a[1].bytes)
      .slice(0, 5);

    return {
      primary: sorted.map(([lang]) => lang),
      stats: Object.fromEntries(sorted.map(([lang]) => [lang, fileCountByLanguage.get(lang) ?? 0])),
    };
  } catch {
    // Fallback if linguist fails (e.g., empty repo, permission issues)
    return { primary: [], stats: {} };
  }
}

/**
 * Filters a directory tree based on ignore rules.
 * Returns null if the entire tree should be ignored.
 */
function filterTreeWithIgnore(
  tree: DirectoryTree,
  ig: Ignore,
  rootPath: string,
  stats: { directories: number; files: number }
): DirectoryTree | null {
  // Get relative path from root for gitignore matching
  const relativePath = path.relative(rootPath, tree.path);

  // Check if this path should be ignored (skip root check)
  if (relativePath && ig.ignores(relativePath)) {
    return null;
  }

  // Skip hidden files/directories (starting with .)
  if (tree.name.startsWith('.') && relativePath) {
    return null;
  }

  if (tree.type === 'directory') {
    stats.directories++;

    // Filter children
    const filteredChildren = (tree.children ?? [])
      .map((child) => filterTreeWithIgnore(child, ig, rootPath, stats))
      .filter((child): child is DirectoryTree => child !== null)
      .sort((a, b) => {
        // Directories first, then alphabetically
        const aIsDir = a.type === 'directory';
        const bIsDir = b.type === 'directory';
        if (aIsDir && !bIsDir) return -1;
        if (!aIsDir && bIsDir) return 1;
        return a.name.localeCompare(b.name);
      });

    return {
      ...tree,
      children: filteredChildren,
    };
  }

  // It's a file
  stats.files++;
  return tree;
}

/**
 * Loads .gitignore from the repository root.
 * Falls back to default ignores if no .gitignore exists.
 */
async function loadGitignore(repoPath: string): Promise<Ignore> {
  const ig = ignore();

  // Always ignore .git directory
  ig.add(['.git']);

  try {
    const gitignoreContent = await fs.readFile(path.join(repoPath, '.gitignore'), 'utf8');
    ig.add(gitignoreContent);
  } catch {
    // No .gitignore - fall back to sensible defaults
    ig.add(DEFAULT_IGNORES);
  }

  return ig;
}

/**
 * Renders a directory tree to ASCII format.
 */
function renderTreeToAscii(tree: DirectoryTree, rootName: string): string {
  const lines: Array<string> = [];

  // Add root directory name
  lines.push(rootName + '/');

  // Render children
  function renderChildren(children: Array<DirectoryTree>, prefix: string): void {
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (!child) continue;

      const isLast = i === children.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      const newPrefix = isLast ? prefix + '    ' : prefix + '│   ';

      const name = child.type === 'directory' ? child.name + '/' : child.name;
      lines.push(prefix + connector + name);

      if (child.type === 'directory' && child.children) {
        renderChildren(child.children, newPrefix);
      }
    }
  }

  if (tree.children) {
    renderChildren(tree.children, '');
  }

  return lines.join('\n');
}
