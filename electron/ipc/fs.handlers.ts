import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';

import { IpcChannels } from './channels';

export interface CollectRepositoryDataResult {
  data?: RepositoryData;
  error?: string;
  success: boolean;
}

// Repository data types
export type DetectedFramework = 'angular' | 'next' | 'node' | 'react' | 'unknown' | 'vue';

export interface RepositoryData {
  envExample?: string;
  fileTree: string;
  framework: DetectedFramework;
  hasTailwind: boolean;
  hasTypeScript: boolean;
  name: string;
  packageJson?: string;
  path: string;
  primaryLanguages: Array<string>;
  readmeFile?: string;
  totalDirectories: number;
  totalFiles: number;
  tsConfig?: string;
}

// Common directories to ignore when building file tree
const IGNORED_DIRECTORIES = new Set([
  '.cache',
  '.env',
  '.git',
  '.hg',
  '.idea',
  '.netlify',
  '.next',
  '.nuxt',
  '.nyc_output',
  '.output',
  '.svn',
  '.turbo',
  '.venv',
  '.vercel',
  '.vscode',
  '__pycache__',
  'build',
  'coverage',
  'dist',
  'env',
  'node_modules',
  'out',
  'target',
  'vendor',
  'venv',
]);

// Language extensions mapping
const LANGUAGE_EXTENSIONS: Record<string, string> = {
  '.astro': 'Astro',
  '.c': 'C',
  '.cpp': 'C++',
  '.cs': 'C#',
  '.css': 'CSS',
  '.go': 'Go',
  '.h': 'C',
  '.hpp': 'C++',
  '.html': 'HTML',
  '.java': 'Java',
  '.js': 'JavaScript',
  '.json': 'JSON',
  '.jsx': 'JavaScript',
  '.kt': 'Kotlin',
  '.lua': 'Lua',
  '.md': 'Markdown',
  '.mjs': 'JavaScript',
  '.php': 'PHP',
  '.py': 'Python',
  '.rb': 'Ruby',
  '.rs': 'Rust',
  '.scss': 'SCSS',
  '.sql': 'SQL',
  '.svelte': 'Svelte',
  '.swift': 'Swift',
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.vue': 'Vue',
  '.yaml': 'YAML',
  '.yml': 'YAML',
};

interface ConfigFiles {
  envExample?: string;
  packageJson?: string;
  readmeFile?: string;
  tsConfig?: string;
}

// Helper interfaces for file tree building
interface FileTreeResult {
  languageCounts: Map<string, number>;
  totalDirectories: number;
  totalFiles: number;
  tree: string;
}

export function registerFsHandlers(): void {
  ipcMain.handle(
    IpcChannels.fs.readFile,
    async (
      _event: IpcMainInvokeEvent,
      filePath: string
    ): Promise<{ content?: string; error?: string; success: boolean }> => {
      if (!isValidPath(filePath)) {
        return { error: 'Invalid file path', success: false };
      }
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        return { content, success: true };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false,
        };
      }
    }
  );

  ipcMain.handle(
    IpcChannels.fs.writeFile,
    async (
      _event: IpcMainInvokeEvent,
      filePath: string,
      content: string
    ): Promise<{ error?: string; success: boolean }> => {
      if (!isValidPath(filePath)) {
        return { error: 'Invalid file path', success: false };
      }
      try {
        await fs.writeFile(filePath, content, 'utf-8');
        return { success: true };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false,
        };
      }
    }
  );

  ipcMain.handle(
    IpcChannels.fs.readDirectory,
    async (
      _event: IpcMainInvokeEvent,
      dirPath: string
    ): Promise<{
      entries?: Array<{ isDirectory: boolean; isFile: boolean; name: string }>;
      error?: string;
      success: boolean;
    }> => {
      if (!isValidPath(dirPath)) {
        return { error: 'Invalid directory path', success: false };
      }
      try {
        const dirents = await fs.readdir(dirPath, { withFileTypes: true });
        const entries = dirents.map((dirent) => ({
          isDirectory: dirent.isDirectory(),
          isFile: dirent.isFile(),
          name: dirent.name,
        }));
        return { entries, success: true };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false,
        };
      }
    }
  );

  ipcMain.handle(IpcChannels.fs.exists, async (_event: IpcMainInvokeEvent, filePath: string): Promise<boolean> => {
    if (!isValidPath(filePath)) {
      return false;
    }
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle(
    IpcChannels.fs.stat,
    async (
      _event: IpcMainInvokeEvent,
      filePath: string
    ): Promise<{
      error?: string;
      stats?: {
        ctime: string;
        isDirectory: boolean;
        isFile: boolean;
        mtime: string;
        size: number;
      };
      success: boolean;
    }> => {
      if (!isValidPath(filePath)) {
        return { error: 'Invalid file path', success: false };
      }
      try {
        const stats = await fs.stat(filePath);
        return {
          stats: {
            ctime: stats.ctime.toISOString(),
            isDirectory: stats.isDirectory(),
            isFile: stats.isFile(),
            mtime: stats.mtime.toISOString(),
            size: stats.size,
          },
          success: true,
        };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false,
        };
      }
    }
  );

  // Collect repository data for AI overview generation
  ipcMain.handle(
    IpcChannels.fs.collectRepositoryData,
    async (_event: IpcMainInvokeEvent, repositoryPath: string): Promise<CollectRepositoryDataResult> => {
      if (!isValidPath(repositoryPath)) {
        return { error: 'Invalid repository path', success: false };
      }

      try {
        // Verify directory exists
        const stats = await fs.stat(repositoryPath);
        if (!stats.isDirectory()) {
          return { error: 'Path is not a directory', success: false };
        }

        // Collect all data in parallel where possible
        const [fileTreeResult, configFiles] = await Promise.all([
          buildFileTree(repositoryPath, 4),
          readConfigFiles(repositoryPath),
        ]);

        // Detect framework from package.json
        const framework = detectFramework(configFiles.packageJson);
        const hasTailwind = detectTailwind(configFiles.packageJson);
        const hasTypeScript = configFiles.tsConfig !== undefined;

        // Calculate primary languages from file tree stats
        const primaryLanguages = getPrimaryLanguages(fileTreeResult.languageCounts);

        const data: RepositoryData = {
          envExample: configFiles.envExample,
          fileTree: fileTreeResult.tree,
          framework,
          hasTailwind,
          hasTypeScript,
          name: path.basename(repositoryPath),
          packageJson: configFiles.packageJson,
          path: repositoryPath,
          primaryLanguages,
          readmeFile: configFiles.readmeFile,
          totalDirectories: fileTreeResult.totalDirectories,
          totalFiles: fileTreeResult.totalFiles,
          tsConfig: configFiles.tsConfig,
        };

        return { data, success: true };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false,
        };
      }
    }
  );
}

// Build ASCII file tree with depth limit
async function buildFileTree(rootPath: string, maxDepth: number): Promise<FileTreeResult> {
  const lines: Array<string> = [];
  const languageCounts = new Map<string, number>();
  let totalFiles = 0;
  let totalDirectories = 0;

  async function traverse(dirPath: string, prefix: string, depth: number): Promise<void> {
    if (depth > maxDepth) {
      return;
    }

    let entries: Array<{ isDirectory: boolean; name: string }>;
    try {
      const dirents = await fs.readdir(dirPath, { withFileTypes: true });
      entries = dirents
        .map((d) => ({ isDirectory: d.isDirectory(), name: d.name }))
        .filter((e) => !IGNORED_DIRECTORIES.has(e.name) && !e.name.startsWith('.'))
        .sort((a, b) => {
          // Directories first, then alphabetically
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.name.localeCompare(b.name);
        });
    } catch {
      return;
    }

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (!entry) continue;

      const isLast = i === entries.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      const newPrefix = isLast ? prefix + '    ' : prefix + '│   ';

      lines.push(prefix + connector + entry.name);

      if (entry.isDirectory) {
        totalDirectories++;
        await traverse(path.join(dirPath, entry.name), newPrefix, depth + 1);
      } else {
        totalFiles++;
        // Track language counts
        const ext = path.extname(entry.name).toLowerCase();
        const language = LANGUAGE_EXTENSIONS[ext];
        if (language) {
          languageCounts.set(language, (languageCounts.get(language) ?? 0) + 1);
        }
      }
    }
  }

  // Add root directory name
  lines.push(path.basename(rootPath) + '/');
  await traverse(rootPath, '', 1);

  return {
    languageCounts,
    totalDirectories,
    totalFiles,
    tree: lines.join('\n'),
  };
}

// Detect framework from package.json content
function detectFramework(packageJsonContent?: string): DetectedFramework {
  if (!packageJsonContent) {
    return 'unknown';
  }

  try {
    const pkg = JSON.parse(packageJsonContent) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    // Order matters - check more specific frameworks first
    if (deps['next']) return 'next';
    if (deps['@angular/core']) return 'angular';
    if (deps['vue'] || deps['nuxt']) return 'vue';
    if (deps['react'] || deps['react-dom']) return 'react';

    // If has package.json but no framework detected, it's a Node project
    return 'node';
  } catch {
    return 'unknown';
  }
}

// Detect if Tailwind CSS is used
function detectTailwind(packageJsonContent?: string): boolean {
  if (!packageJsonContent) {
    return false;
  }

  try {
    const pkg = JSON.parse(packageJsonContent) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    return 'tailwindcss' in deps;
  } catch {
    return false;
  }
}

// Get primary languages sorted by file count
function getPrimaryLanguages(languageCounts: Map<string, number>): Array<string> {
  const entries = Array.from(languageCounts.entries());
  entries.sort((a, b) => b[1] - a[1]);

  // Return top 5 languages
  return entries.slice(0, 5).map(([lang]) => lang);
}

// Path validation to prevent directory traversal attacks
function isValidPath(filePath: string): boolean {
  const normalizedPath = path.normalize(filePath);
  return !normalizedPath.includes('..');
}

// Read common config files
async function readConfigFiles(rootPath: string): Promise<ConfigFiles> {
  const result: ConfigFiles = {};

  // Helper to read file if exists
  async function tryReadFile(filePath: string): Promise<string | undefined> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch {
      return undefined;
    }
  }

  // Read files in parallel
  const [packageJson, tsConfig, jsConfig, readme, readmeLower, envExample] = await Promise.all([
    tryReadFile(path.join(rootPath, 'package.json')),
    tryReadFile(path.join(rootPath, 'tsconfig.json')),
    tryReadFile(path.join(rootPath, 'jsconfig.json')),
    tryReadFile(path.join(rootPath, 'README.md')),
    tryReadFile(path.join(rootPath, 'readme.md')),
    tryReadFile(path.join(rootPath, '.env.example')),
  ]);

  result.packageJson = packageJson;
  result.tsConfig = tsConfig ?? jsConfig;
  result.readmeFile = readme ?? readmeLower;
  result.envExample = envExample;

  return result;
}
