import { contextBridge, ipcRenderer } from 'electron';

import type {
  ContextFileType,
  FeatureRequestContextFile,
  NewFeatureRequestContextFile,
} from '@/db/schema/feature-request-context-files.schema';
import type {
  FeatureRequestRun,
  FeatureRequestRunStatus,
  FeatureRequestRunStep,
  NewFeatureRequestRun,
} from '@/db/schema/feature-request-runs.schema';
import type { FeatureRequest, NewFeatureRequest } from '@/db/schema/feature-requests.schema';
import type { NewProject, Project } from '@/db/schema/projects.schema';
import type { NewRepository, Repository } from '@/db/schema/repositories.schema';
import type { NewRepositoryOverview, RepositoryOverview } from '@/db/schema/repository-overviews.schema';
import type {
  NewStepConfiguration,
  StepConfiguration,
  StepConfigurationStep,
} from '@/db/schema/step-configurations.schema';

import type { ClarificationGenerateRequest, ClarificationStreamChunk } from './ipc/ai-clarification.handlers';
import type { RepositoryOverviewGenerateRequest, RepositoryOverviewStreamChunk } from './ipc/ai-overview.handlers';
import type { ApiKeyInfo, SetApiKeyInput } from './ipc/api-keys.handlers';
import type { CollectRepositoryDataResult } from './ipc/fs.handlers';
import type { ApiKeyProvider, ProviderCredentials } from './ipc/lib/provider-types';
import type { OpenRouterModel, StoredOpenRouterModels } from './ipc/openrouter-models.handlers';

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
    toggleDisabled(provider: ApiKeyProvider): Promise<{ error?: string; success: boolean }>;
  };
  app: {
    getPath(name: 'appData' | 'desktop' | 'documents' | 'downloads' | 'home' | 'temp' | 'userData'): Promise<string>;
    getVersion(): Promise<string>;
  };
  db: {
    featureRequestContextFiles: {
      bulkCreate(data: Array<NewFeatureRequestContextFile>): Promise<Array<FeatureRequestContextFile>>;
      create(data: NewFeatureRequestContextFile): Promise<FeatureRequestContextFile>;
      delete(id: number): Promise<boolean>;
      getByFeatureRequestId(featureRequestId: number): Promise<Array<FeatureRequestContextFile>>;
      getByFeatureRequestIdAndType(
        featureRequestId: number,
        fileType: ContextFileType
      ): Promise<Array<FeatureRequestContextFile>>;
      getById(id: number): Promise<FeatureRequestContextFile | undefined>;
      setIncludedInContext(id: number, includedInContext: boolean): Promise<FeatureRequestContextFile | undefined>;
      update(id: number, data: Partial<NewFeatureRequestContextFile>): Promise<FeatureRequestContextFile | undefined>;
    };
    featureRequestRepositories: {
      addToFeatureRequest(featureRequestId: number, repositoryId: number): Promise<boolean>;
      getByFeatureRequestId(featureRequestId: number): Promise<Array<number>>;
      removeFromFeatureRequest(featureRequestId: number, repositoryId: number): Promise<boolean>;
      setForFeatureRequest(featureRequestId: number, repositoryIds: Array<number>): Promise<void>;
    };
    featureRequestRuns: {
      create(data: NewFeatureRequestRun): Promise<FeatureRequestRun>;
      delete(id: number): Promise<boolean>;
      getByFeatureRequestId(featureRequestId: number): Promise<Array<FeatureRequestRun>>;
      getByFeatureRequestIdAndStatus(
        featureRequestId: number,
        status: FeatureRequestRunStatus
      ): Promise<Array<FeatureRequestRun>>;
      getByFeatureRequestIdAndStep(
        featureRequestId: number,
        step: FeatureRequestRunStep
      ): Promise<Array<FeatureRequestRun>>;
      getById(id: number): Promise<FeatureRequestRun | undefined>;
      getLatestByFeatureRequestId(featureRequestId: number): Promise<FeatureRequestRun | undefined>;
      getLatestByFeatureRequestIdAndStep(
        featureRequestId: number,
        step: FeatureRequestRunStep
      ): Promise<FeatureRequestRun | undefined>;
      update(id: number, data: Partial<NewFeatureRequestRun>): Promise<FeatureRequestRun | undefined>;
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
    stepConfigurations: {
      create(data: NewStepConfiguration): Promise<StepConfiguration>;
      delete(id: number): Promise<boolean>;
      getByFeatureRequestId(featureRequestId: number): Promise<Array<StepConfiguration>>;
      getByFeatureRequestIdAndStep(
        featureRequestId: number,
        step: StepConfigurationStep
      ): Promise<StepConfiguration | undefined>;
      getById(id: number): Promise<StepConfiguration | undefined>;
      update(id: number, data: Partial<NewStepConfiguration>): Promise<StepConfiguration | undefined>;
      upsert(
        featureRequestId: number,
        step: StepConfigurationStep,
        data: Omit<NewStepConfiguration, 'featureRequestId' | 'step'>
      ): Promise<StepConfiguration>;
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
  electron: {
    importRepositoryOverview(
      repositoryId: number,
      content: string
    ): Promise<{ error?: string; overview?: RepositoryOverview; success: boolean }>;
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
  openRouterModels: {
    clear(): Promise<boolean>;
    fetch(): Promise<{ error?: string; models?: Array<OpenRouterModel>; success: boolean }>;
    get(): Promise<null | StoredOpenRouterModels>;
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
    toggleDisabled: (provider) => ipcRenderer.invoke(IpcChannels.apiKeys.toggleDisabled, provider),
  },
  app: {
    getPath: (name) => ipcRenderer.invoke(IpcChannels.app.getPath, name),
    getVersion: () => ipcRenderer.invoke(IpcChannels.app.getVersion),
  },
  db: {
    featureRequestContextFiles: {
      bulkCreate: (data) => ipcRenderer.invoke(IpcChannels.db.featureRequestContextFiles.bulkCreate, data),
      create: (data) => ipcRenderer.invoke(IpcChannels.db.featureRequestContextFiles.create, data),
      delete: (id) => ipcRenderer.invoke(IpcChannels.db.featureRequestContextFiles.delete, id),
      getByFeatureRequestId: (featureRequestId) =>
        ipcRenderer.invoke(IpcChannels.db.featureRequestContextFiles.getByFeatureRequestId, featureRequestId),
      getByFeatureRequestIdAndType: (featureRequestId, fileType) =>
        ipcRenderer.invoke(
          IpcChannels.db.featureRequestContextFiles.getByFeatureRequestIdAndType,
          featureRequestId,
          fileType
        ),
      getById: (id) => ipcRenderer.invoke(IpcChannels.db.featureRequestContextFiles.getById, id),
      setIncludedInContext: (id, includedInContext) =>
        ipcRenderer.invoke(IpcChannels.db.featureRequestContextFiles.setIncludedInContext, id, includedInContext),
      update: (id, data) => ipcRenderer.invoke(IpcChannels.db.featureRequestContextFiles.update, id, data),
    },
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
    featureRequestRuns: {
      create: (data) => ipcRenderer.invoke(IpcChannels.db.featureRequestRuns.create, data),
      delete: (id) => ipcRenderer.invoke(IpcChannels.db.featureRequestRuns.delete, id),
      getByFeatureRequestId: (featureRequestId) =>
        ipcRenderer.invoke(IpcChannels.db.featureRequestRuns.getByFeatureRequestId, featureRequestId),
      getByFeatureRequestIdAndStatus: (featureRequestId, status) =>
        ipcRenderer.invoke(IpcChannels.db.featureRequestRuns.getByFeatureRequestIdAndStatus, featureRequestId, status),
      getByFeatureRequestIdAndStep: (featureRequestId, step) =>
        ipcRenderer.invoke(IpcChannels.db.featureRequestRuns.getByFeatureRequestIdAndStep, featureRequestId, step),
      getById: (id) => ipcRenderer.invoke(IpcChannels.db.featureRequestRuns.getById, id),
      getLatestByFeatureRequestId: (featureRequestId) =>
        ipcRenderer.invoke(IpcChannels.db.featureRequestRuns.getLatestByFeatureRequestId, featureRequestId),
      getLatestByFeatureRequestIdAndStep: (featureRequestId, step) =>
        ipcRenderer.invoke(
          IpcChannels.db.featureRequestRuns.getLatestByFeatureRequestIdAndStep,
          featureRequestId,
          step
        ),
      update: (id, data) => ipcRenderer.invoke(IpcChannels.db.featureRequestRuns.update, id, data),
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
    stepConfigurations: {
      create: (data) => ipcRenderer.invoke(IpcChannels.db.stepConfigurations.create, data),
      delete: (id) => ipcRenderer.invoke(IpcChannels.db.stepConfigurations.delete, id),
      getByFeatureRequestId: (featureRequestId) =>
        ipcRenderer.invoke(IpcChannels.db.stepConfigurations.getByFeatureRequestId, featureRequestId),
      getByFeatureRequestIdAndStep: (featureRequestId, step) =>
        ipcRenderer.invoke(IpcChannels.db.stepConfigurations.getByFeatureRequestIdAndStep, featureRequestId, step),
      getById: (id) => ipcRenderer.invoke(IpcChannels.db.stepConfigurations.getById, id),
      update: (id, data) => ipcRenderer.invoke(IpcChannels.db.stepConfigurations.update, id, data),
      upsert: (featureRequestId, step, data) =>
        ipcRenderer.invoke(IpcChannels.db.stepConfigurations.upsert, featureRequestId, step, data),
    },
  },
  dialog: {
    openDirectory: () => ipcRenderer.invoke(IpcChannels.dialog.openDirectory),
    openFile: (filters) => ipcRenderer.invoke(IpcChannels.dialog.openFile, filters),
    saveFile: (defaultPath, filters) => ipcRenderer.invoke(IpcChannels.dialog.saveFile, defaultPath, filters),
  },
  electron: {
    importRepositoryOverview: (repositoryId, content) =>
      ipcRenderer.invoke(IpcChannels.electron.importRepositoryOverview, repositoryId, content),
  },
  fs: {
    collectRepositoryData: (repositoryPath) => ipcRenderer.invoke(IpcChannels.fs.collectRepositoryData, repositoryPath),
    exists: (path) => ipcRenderer.invoke(IpcChannels.fs.exists, path),
    readDirectory: (path) => ipcRenderer.invoke(IpcChannels.fs.readDirectory, path),
    readFile: (path) => ipcRenderer.invoke(IpcChannels.fs.readFile, path),
    stat: (path) => ipcRenderer.invoke(IpcChannels.fs.stat, path),
    writeFile: (path, content) => ipcRenderer.invoke(IpcChannels.fs.writeFile, path, content),
  },
  openRouterModels: {
    clear: () => ipcRenderer.invoke(IpcChannels.openRouterModels.clear),
    fetch: () => ipcRenderer.invoke(IpcChannels.openRouterModels.fetch),
    get: () => ipcRenderer.invoke(IpcChannels.openRouterModels.get),
  },
  store: {
    delete: (key) => ipcRenderer.invoke(IpcChannels.store.delete, key),
    get: <T>(key: string) => ipcRenderer.invoke(IpcChannels.store.get, key) as Promise<T | undefined>,
    set: (key, value) => ipcRenderer.invoke(IpcChannels.store.set, key, value),
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
