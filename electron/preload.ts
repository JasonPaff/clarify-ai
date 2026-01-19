import { contextBridge, ipcRenderer } from 'electron';

import type { FeatureRequest, NewFeatureRequest } from '@/db/schema/feature-requests.schema';
import type { NewProject, Project } from '@/db/schema/projects.schema';
import type { NewRepository, Repository } from '@/db/schema/repositories.schema';
import type { NewRepositoryOverview, RepositoryOverview } from '@/db/schema/repository-overviews.schema';

import type { ClarificationGenerateRequest, ClarificationStreamChunk } from './ipc/ai-clarification.handlers';
import type { RepositoryOverviewGenerateRequest, RepositoryOverviewStreamChunk } from './ipc/ai-overview.handlers';
import type { ApiKeyInfo, SetApiKeyInput } from './ipc/api-keys.handlers';
import type { CollectRepositoryDataResult } from './ipc/fs.handlers';
import type { ApiKeyProvider, ProviderCredentials } from './ipc/lib/provider-types';

import { IpcChannels } from './ipc/channels';

export interface ElectronAPI {
  ai: {
    clarification: {
      cancel(): Promise<void>;
      generate(request: ClarificationGenerateRequest): Promise<{ error?: string; success: boolean }>;
      onStream(callback: (chunk: ClarificationStreamChunk) => void): () => void;
    };
    repositoryOverview: {
      cancel(): Promise<void>;
      generate(request: RepositoryOverviewGenerateRequest): Promise<{ error?: string; success: boolean }>;
      onStream(callback: (chunk: RepositoryOverviewStreamChunk) => void): () => void;
    };
  };
  apiKeys: {
    delete(provider: ApiKeyProvider): Promise<{ error?: string; success: boolean }>;
    get(provider: ApiKeyProvider): Promise<{
      credentials?: ProviderCredentials;
      error?: string;
      key?: string;
      source?: 'environment' | 'user';
    }>;
    getAll(): Promise<Array<ApiKeyInfo>>;
    isEncryptionAvailable(): Promise<boolean>;
    set(input: SetApiKeyInput): Promise<{ error?: string; success: boolean }>;
    test(provider: ApiKeyProvider, credentials?: ProviderCredentials): Promise<{ error?: string; success: boolean }>;
  };
  app: {
    getPath(name: 'appData' | 'desktop' | 'documents' | 'downloads' | 'home' | 'temp' | 'userData'): Promise<string>;
    getVersion(): Promise<string>;
  };
  db: {
    featureRequestRepositories: {
      addToFeatureRequest(featureRequestId: number, repositoryId: number): Promise<boolean>;
      getByFeatureRequestId(featureRequestId: number): Promise<Array<number>>;
      removeFromFeatureRequest(featureRequestId: number, repositoryId: number): Promise<boolean>;
      setForFeatureRequest(featureRequestId: number, repositoryIds: Array<number>): Promise<void>;
    };
    featureRequests: {
      create(data: NewFeatureRequest): Promise<FeatureRequest>;
      delete(id: number): Promise<boolean>;
      getById(id: number): Promise<FeatureRequest | undefined>;
      getByProjectId(projectId: number): Promise<Array<FeatureRequest>>;
      update(id: number, data: Partial<NewFeatureRequest>): Promise<FeatureRequest | undefined>;
    };
    projects: {
      create(data: NewProject): Promise<Project>;
      delete(id: number): Promise<boolean>;
      getAll(): Promise<Array<Project>>;
      getById(id: number): Promise<Project | undefined>;
      getFavorited(): Promise<Array<Project>>;
      update(id: number, data: Partial<NewProject>): Promise<Project | undefined>;
    };
    repositories: {
      create(data: NewRepository): Promise<Repository>;
      delete(id: number): Promise<boolean>;
      getById(id: number): Promise<Repository | undefined>;
      getByProjectId(projectId: number): Promise<Array<Repository>>;
      update(id: number, data: Partial<NewRepository>): Promise<Repository | undefined>;
    };
    repositoryOverviews: {
      create(data: NewRepositoryOverview): Promise<RepositoryOverview>;
      delete(id: number): Promise<boolean>;
      deleteByRepositoryId(repositoryId: number): Promise<boolean>;
      getByRepositoryId(repositoryId: number): Promise<RepositoryOverview | undefined>;
      update(id: number, data: Partial<NewRepositoryOverview>): Promise<RepositoryOverview | undefined>;
      upsert(repositoryId: number, data: Omit<NewRepositoryOverview, 'repositoryId'>): Promise<RepositoryOverview>;
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
    collectRepositoryData(repositoryPath: string): Promise<CollectRepositoryDataResult>;
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

const electronAPI: ElectronAPI = {
  ai: {
    clarification: {
      cancel: () => ipcRenderer.invoke(IpcChannels.ai.clarification.cancel),
      generate: (request) => ipcRenderer.invoke(IpcChannels.ai.clarification.generate, request),
      onStream: (callback) => {
        const handler = (_event: Electron.IpcRendererEvent, chunk: ClarificationStreamChunk) => {
          callback(chunk);
        };
        ipcRenderer.on(IpcChannels.ai.clarification.stream, handler);
        // Return unsubscribe function
        return () => {
          ipcRenderer.removeListener(IpcChannels.ai.clarification.stream, handler);
        };
      },
    },
    repositoryOverview: {
      cancel: () => ipcRenderer.invoke(IpcChannels.ai.repositoryOverview.cancel),
      generate: (request) => ipcRenderer.invoke(IpcChannels.ai.repositoryOverview.generate, request),
      onStream: (callback) => {
        const handler = (_event: Electron.IpcRendererEvent, chunk: RepositoryOverviewStreamChunk) => {
          callback(chunk);
        };
        ipcRenderer.on(IpcChannels.ai.repositoryOverview.stream, handler);
        // Return unsubscribe function
        return () => {
          ipcRenderer.removeListener(IpcChannels.ai.repositoryOverview.stream, handler);
        };
      },
    },
  },
  apiKeys: {
    delete: (provider) => ipcRenderer.invoke(IpcChannels.apiKeys.delete, provider),
    get: (provider) => ipcRenderer.invoke(IpcChannels.apiKeys.get, provider),
    getAll: () => ipcRenderer.invoke(IpcChannels.apiKeys.getAll),
    isEncryptionAvailable: () => ipcRenderer.invoke(IpcChannels.apiKeys.isEncryptionAvailable),
    set: (input) => ipcRenderer.invoke(IpcChannels.apiKeys.set, input),
    test: (provider, credentials) => ipcRenderer.invoke(IpcChannels.apiKeys.test, provider, credentials),
  },
  app: {
    getPath: (name) => ipcRenderer.invoke(IpcChannels.app.getPath, name),
    getVersion: () => ipcRenderer.invoke(IpcChannels.app.getVersion),
  },
  db: {
    featureRequestRepositories: {
      addToFeatureRequest: (featureRequestId, repositoryId) =>
        ipcRenderer.invoke(
          IpcChannels.db.featureRequestRepositories.addToFeatureRequest,
          featureRequestId,
          repositoryId
        ),
      getByFeatureRequestId: (featureRequestId) =>
        ipcRenderer.invoke(IpcChannels.db.featureRequestRepositories.getByFeatureRequestId, featureRequestId),
      removeFromFeatureRequest: (featureRequestId, repositoryId) =>
        ipcRenderer.invoke(
          IpcChannels.db.featureRequestRepositories.removeFromFeatureRequest,
          featureRequestId,
          repositoryId
        ),
      setForFeatureRequest: (featureRequestId, repositoryIds) =>
        ipcRenderer.invoke(
          IpcChannels.db.featureRequestRepositories.setForFeatureRequest,
          featureRequestId,
          repositoryIds
        ),
    },
    featureRequests: {
      create: (data) => ipcRenderer.invoke(IpcChannels.db.featureRequests.create, data),
      delete: (id) => ipcRenderer.invoke(IpcChannels.db.featureRequests.delete, id),
      getById: (id) => ipcRenderer.invoke(IpcChannels.db.featureRequests.getById, id),
      getByProjectId: (projectId) => ipcRenderer.invoke(IpcChannels.db.featureRequests.getByProjectId, projectId),
      update: (id, data) => ipcRenderer.invoke(IpcChannels.db.featureRequests.update, id, data),
    },
    projects: {
      create: (data) => ipcRenderer.invoke(IpcChannels.db.projects.create, data),
      delete: (id) => ipcRenderer.invoke(IpcChannels.db.projects.delete, id),
      getAll: () => ipcRenderer.invoke(IpcChannels.db.projects.getAll),
      getById: (id) => ipcRenderer.invoke(IpcChannels.db.projects.getById, id),
      getFavorited: () => ipcRenderer.invoke(IpcChannels.db.projects.getFavorited),
      update: (id, data) => ipcRenderer.invoke(IpcChannels.db.projects.update, id, data),
    },
    repositories: {
      create: (data) => ipcRenderer.invoke(IpcChannels.db.repositories.create, data),
      delete: (id) => ipcRenderer.invoke(IpcChannels.db.repositories.delete, id),
      getById: (id) => ipcRenderer.invoke(IpcChannels.db.repositories.getById, id),
      getByProjectId: (projectId) => ipcRenderer.invoke(IpcChannels.db.repositories.getByProjectId, projectId),
      update: (id, data) => ipcRenderer.invoke(IpcChannels.db.repositories.update, id, data),
    },
    repositoryOverviews: {
      create: (data) => ipcRenderer.invoke(IpcChannels.db.repositoryOverviews.create, data),
      delete: (id) => ipcRenderer.invoke(IpcChannels.db.repositoryOverviews.delete, id),
      deleteByRepositoryId: (repositoryId) =>
        ipcRenderer.invoke(IpcChannels.db.repositoryOverviews.deleteByRepositoryId, repositoryId),
      getByRepositoryId: (repositoryId) =>
        ipcRenderer.invoke(IpcChannels.db.repositoryOverviews.getByRepositoryId, repositoryId),
      update: (id, data) => ipcRenderer.invoke(IpcChannels.db.repositoryOverviews.update, id, data),
      upsert: (repositoryId, data) => ipcRenderer.invoke(IpcChannels.db.repositoryOverviews.upsert, repositoryId, data),
    },
  },
  dialog: {
    openDirectory: () => ipcRenderer.invoke(IpcChannels.dialog.openDirectory),
    openFile: (filters) => ipcRenderer.invoke(IpcChannels.dialog.openFile, filters),
    saveFile: (defaultPath, filters) => ipcRenderer.invoke(IpcChannels.dialog.saveFile, defaultPath, filters),
  },
  fs: {
    collectRepositoryData: (repositoryPath) => ipcRenderer.invoke(IpcChannels.fs.collectRepositoryData, repositoryPath),
    exists: (path) => ipcRenderer.invoke(IpcChannels.fs.exists, path),
    readDirectory: (path) => ipcRenderer.invoke(IpcChannels.fs.readDirectory, path),
    readFile: (path) => ipcRenderer.invoke(IpcChannels.fs.readFile, path),
    stat: (path) => ipcRenderer.invoke(IpcChannels.fs.stat, path),
    writeFile: (path, content) => ipcRenderer.invoke(IpcChannels.fs.writeFile, path, content),
  },
  store: {
    delete: (key) => ipcRenderer.invoke(IpcChannels.store.delete, key),
    get: <T>(key: string) => ipcRenderer.invoke(IpcChannels.store.get, key) as Promise<T | undefined>,
    set: (key, value) => ipcRenderer.invoke(IpcChannels.store.set, key, value),
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
