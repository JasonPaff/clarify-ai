import type { BrowserWindow, IpcMainInvokeEvent } from 'electron';

import { ipcMain, safeStorage } from 'electron';
import Store from 'electron-store';
import * as fs from 'fs/promises';
import * as path from 'path';

import { IpcChannels } from './channels';

/** Request payload for generating repository overview */
export interface RepositoryOverviewGenerateRequest {
  customPrompt?: string;
  modelId: string; // Format: "provider:modelId"
  repositoryId: number;
  repositoryPath: string;
}

/** Stream chunk sent to renderer during overview generation */
export interface RepositoryOverviewStreamChunk {
  content?: string;
  type: 'error' | 'finish' | 'text';
}

/** API key provider identifiers */
type ApiKeyProvider = 'anthropic' | 'google' | 'openai';

/** Environment variable names for each provider */
const PROVIDER_ENV_VARS: Record<ApiKeyProvider, string> = {
  anthropic: 'ANTHROPIC_API_KEY',
  google: 'GOOGLE_GENERATIVE_AI_KEY',
  openai: 'OPENAI_API_KEY',
};

/** Store namespace for API keys */
const API_KEYS_NAMESPACE = 'apiKeys';

interface StoredApiKeyData {
  encrypted: string;
}

interface StoreType {
  get(key: string): unknown;
}

const store = new Store() as unknown as StoreType;

// Active abort controller for cancellation
let activeAbortController: AbortController | null = null;

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

// Repository data types (duplicated here to avoid import issues)
type DetectedFramework = 'angular' | 'next' | 'node' | 'react' | 'unknown' | 'vue';

interface FileTreeResult {
  languageCounts: Map<string, number>;
  totalDirectories: number;
  totalFiles: number;
  tree: string;
}

interface RepositoryData {
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

export function registerAiOverviewHandlers(getMainWindow: () => BrowserWindow | null): void {
  // Generate repository overview with streaming
  ipcMain.handle(
    IpcChannels.ai.repositoryOverview.generate,
    async (
      _event: IpcMainInvokeEvent,
      request: RepositoryOverviewGenerateRequest
    ): Promise<{ error?: string; success: boolean }> => {
      const mainWindow = getMainWindow();
      if (!mainWindow) {
        return { error: 'Main window not available', success: false };
      }

      const { customPrompt, modelId, repositoryPath } = request;

      // Parse the model ID to get provider and model
      const { modelId: model, provider } = parseModelId(modelId);

      // Get the API key for the provider
      const apiKey = getApiKey(provider);
      if (!apiKey) {
        return { error: `No API key configured for ${provider}`, success: false };
      }

      try {
        // Collect repository data
        const repoData = await collectRepositoryData(repositoryPath);
        if (!repoData) {
          return { error: 'Failed to collect repository data', success: false };
        }

        // Create abort controller for cancellation
        activeAbortController = new AbortController();

        // Dynamic imports for AI SDK
        const { streamText } = await import('ai');
        const { buildRepositoryOverviewPrompt } = await import('../../lib/ai/prompts/repository-overview');

        // Create the provider instance
        const providerInstance = await createProvider(provider, apiKey);

        // Build the prompt
        const prompt = buildRepositoryOverviewPrompt(repoData, customPrompt);

        // Stream the response
        const result = streamText({
          abortSignal: activeAbortController.signal,
          model: providerInstance.model(model) as Parameters<typeof streamText>[0]['model'],
          prompt,
        });

        // Process the stream and send chunks to renderer
        for await (const part of result.fullStream) {
          if (activeAbortController?.signal.aborted) {
            break;
          }

          let chunk: RepositoryOverviewStreamChunk;

          switch (part.type) {
            case 'error':
              chunk = {
                content: String(part.error),
                type: 'error',
              };
              break;

            case 'finish':
              chunk = {
                type: 'finish',
              };
              break;

            case 'text-delta':
              chunk = {
                content: part.text,
                type: 'text',
              };
              break;

            default:
              // Skip other event types (step-start, step-finish, etc.)
              continue;
          }

          mainWindow.webContents.send(IpcChannels.ai.repositoryOverview.stream, chunk);
        }

        // Clean up
        activeAbortController = null;

        return { success: true };
      } catch (error) {
        activeAbortController = null;

        // Check if it was an abort error
        if (error instanceof Error && error.name === 'AbortError') {
          return { error: 'Generation cancelled', success: false };
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error during overview generation';

        // Send error chunk to renderer
        mainWindow.webContents.send(IpcChannels.ai.repositoryOverview.stream, {
          content: errorMessage,
          type: 'error',
        } satisfies RepositoryOverviewStreamChunk);

        return { error: errorMessage, success: false };
      }
    }
  );

  // Cancel ongoing overview generation
  ipcMain.handle(IpcChannels.ai.repositoryOverview.cancel, async (): Promise<void> => {
    if (activeAbortController) {
      activeAbortController.abort();
      activeAbortController = null;
    }
  });
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

/**
 * Collects repository data for AI overview generation.
 * This is a local implementation to avoid cross-file dependency issues.
 */
async function collectRepositoryData(repositoryPath: string): Promise<null | RepositoryData> {
  try {
    // Verify directory exists
    const stats = await fs.stat(repositoryPath);
    if (!stats.isDirectory()) {
      return null;
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

    return {
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
  } catch {
    return null;
  }
}

/**
 * Creates an AI provider instance based on the provider type
 */
async function createProvider(
  provider: ApiKeyProvider,
  apiKey: string
): Promise<{
  model: (modelId: string) => unknown;
}> {
  switch (provider) {
    case 'anthropic': {
      const { createAnthropic } = await import('@ai-sdk/anthropic');
      const anthropic = createAnthropic({ apiKey });
      return { model: (modelId: string) => anthropic(modelId) };
    }
    case 'google': {
      const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
      const google = createGoogleGenerativeAI({ apiKey });
      return { model: (modelId: string) => google(modelId) };
    }
    case 'openai': {
      const { createOpenAI } = await import('@ai-sdk/openai');
      const openai = createOpenAI({ apiKey });
      return { model: (modelId: string) => openai(modelId) };
    }
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Decrypts a stored API key
 */
function decryptStoredKey(encrypted: string): null | string {
  if (!safeStorage.isEncryptionAvailable()) {
    return null;
  }
  try {
    const buffer = Buffer.from(encrypted, 'base64');
    return safeStorage.decryptString(buffer);
  } catch {
    return null;
  }
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

// ============================================================================
// File tree and config file collection helpers (local copies)
// ============================================================================

/**
 * Gets the API key for a provider (user-stored or environment)
 */
function getApiKey(provider: ApiKeyProvider): null | string {
  // Check for user-stored key first
  const storedData = getStoredKeyData(provider);
  if (storedData) {
    const decryptedKey = decryptStoredKey(storedData.encrypted);
    if (decryptedKey) {
      return decryptedKey;
    }
  }

  // Fall back to environment variable
  return getEnvApiKey(provider) ?? null;
}

/**
 * Gets the environment variable value for a provider
 */
function getEnvApiKey(provider: ApiKeyProvider): string | undefined {
  const envVar = PROVIDER_ENV_VARS[provider];
  return process.env[envVar];
}

// Get primary languages sorted by file count
function getPrimaryLanguages(languageCounts: Map<string, number>): Array<string> {
  const entries = Array.from(languageCounts.entries());
  entries.sort((a, b) => b[1] - a[1]);

  // Return top 5 languages
  return entries.slice(0, 5).map(([lang]) => lang);
}

/**
 * Retrieves stored API key data for a provider
 */
function getStoredKeyData(provider: ApiKeyProvider): StoredApiKeyData | undefined {
  const storeKey = getStoreKey(provider);
  return store.get(storeKey) as StoredApiKeyData | undefined;
}

/**
 * Gets the store key for a provider's API key
 */
function getStoreKey(provider: ApiKeyProvider): string {
  return `${API_KEYS_NAMESPACE}.${provider}`;
}

/**
 * Parses a full model ID into provider and model
 */
function parseModelId(fullModelId: string): { modelId: string; provider: ApiKeyProvider } {
  const [provider, ...rest] = fullModelId.split(':');
  return {
    modelId: rest.join(':'),
    provider: provider as ApiKeyProvider,
  };
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
