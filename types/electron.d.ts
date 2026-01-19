// Re-export database types for renderer use
export type { FeatureRequest, NewFeatureRequest } from '../db/schema/feature-requests.schema';
export type { NewProject, Project } from '../db/schema/projects.schema';
export type { NewRepository, Repository } from '../db/schema/repositories.schema';
export type { NewRepositoryOverview, RepositoryOverview } from '../db/schema/repository-overviews.schema';

// Re-export AI clarification types for renderer use
export type { ClarificationGenerateRequest, ClarificationStreamChunk } from '../electron/ipc/ai-clarification.handlers';

// Re-export AI overview types for renderer use
export type {
  RepositoryOverviewGenerateRequest,
  RepositoryOverviewStreamChunk,
} from '../electron/ipc/ai-overview.handlers';

// Re-export API key types for renderer use
export type { ApiKeyInfo, ApiKeyProvider, ApiKeySource, SetApiKeyInput } from '../electron/ipc/api-keys.handlers';

// Re-export file system types for renderer use
export type { CollectRepositoryDataResult, DetectedFramework, RepositoryData } from '../electron/ipc/fs.handlers';

export interface ElectronAPI {
  ai: {
    clarification: {
      cancel(): Promise<void>;
      generate(
        request: import('../electron/ipc/ai-clarification.handlers').ClarificationGenerateRequest
      ): Promise<{ error?: string; success: boolean }>;
      onStream(
        callback: (chunk: import('../electron/ipc/ai-clarification.handlers').ClarificationStreamChunk) => void
      ): () => void;
    };
    repositoryOverview: {
      cancel(): Promise<void>;
      generate(
        request: import('../electron/ipc/ai-overview.handlers').RepositoryOverviewGenerateRequest
      ): Promise<{ error?: string; success: boolean }>;
      onStream(
        callback: (chunk: import('../electron/ipc/ai-overview.handlers').RepositoryOverviewStreamChunk) => void
      ): () => void;
    };
  };
  apiKeys: {
    delete(
      provider: import('../electron/ipc/api-keys.handlers').ApiKeyProvider
    ): Promise<{ error?: string; success: boolean }>;
    get(
      provider: import('../electron/ipc/api-keys.handlers').ApiKeyProvider
    ): Promise<{ error?: string; key?: string; source?: 'environment' | 'user' }>;
    getAll(): Promise<Array<import('../electron/ipc/api-keys.handlers').ApiKeyInfo>>;
    isEncryptionAvailable(): Promise<boolean>;
    set(
      input: import('../electron/ipc/api-keys.handlers').SetApiKeyInput
    ): Promise<{ error?: string; success: boolean }>;
    test(
      provider: import('../electron/ipc/api-keys.handlers').ApiKeyProvider,
      apiKey?: string
    ): Promise<{ error?: string; success: boolean }>;
  };
  app: {
    getPath(name: 'appData' | 'desktop' | 'documents' | 'downloads' | 'home' | 'temp' | 'userData'): Promise<string>;
    getVersion(): Promise<string>;
  };
  db: {
    featureRequests: {
      create(
        data: import('../db/schema/feature-requests.schema').NewFeatureRequest
      ): Promise<import('../db/schema/feature-requests.schema').FeatureRequest>;
      delete(id: number): Promise<boolean>;
      getById(id: number): Promise<import('../db/schema/feature-requests.schema').FeatureRequest | undefined>;
      getByProjectId(projectId: number): Promise<Array<import('../db/schema/feature-requests.schema').FeatureRequest>>;
      update(
        id: number,
        data: Partial<import('../db/schema/feature-requests.schema').NewFeatureRequest>
      ): Promise<import('../db/schema/feature-requests.schema').FeatureRequest | undefined>;
    };
    projects: {
      create(
        data: import('../db/schema/projects.schema').NewProject
      ): Promise<import('../db/schema/projects.schema').Project>;
      delete(id: number): Promise<boolean>;
      getAll(): Promise<Array<import('../db/schema/projects.schema').Project>>;
      getById(id: number): Promise<import('../db/schema/projects.schema').Project | undefined>;
      getFavorited(): Promise<Array<import('../db/schema/projects.schema').Project>>;
      update(
        id: number,
        data: Partial<import('../db/schema/projects.schema').NewProject>
      ): Promise<import('../db/schema/projects.schema').Project | undefined>;
    };
    repositories: {
      create(
        data: import('../db/schema/repositories.schema').NewRepository
      ): Promise<import('../db/schema/repositories.schema').Repository>;
      delete(id: number): Promise<boolean>;
      getById(id: number): Promise<import('../db/schema/repositories.schema').Repository | undefined>;
      getByProjectId(projectId: number): Promise<Array<import('../db/schema/repositories.schema').Repository>>;
      update(
        id: number,
        data: Partial<import('../db/schema/repositories.schema').NewRepository>
      ): Promise<import('../db/schema/repositories.schema').Repository | undefined>;
    };
    repositoryOverviews: {
      create(
        data: import('../db/schema/repository-overviews.schema').NewRepositoryOverview
      ): Promise<import('../db/schema/repository-overviews.schema').RepositoryOverview>;
      delete(id: number): Promise<boolean>;
      deleteByRepositoryId(repositoryId: number): Promise<boolean>;
      getByRepositoryId(
        repositoryId: number
      ): Promise<import('../db/schema/repository-overviews.schema').RepositoryOverview | null>;
      update(
        id: number,
        data: Partial<import('../db/schema/repository-overviews.schema').NewRepositoryOverview>
      ): Promise<import('../db/schema/repository-overviews.schema').RepositoryOverview | null>;
      upsert(
        repositoryId: number,
        data: Omit<import('../db/schema/repository-overviews.schema').NewRepositoryOverview, 'repositoryId'>
      ): Promise<import('../db/schema/repository-overviews.schema').RepositoryOverview>;
    };
  };
  dialog: {
    openDirectory(): Promise<null | string>;
    openFile(filters?: Array<{ extensions: Array<string>; name: string }>): Promise<null | string>;
    saveFile(
      defaultPath?: string,
      filters?: Array<{ extensions: Array<string>; name: string }>
    ): Promise<null | string>;
  };
  fs: {
    collectRepositoryData(
      repositoryPath: string
    ): Promise<import('../electron/ipc/fs.handlers').CollectRepositoryDataResult>;
    exists(path: string): Promise<boolean>;
    readDirectory(path: string): Promise<{
      entries?: Array<{ isDirectory: boolean; isFile: boolean; name: string }>;
      error?: string;
      success: boolean;
    }>;
    readFile(path: string): Promise<{ content?: string; error?: string; success: boolean }>;
    stat(path: string): Promise<{
      error?: string;
      stats?: {
        ctime: string;
        isDirectory: boolean;
        isFile: boolean;
        mtime: string;
        size: number;
      };
      success: boolean;
    }>;
    writeFile(path: string, content: string): Promise<{ error?: string; success: boolean }>;
  };
  store: {
    delete(key: string): Promise<boolean>;
    get<T>(key: string): Promise<T | undefined>;
    set(key: string, value: unknown): Promise<boolean>;
  };
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
