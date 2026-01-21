import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';

import { IpcChannels } from './channels';
import { scanRepository } from './lib/repository-scanner';

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

interface ConfigFiles {
  envExample?: string;
  packageJson?: string;
  readmeFile?: string;
  tsConfig?: string;
}

/**
 * Collects repository data for AI overview generation.
 * Exported for use by ai-overview.handlers.ts
 */
export async function collectRepositoryData(repositoryPath: string): Promise<null | RepositoryData> {
  try {
    // Verify directory exists
    const stats = await fs.stat(repositoryPath);
    if (!stats.isDirectory()) {
      return null;
    }

    // Collect all data in parallel where possible
    const [scanResult, configFiles] = await Promise.all([
      scanRepository(repositoryPath, { maxDepth: 4 }),
      readConfigFiles(repositoryPath),
    ]);

    // Detect framework from package.json
    const framework = detectFramework(configFiles.packageJson);
    const hasTailwind = detectTailwind(configFiles.packageJson);
    const hasTypeScript = configFiles.tsConfig !== undefined;

    return {
      envExample: configFiles.envExample,
      fileTree: scanResult.fileTree,
      framework,
      hasTailwind,
      hasTypeScript,
      name: path.basename(repositoryPath),
      packageJson: configFiles.packageJson,
      path: repositoryPath,
      primaryLanguages: scanResult.primaryLanguages,
      readmeFile: configFiles.readmeFile,
      totalDirectories: scanResult.totalDirectories,
      totalFiles: scanResult.totalFiles,
      tsConfig: configFiles.tsConfig,
    };
  } catch {
    return null;
  }
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

  ipcMain.handle(
    IpcChannels.fs.mkdir,
    async (_event: IpcMainInvokeEvent, dirPath: string): Promise<{ error?: string; success: boolean }> => {
      if (!isValidPath(dirPath)) {
        return { error: 'Invalid directory path', success: false };
      }
      try {
        await fs.mkdir(dirPath, { recursive: true });
        return { success: true };
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
        const data = await collectRepositoryData(repositoryPath);
        if (!data) {
          return { error: 'Failed to collect repository data', success: false };
        }
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
