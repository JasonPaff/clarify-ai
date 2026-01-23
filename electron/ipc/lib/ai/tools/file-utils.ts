import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// Constants
// ============================================================================

/** Maximum file size to read (5MB) */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Chunk size for reading large files */
export const CHUNK_SIZE = 64 * 1024;

/** Default patterns to exclude from search */
export const DEFAULT_EXCLUDE_PATTERNS = [
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

/** Binary file extensions to skip for content operations */
const BINARY_EXTENSIONS = new Set([
  '.7z',
  '.avi',
  '.bmp',
  '.db',
  '.dll',
  '.dylib',
  '.eot',
  '.exe',
  '.gif',
  '.gz',
  '.ico',
  '.jpeg',
  '.jpg',
  '.mov',
  '.mp3',
  '.mp4',
  '.otf',
  '.pdf',
  '.png',
  '.rar',
  '.so',
  '.sqlite',
  '.sqlite3',
  '.svg',
  '.tar',
  '.ttf',
  '.webm',
  '.webp',
  '.woff',
  '.woff2',
  '.zip',
]);

/** Extension to language name mapping */
const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  '.c': 'c',
  '.cpp': 'cpp',
  '.cs': 'csharp',
  '.css': 'css',
  '.go': 'go',
  '.h': 'c',
  '.hpp': 'cpp',
  '.html': 'html',
  '.java': 'java',
  '.js': 'javascript',
  '.json': 'json',
  '.jsx': 'javascriptreact',
  '.kt': 'kotlin',
  '.less': 'less',
  '.md': 'markdown',
  '.mjs': 'javascript',
  '.py': 'python',
  '.rb': 'ruby',
  '.rs': 'rust',
  '.sass': 'sass',
  '.scss': 'scss',
  '.swift': 'swift',
  '.ts': 'typescript',
  '.tsx': 'typescriptreact',
  '.vue': 'vue',
  '.yaml': 'yaml',
  '.yml': 'yaml',
};

// ============================================================================
// Path Validation
// ============================================================================

/** A match found in file content */
export interface ContentMatch {
  /** The matched content */
  content: string;
  /** Context lines around the match */
  context?: string;
  /** Path to the file */
  filePath: string;
  /** Line number (1-indexed) */
  lineNumber: number;
}

/** A related file found through import analysis */
export interface RelatedFile {
  /** The import statement that connects the files */
  importStatement?: string;
  /** Path to the related file */
  path: string;
}

// ============================================================================
// File Detection
// ============================================================================

/**
 * Detect programming language from file extension
 */
export function detectLanguage(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return EXTENSION_TO_LANGUAGE[ext] ?? 'plaintext';
}

/**
 * Escape special regex characters for plain text search
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================================================
// File Reading
// ============================================================================

/**
 * Extract matches with context from file content
 */
export function extractMatches(
  content: string,
  pattern: RegExp | string,
  contextLines: number,
  filePath: string
): { matchCount: number; matches: Array<ContentMatch> } {
  const lines = content.split('\n');
  const matches: Array<ContentMatch> = [];
  let matchCount = 0;

  // Track which lines have already been included in matches
  const includedLines = new Set<number>();

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    if (line === undefined) continue;

    // Check for matches in this line
    const regex =
      typeof pattern === 'string' ? new RegExp(escapeRegex(pattern), 'gi') : new RegExp(pattern.source, 'gi');

    const lineMatches = [...line.matchAll(regex)];
    if (lineMatches.length === 0) continue;

    matchCount += lineMatches.length;

    // Skip if this line is already part of another match's context
    if (includedLines.has(lineIndex)) continue;

    // Calculate context range
    const startLine = Math.max(0, lineIndex - contextLines);
    const endLine = Math.min(lines.length - 1, lineIndex + contextLines);

    // Build context content
    const contextContent: Array<string> = [];
    for (let i = startLine; i <= endLine; i++) {
      const contextLine = lines[i];
      if (contextLine !== undefined) {
        contextContent.push(contextLine);
        includedLines.add(i);
      }
    }

    matches.push({
      content: line,
      context: contextContent.join('\n'),
      filePath,
      lineNumber: lineIndex + 1, // 1-indexed
    });
  }

  return { matchCount, matches };
}

// ============================================================================
// Content Search
// ============================================================================

/**
 * Check if a file is likely binary based on extension
 */
export function isBinaryFile(filePath: string): boolean {
  return BINARY_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

/**
 * Validate that a resolved file path is within the allowed repository root.
 * This prevents path traversal attacks where normalized paths escape the repository.
 */
export function isPathWithinRoot(filePath: string, rootPath: string): boolean {
  const resolvedFile = path.resolve(filePath);
  const resolvedRoot = path.resolve(rootPath);

  // Ensure the file path starts with the root path
  // Use path.sep to ensure we're checking at directory boundaries
  const normalizedFile = resolvedFile.toLowerCase();
  const normalizedRoot = resolvedRoot.toLowerCase();

  // The file path must start with the root path followed by a separator (or be exactly the root)
  return normalizedFile === normalizedRoot || normalizedFile.startsWith(normalizedRoot + path.sep);
}

/**
 * Check if an import path is a relative path
 */
export function isRelativeImport(importPath: string): boolean {
  return importPath.startsWith('./') || importPath.startsWith('../');
}

// ============================================================================
// Import/Export Analysis
// ============================================================================

/**
 * Path validation to prevent directory traversal attacks.
 * Validates that a path is an absolute path and doesn't contain traversal segments.
 */
export function isValidPath(filePath: string): boolean {
  if (!path.isAbsolute(filePath)) {
    return false;
  }
  const normalizedPath = path.normalize(filePath);
  return !normalizedPath.includes('..');
}

/**
 * Parse imports from file content
 * Returns array of import paths (not resolved to actual files)
 */
export function parseImports(content: string): Array<{ importPath: string; statement: string }> {
  const imports: Array<{ importPath: string; statement: string }> = [];

  // ES6 imports: import X from 'path' or import 'path'
  const es6ImportRegex = /import\s+(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"]+)['"]/g;
  let match: null | RegExpExecArray;

  while ((match = es6ImportRegex.exec(content)) !== null) {
    if (match[1]) {
      imports.push({
        importPath: match[1],
        statement: match[0],
      });
    }
  }

  // require(): require('path')
  const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  while ((match = requireRegex.exec(content)) !== null) {
    if (match[1]) {
      imports.push({
        importPath: match[1],
        statement: match[0],
      });
    }
  }

  // Dynamic imports: import('path')
  const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  while ((match = dynamicImportRegex.exec(content)) !== null) {
    if (match[1]) {
      imports.push({
        importPath: match[1],
        statement: match[0],
      });
    }
  }

  return imports;
}

/**
 * Read file content safely, handling large files
 * Returns null if file can't be read or is too large
 */
export async function readFileContent(filePath: string): Promise<null | string> {
  try {
    const stats = await fs.stat(filePath);

    // Skip files that are too large
    if (stats.size > MAX_FILE_SIZE) {
      return null;
    }

    // For smaller files, read all at once
    if (stats.size <= CHUNK_SIZE) {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    }

    // For larger files, read in chunks
    const handle = await fs.open(filePath, 'r');
    try {
      const buffer = Buffer.alloc(Math.min(stats.size, MAX_FILE_SIZE));
      await handle.read(buffer, 0, buffer.length, 0);
      return buffer.toString('utf-8');
    } finally {
      await handle.close();
    }
  } catch {
    // File read error (permissions, encoding, etc.)
    return null;
  }
}

/**
 * Resolve a relative import path to an absolute path
 * Returns null if the import is not relative
 */
export function resolveRelativeImport(importPath: string, fromFile: string, repoRoot: string): null | string {
  if (!isRelativeImport(importPath)) {
    return null;
  }

  const fromDir = path.dirname(fromFile);
  const resolved = path.resolve(repoRoot, fromDir, importPath);

  // Normalize and return relative to repo root
  const relative = path.relative(repoRoot, resolved);
  return relative;
}
