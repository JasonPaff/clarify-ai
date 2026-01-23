import type { BrowserWindow, IpcMainInvokeEvent } from 'electron';

import { ipcMain } from 'electron';
import fg from 'fast-glob';
import * as fs from 'fs/promises';
import * as path from 'path';

import type {
  FileSearchRequest,
  FileSearchResponse,
  FileSearchResult,
  FileSearchSnippet,
  FileType,
  HighlightRange,
  MatchType,
} from '@/lib/validations/file-search';

import { fileSearchRequestSchema, validateRegexPattern } from '@/lib/validations/file-search';

import { IpcChannels } from './channels';

// ============================================================================
// Types
// ============================================================================

/** Progress update sent to renderer during search */
export interface FileSearchProgress {
  currentFile?: string;
  filesProcessed: number;
  matchesFound: number;
  phase: 'complete' | 'content_search' | 'file_discovery';
  totalFiles?: number;
}

/** Repository info for search context */
interface RepositoryInfo {
  id: number;
  name: string;
  path: string;
}

// ============================================================================
// Constants
// ============================================================================

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

/** File extensions by file type category */
const FILE_TYPE_EXTENSIONS: Record<Exclude<FileType, 'all'>, Array<string>> = {
  code: ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'py', 'rb', 'go', 'rs', 'java', 'kt', 'swift', 'c', 'cpp', 'h', 'hpp'],
  config: ['json', 'yaml', 'yml', 'toml', 'ini', 'env', 'env.local', 'env.example', 'eslintrc', 'prettierrc'],
  documentation: ['md', 'mdx', 'txt', 'rst', 'adoc'],
  styles: ['css', 'scss', 'sass', 'less', 'styl'],
  tests: ['test.ts', 'test.tsx', 'test.js', 'test.jsx', 'spec.ts', 'spec.tsx', 'spec.js', 'spec.jsx'],
  types: ['d.ts', 'types.ts'],
};

/** Maximum file size to read (5MB) */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Chunk size for reading large files */
const CHUNK_SIZE = 64 * 1024;

/** Throttle interval for progress updates (ms) */
const PROGRESS_THROTTLE_MS = 100;

// ============================================================================
// Active Search State
// ============================================================================

/** Active abort controller for cancellation */
let activeAbortController: AbortController | null = null;

// ============================================================================
// Utility Functions
// ============================================================================

export function registerFileSearchHandlers(getMainWindow: () => BrowserWindow | null): void {
  // Main search handler
  ipcMain.handle(
    IpcChannels.fileSearch.search,
    async (
      _event: IpcMainInvokeEvent,
      request: FileSearchRequest,
      repositories: Array<RepositoryInfo>
    ): Promise<{ error?: string; response?: FileSearchResponse; success: boolean }> => {
      const mainWindow = getMainWindow();
      if (!mainWindow) {
        return { error: 'Main window not available', success: false };
      }

      // Validate request against schema
      const parseResult = fileSearchRequestSchema.safeParse(request);
      if (!parseResult.success) {
        const errorMessage = parseResult.error.issues.map((issue) => issue.message).join(', ');
        return { error: `Invalid request: ${errorMessage}`, success: false };
      }

      // Validate repositories
      if (!repositories || repositories.length === 0) {
        return { error: 'No repositories provided', success: false };
      }

      // Validate all repository paths
      for (const repo of repositories) {
        if (!isValidPath(repo.path)) {
          return { error: `Invalid repository path: ${repo.path}`, success: false };
        }
      }

      try {
        // Create abort controller for cancellation
        activeAbortController = new AbortController();

        const response = await performSearch(parseResult.data, repositories, mainWindow, activeAbortController.signal);

        // Clean up
        activeAbortController = null;

        return { response, success: true };
      } catch (error) {
        activeAbortController = null;

        // Check if it was an abort error
        if (error instanceof Error && error.name === 'AbortError') {
          return { error: 'Search cancelled', success: false };
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error during file search';
        return { error: errorMessage, success: false };
      }
    }
  );

  // Cancel ongoing search
  ipcMain.handle(IpcChannels.fileSearch.cancel, async (): Promise<void> => {
    if (activeAbortController) {
      activeAbortController.abort();
      activeAbortController = null;
    }
  });
}

/**
 * Build glob patterns from file types
 */
function buildFileTypePatterns(fileTypes: Array<FileType>): { includesDotfiles: boolean; patterns: Array<string> } {
  if (fileTypes.includes('all')) {
    return { includesDotfiles: false, patterns: ['**/*'] };
  }

  const extensions = new Set<string>();
  let includesDotfiles = false;

  for (const fileType of fileTypes) {
    if (fileType !== 'all') {
      const typeExtensions = FILE_TYPE_EXTENSIONS[fileType];
      if (typeExtensions) {
        for (const ext of typeExtensions) {
          extensions.add(ext);
        }
      }
      // Config files include dotfiles like .env, .eslintrc, .prettierrc
      if (fileType === 'config') {
        includesDotfiles = true;
      }
    }
  }

  if (extensions.size === 0) {
    return { includesDotfiles, patterns: ['**/*'] };
  }

  // Build glob patterns for extensions
  const patterns: Array<string> = [];
  for (const ext of extensions) {
    if (ext.includes('.')) {
      // Extensions like 'd.ts' or 'test.ts'
      patterns.push(`**/*.${ext}`);
    } else {
      patterns.push(`**/*.${ext}`);
    }
  }

  return { includesDotfiles, patterns };
}

/**
 * Throttled progress sender
 */
function createProgressSender(mainWindow: BrowserWindow, throttleMs: number) {
  let lastSendTime = 0;
  let pendingProgress: FileSearchProgress | null = null;

  return {
    flush: () => {
      if (pendingProgress) {
        mainWindow.webContents.send(IpcChannels.fileSearch.progress, pendingProgress);
        pendingProgress = null;
      }
    },
    send: (progress: FileSearchProgress) => {
      const now = Date.now();
      if (now - lastSendTime >= throttleMs) {
        mainWindow.webContents.send(IpcChannels.fileSearch.progress, progress);
        lastSendTime = now;
        pendingProgress = null;
      } else {
        pendingProgress = progress;
      }
    },
  };
}

/**
 * Escape special regex characters for plain text search
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract snippets around matches with context
 */
function extractSnippets(
  content: string,
  pattern: RegExp | string,
  snippetDepth: number
): { matchCount: number; snippets: Array<FileSearchSnippet> } {
  const lines = content.split('\n');
  const snippets: Array<FileSearchSnippet> = [];
  let matchCount = 0;

  // Track which lines have already been included in snippets
  const includedLines = new Set<number>();

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    if (line === undefined) continue;

    // Check for matches in this line
    const regex =
      typeof pattern === 'string' ? new RegExp(escapeRegex(pattern), 'gi') : new RegExp(pattern.source, 'gi');

    const matches = [...line.matchAll(regex)];
    if (matches.length === 0) continue;

    matchCount += matches.length;

    // Skip if this line is already part of another snippet
    if (includedLines.has(lineIndex)) continue;

    // Calculate snippet range
    const startLine = Math.max(0, lineIndex - snippetDepth);
    const endLine = Math.min(lines.length - 1, lineIndex + snippetDepth);

    // Build snippet content
    const snippetLines: Array<string> = [];
    for (let i = startLine; i <= endLine; i++) {
      const snippetLine = lines[i];
      if (snippetLine !== undefined) {
        snippetLines.push(snippetLine);
        includedLines.add(i);
      }
    }

    // Calculate highlight ranges for the match line within the snippet
    const highlightRanges: Array<HighlightRange> = [];
    for (const match of matches) {
      if (match.index !== undefined) {
        highlightRanges.push({
          end: match.index + match[0].length,
          start: match.index,
        });
      }
    }

    snippets.push({
      content: snippetLines.join('\n'),
      highlightRanges: highlightRanges.length > 0 ? highlightRanges : undefined,
      lineNumber: startLine + 1, // 1-indexed
    });
  }

  return { matchCount, snippets };
}

/**
 * Generate a contextual snippet for filename-only matches
 * Shows the first few lines of the file to give context
 * @param content - File content
 * @param snippetDepth - Number of lines for context (uses this as max lines shown)
 * @returns A snippet showing the beginning of the file
 */
function generateFilenameSnippet(content: string, snippetDepth: number): FileSearchSnippet {
  const lines = content.split('\n');
  // Show up to (snippetDepth * 2 + 1) lines to be consistent with content snippet sizes
  const maxLines = Math.min(lines.length, snippetDepth * 2 + 1);
  const snippetLines = lines.slice(0, maxLines);

  return {
    content: snippetLines.join('\n'),
    lineNumber: 1,
  };
}

/**
 * Check if a file is likely binary based on extension
 */
function isBinaryFile(filePath: string): boolean {
  const binaryExtensions = new Set([
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
  return binaryExtensions.has(path.extname(filePath).toLowerCase());
}

/**
 * Validate that a resolved file path is within the allowed repository root.
 * This prevents path traversal attacks where normalized paths escape the repository.
 */
function isPathWithinRoot(filePath: string, rootPath: string): boolean {
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
 * Path validation to prevent directory traversal attacks.
 * Validates that a path is an absolute path and doesn't contain traversal segments.
 */
function isValidPath(filePath: string): boolean {
  // Must be an absolute path
  if (!path.isAbsolute(filePath)) {
    return false;
  }
  const normalizedPath = path.normalize(filePath);
  return !normalizedPath.includes('..');
}

/**
 * Check if a filename matches the search query
 * @param filePath - Full path to the file
 * @param query - Search query string
 * @param compiledRegex - Pre-compiled regex for regex mode (avoids recompilation in loops)
 * @returns true if the filename matches the query
 */
function matchesFilename(filePath: string, query: string, compiledRegex?: RegExp): boolean {
  const filename = path.basename(filePath);

  if (compiledRegex) {
    // Use the pre-compiled regex for matching
    return compiledRegex.test(filename);
  }

  // Case-insensitive substring matching for plain text
  return filename.toLowerCase().includes(query.toLowerCase());
}

// ============================================================================
// Main Search Logic
// ============================================================================

/**
 * Perform file search across repositories
 */
async function performSearch(
  request: FileSearchRequest,
  repositories: Array<RepositoryInfo>,
  mainWindow: BrowserWindow,
  abortSignal: AbortSignal
): Promise<FileSearchResponse> {
  const startTime = Date.now();
  const progressSender = createProgressSender(mainWindow, PROGRESS_THROTTLE_MS);

  const {
    excludeGlobs = [],
    fileTypes,
    includeGlobs,
    maxResults = 100,
    query,
    snippetDepth = 2,
    useRegex = false,
  } = request;

  // Validate regex pattern if using regex mode
  if (useRegex) {
    const validation = validateRegexPattern(query);
    if (!validation.isValid) {
      throw new Error(`Invalid regex pattern: ${validation.error}`);
    }
  }

  // Build the search pattern
  const searchPattern = useRegex ? new RegExp(query, 'gi') : query;

  // Pre-compile regex for filename matching (case-insensitive) to avoid recompilation in loop
  const filenameRegex = useRegex ? new RegExp(query, 'i') : undefined;

  // Build include patterns
  const { includesDotfiles, patterns: typePatterns } = fileTypes
    ? buildFileTypePatterns(fileTypes)
    : { includesDotfiles: false, patterns: ['**/*'] };
  const includePatterns = includeGlobs?.length ? includeGlobs : typePatterns;

  // Merge exclude patterns
  const allExcludePatterns = [...DEFAULT_EXCLUDE_PATTERNS, ...excludeGlobs];

  const results: Array<FileSearchResult> = [];
  let totalMatches = 0;
  let filesProcessed = 0;

  // Phase 1: Discover files
  progressSender.send({
    filesProcessed: 0,
    matchesFound: 0,
    phase: 'file_discovery',
  });

  // Collect all files from all repositories
  const allFiles: Array<{ filePath: string; repo: RepositoryInfo }> = [];

  for (const repo of repositories) {
    if (abortSignal.aborted) {
      const abortError = new Error('Search cancelled');
      abortError.name = 'AbortError';
      throw abortError;
    }

    // Validate repository path
    if (!isValidPath(repo.path)) {
      continue;
    }

    try {
      const files = await fg(includePatterns, {
        absolute: true,
        cwd: repo.path,
        dot: includesDotfiles,
        ignore: allExcludePatterns,
        onlyFiles: true,
        suppressErrors: true,
      });

      for (const filePath of files) {
        // Validate that the file is within the repository root (prevents traversal)
        if (!isPathWithinRoot(filePath, repo.path)) {
          continue;
        }
        if (!isBinaryFile(filePath)) {
          allFiles.push({ filePath, repo });
        }
      }
    } catch {
      // Skip repositories that can't be read
      continue;
    }
  }

  const totalFiles = allFiles.length;

  // Phase 2: Search content
  progressSender.send({
    filesProcessed: 0,
    matchesFound: 0,
    phase: 'content_search',
    totalFiles,
  });

  for (const { filePath, repo } of allFiles) {
    if (abortSignal.aborted) {
      const abortError = new Error('Search cancelled');
      abortError.name = 'AbortError';
      throw abortError;
    }
    if (results.length >= maxResults) break;

    filesProcessed++;

    // Send progress update
    progressSender.send({
      currentFile: path.relative(repo.path, filePath),
      filesProcessed,
      matchesFound: totalMatches,
      phase: 'content_search',
      totalFiles,
    });

    // Check if filename matches (uses pre-compiled regex if in regex mode)
    const filenameMatches = matchesFilename(filePath, query, filenameRegex);

    // Read file content
    const content = await readFileContent(filePath);
    if (content === null) {
      // If we can't read content but filename matches, still include the result
      if (filenameMatches) {
        results.push({
          filePath: path.relative(repo.path, filePath),
          matchCount: 0,
          matchType: 'filename',
          repositoryId: repo.id,
          repositoryName: repo.name,
        });
      }
      continue;
    }

    // Search for content matches
    const { matchCount, snippets } = extractSnippets(content, searchPattern, snippetDepth);
    const contentMatches = matchCount > 0;

    // Determine match type and whether to include result
    let matchType: MatchType | null = null;
    if (filenameMatches && contentMatches) {
      matchType = 'both';
    } else if (filenameMatches) {
      matchType = 'filename';
    } else if (contentMatches) {
      matchType = 'content';
    }

    // Only include files that match either by filename or content
    if (matchType !== null) {
      totalMatches += matchCount;

      // For filename-only matches, generate a contextual snippet showing the file beginning
      const resultSnippets =
        matchType === 'filename'
          ? [generateFilenameSnippet(content, snippetDepth)]
          : snippets.length > 0
            ? snippets
            : undefined;

      results.push({
        filePath: path.relative(repo.path, filePath),
        matchCount,
        matchType,
        repositoryId: repo.id,
        repositoryName: repo.name,
        snippets: resultSnippets,
      });
    }
  }

  // Flush any pending progress
  progressSender.flush();

  // Send completion
  progressSender.send({
    filesProcessed,
    matchesFound: totalMatches,
    phase: 'complete',
    totalFiles,
  });

  const searchDuration = Date.now() - startTime;

  return {
    hasMore: results.length >= maxResults,
    results,
    searchDuration,
    totalMatches,
  };
}

// ============================================================================
// Handler Registration
// ============================================================================

/**
 * Read file content safely, handling large files
 */
async function readFileContent(filePath: string): Promise<null | string> {
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
