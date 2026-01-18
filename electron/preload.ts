import { contextBridge, ipcRenderer } from 'electron';

import type { FeatureRequest, NewFeatureRequest } from '../db/schema/feature-requests.schema';
import type { NewProject, Project } from '../db/schema/projects.schema';
import type { NewRepository, Repository } from '../db/schema/repositories.schema';
import type { ApiKeyInfo, ApiKeyProvider, SetApiKeyInput } from './ipc/api-keys.handlers';

import { IpcChannels } from './ipc/channels';

export interface ElectronAPI {
  apiKeys: {
    delete(provider: ApiKeyProvider): Promise<{ error?: string; success: boolean }>;
    get(provider: ApiKeyProvider): Promise<{ error?: string; key?: string; source?: 'environment' | 'user' }>;
    getAll(): Promise<Array<ApiKeyInfo>>;
    isEncryptionAvailable(): Promise<boolean>;
    set(input: SetApiKeyInput): Promise<{ error?: string; success: boolean }>;
    test(provider: ApiKeyProvider, apiKey?: string): Promise<{ error?: string; success: boolean }>;
  };
  app: {
    getPath(name: 'appData' | 'desktop' | 'documents' | 'downloads' | 'home' | 'temp' | 'userData'): Promise<string>;
    getVersion(): Promise<string>;
  };
  db: {
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
      update(id: number, data: Partial<NewProject>): Promise<Project | undefined>;
    };
    repositories: {
      create(data: NewRepository): Promise<Repository>;
      delete(id: number): Promise<boolean>;
      getById(id: number): Promise<Repository | undefined>;
      getByProjectId(projectId: number): Promise<Array<Repository>>;
      update(id: number, data: Partial<NewRepository>): Promise<Repository | undefined>;
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
  apiKeys: {
    delete: (provider) => ipcRenderer.invoke(IpcChannels.apiKeys.delete, provider),
    get: (provider) => ipcRenderer.invoke(IpcChannels.apiKeys.get, provider),
    getAll: () => ipcRenderer.invoke(IpcChannels.apiKeys.getAll),
    isEncryptionAvailable: () => ipcRenderer.invoke(IpcChannels.apiKeys.isEncryptionAvailable),
    set: (input) => ipcRenderer.invoke(IpcChannels.apiKeys.set, input),
    test: (provider, apiKey) => ipcRenderer.invoke(IpcChannels.apiKeys.test, provider, apiKey),
  },
  app: {
    getPath: (name) => ipcRenderer.invoke(IpcChannels.app.getPath, name),
    getVersion: () => ipcRenderer.invoke(IpcChannels.app.getVersion),
  },
  db: {
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
      update: (id, data) => ipcRenderer.invoke(IpcChannels.db.projects.update, id, data),
    },
    repositories: {
      create: (data) => ipcRenderer.invoke(IpcChannels.db.repositories.create, data),
      delete: (id) => ipcRenderer.invoke(IpcChannels.db.repositories.delete, id),
      getById: (id) => ipcRenderer.invoke(IpcChannels.db.repositories.getById, id),
      getByProjectId: (projectId) => ipcRenderer.invoke(IpcChannels.db.repositories.getByProjectId, projectId),
      update: (id, data) => ipcRenderer.invoke(IpcChannels.db.repositories.update, id, data),
    },
  },
  dialog: {
    openDirectory: () => ipcRenderer.invoke(IpcChannels.dialog.openDirectory),
    openFile: (filters) => ipcRenderer.invoke(IpcChannels.dialog.openFile, filters),
    saveFile: (defaultPath, filters) => ipcRenderer.invoke(IpcChannels.dialog.saveFile, defaultPath, filters),
  },
  fs: {
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
