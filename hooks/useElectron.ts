'use client';

import { useCallback, useMemo } from 'react';

import type {
  ApiKeyInfo,
  ApiKeyProvider,
  CollectRepositoryDataResult,
  ContextFileType,
  ElectronAPI,
  FeatureRequestRunStatus,
  FeatureRequestRunStep,
  FileSearchProgress,
  FileSearchRequest,
  FileSearchResponse,
  OpenRouterModel,
  ProviderCredentials,
  RepositoryOverviewGenerateRequest,
  RepositoryOverviewStreamChunk,
  SetApiKeyInput,
  StepConfigurationStep,
  StoredOpenRouterModels,
} from '@/types/electron';

interface UseElectronResult {
  api: ElectronAPI | null;
  isElectron: boolean;
}

export function useElectron(): UseElectronResult {
  const isElectron = useMemo(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.electronAPI !== undefined;
  }, []);

  const api = useMemo(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    return window.electronAPI ?? null;
  }, []);

  return { api, isElectron };
}

export function useElectronAiOverview() {
  const { api, isElectron } = useElectron();

  const generate = useCallback(
    async (request: RepositoryOverviewGenerateRequest): Promise<{ error?: string; success: boolean }> => {
      if (!api) return { error: 'Not running in Electron', success: false };
      return api.ai.repositoryOverview.generate(request);
    },
    [api]
  );

  const cancel = useCallback(async (): Promise<void> => {
    if (!api) return;
    return api.ai.repositoryOverview.cancel();
  }, [api]);

  const subscribeToStream = useCallback(
    (callback: (chunk: RepositoryOverviewStreamChunk) => void): (() => void) => {
      if (!api) {
        // Return a no-op unsubscribe function
        return function noop() {
          // No cleanup needed when api is not available
        };
      }
      return api.ai.repositoryOverview.onStream(callback);
    },
    [api]
  );

  return {
    cancel,
    generate,
    isElectron,
    subscribeToStream,
  };
}

export function useElectronApiKeys() {
  const { api, isElectron } = useElectron();

  const isEncryptionAvailable = useCallback(async (): Promise<boolean> => {
    if (!api) return false;
    return api.apiKeys.isEncryptionAvailable();
  }, [api]);

  const getAll = useCallback(async (): Promise<Array<ApiKeyInfo>> => {
    if (!api) return [];
    return api.apiKeys.getAll();
  }, [api]);

  const get = useCallback(
    async (provider: ApiKeyProvider): Promise<{ error?: string; key?: string; source?: 'environment' | 'user' }> => {
      if (!api) return { error: 'Not running in Electron' };
      return api.apiKeys.get(provider);
    },
    [api]
  );

  const set = useCallback(
    async (input: SetApiKeyInput): Promise<{ error?: string; success: boolean }> => {
      if (!api) return { error: 'Not running in Electron', success: false };
      return api.apiKeys.set(input);
    },
    [api]
  );

  const deleteKey = useCallback(
    async (provider: ApiKeyProvider): Promise<{ error?: string; success: boolean }> => {
      if (!api) return { error: 'Not running in Electron', success: false };
      return api.apiKeys.delete(provider);
    },
    [api]
  );

  const test = useCallback(
    async (
      provider: ApiKeyProvider,
      credentials?: ProviderCredentials
    ): Promise<{ error?: string; success: boolean }> => {
      if (!api) return { error: 'Not running in Electron', success: false };
      return api.apiKeys.test(provider, credentials);
    },
    [api]
  );

  const toggleDisabled = useCallback(
    async (provider: ApiKeyProvider): Promise<{ error?: string; success: boolean }> => {
      if (!api) return { error: 'Not running in Electron', success: false };
      return api.apiKeys.toggleDisabled(provider);
    },
    [api]
  );

  return {
    deleteKey,
    get,
    getAll,
    isElectron,
    isEncryptionAvailable,
    set,
    test,
    toggleDisabled,
  };
}

export function useElectronApp() {
  const { api, isElectron } = useElectron();

  const getVersion = useCallback(async (): Promise<null | string> => {
    if (!api) return null;
    return api.app.getVersion();
  }, [api]);

  const getPath = useCallback(
    async (
      name: 'appData' | 'desktop' | 'documents' | 'downloads' | 'home' | 'temp' | 'userData'
    ): Promise<null | string> => {
      if (!api) return null;
      return api.app.getPath(name);
    },
    [api]
  );

  return {
    getPath,
    getVersion,
    isElectron,
  };
}

export function useElectronDb() {
  const { api, isElectron } = useElectron();

  const featureRequestRepositories = useMemo(
    () => ({
      addToFeatureRequest: (featureRequestId: number, repositoryId: number) => {
        if (!api) throw new Error('Electron API not available');
        return api.db.featureRequestRepositories.addToFeatureRequest(featureRequestId, repositoryId);
      },
      getByFeatureRequestId: (featureRequestId: number) =>
        api?.db.featureRequestRepositories.getByFeatureRequestId(featureRequestId) ?? Promise.resolve([]),
      removeFromFeatureRequest: (featureRequestId: number, repositoryId: number) => {
        if (!api) throw new Error('Electron API not available');
        return api.db.featureRequestRepositories.removeFromFeatureRequest(featureRequestId, repositoryId);
      },
      setForFeatureRequest: (featureRequestId: number, repositoryIds: Array<number>) => {
        if (!api) throw new Error('Electron API not available');
        return api.db.featureRequestRepositories.setForFeatureRequest(featureRequestId, repositoryIds);
      },
    }),
    [api]
  );

  const featureRequests = useMemo(
    () => ({
      create: (data: Parameters<NonNullable<typeof api>['db']['featureRequests']['create']>[0]) => {
        if (!api) throw new Error('Electron API not available');
        return api.db.featureRequests.create(data);
      },
      delete: (id: number) => {
        if (!api) throw new Error('Electron API not available');
        return api.db.featureRequests.delete(id);
      },
      getById: (id: number) => {
        if (!api) return Promise.resolve(undefined);
        return api.db.featureRequests.getById(id);
      },
      getByProjectId: (projectId: number) => api?.db.featureRequests.getByProjectId(projectId) ?? Promise.resolve([]),
      update: (id: number, data: Parameters<NonNullable<typeof api>['db']['featureRequests']['update']>[1]) => {
        if (!api) throw new Error('Electron API not available');
        return api.db.featureRequests.update(id, data);
      },
    }),
    [api]
  );

  const projects = useMemo(
    () => ({
      create: (data: Parameters<NonNullable<typeof api>['db']['projects']['create']>[0]) => {
        if (!api) throw new Error('Electron API not available');
        return api.db.projects.create(data);
      },
      delete: (id: number) => {
        if (!api) throw new Error('Electron API not available');
        return api.db.projects.delete(id);
      },
      getAll: () => api?.db.projects.getAll() ?? Promise.resolve([]),
      getById: (id: number) => {
        if (!api) return Promise.resolve(undefined);
        return api.db.projects.getById(id);
      },
      getFavorited: () => api?.db.projects.getFavorited() ?? Promise.resolve([]),
      update: (id: number, data: Parameters<NonNullable<typeof api>['db']['projects']['update']>[1]) => {
        if (!api) throw new Error('Electron API not available');
        return api.db.projects.update(id, data);
      },
    }),
    [api]
  );

  const repositories = useMemo(
    () => ({
      create: (data: Parameters<NonNullable<typeof api>['db']['repositories']['create']>[0]) => {
        if (!api) throw new Error('Electron API not available');
        return api.db.repositories.create(data);
      },
      delete: (id: number) => {
        if (!api) throw new Error('Electron API not available');
        return api.db.repositories.delete(id);
      },
      getById: (id: number) => {
        if (!api) return Promise.resolve(undefined);
        return api.db.repositories.getById(id);
      },
      getByProjectId: (projectId: number) => api?.db.repositories.getByProjectId(projectId) ?? Promise.resolve([]),
      update: (id: number, data: Parameters<NonNullable<typeof api>['db']['repositories']['update']>[1]) => {
        if (!api) throw new Error('Electron API not available');
        return api.db.repositories.update(id, data);
      },
    }),
    [api]
  );

  const repositoryOverviews = useMemo(
    () => ({
      create: (data: Parameters<NonNullable<typeof api>['db']['repositoryOverviews']['create']>[0]) => {
        if (!api) throw new Error('Electron API not available');
        return api.db.repositoryOverviews.create(data);
      },
      delete: (id: number) => {
        if (!api) throw new Error('Electron API not available');
        return api.db.repositoryOverviews.delete(id);
      },
      deleteByRepositoryId: (repositoryId: number) => {
        if (!api) throw new Error('Electron API not available');
        return api.db.repositoryOverviews.deleteByRepositoryId(repositoryId);
      },
      getByRepositoryId: (repositoryId: number) => {
        if (!api) return Promise.resolve(null);
        return api.db.repositoryOverviews.getByRepositoryId(repositoryId);
      },
      update: (id: number, data: Parameters<NonNullable<typeof api>['db']['repositoryOverviews']['update']>[1]) => {
        if (!api) throw new Error('Electron API not available');
        return api.db.repositoryOverviews.update(id, data);
      },
      upsert: (
        repositoryId: number,
        data: Parameters<NonNullable<typeof api>['db']['repositoryOverviews']['upsert']>[1]
      ) => {
        if (!api) throw new Error('Electron API not available');
        return api.db.repositoryOverviews.upsert(repositoryId, data);
      },
    }),
    [api]
  );

  const featureRequestRuns = useMemo(
    () => ({
      create: (data: Parameters<NonNullable<typeof api>['db']['featureRequestRuns']['create']>[0]) => {
        if (!api) throw new Error('Electron API not available');
        return api.db.featureRequestRuns.create(data);
      },
      delete: (id: number) => {
        if (!api) throw new Error('Electron API not available');
        return api.db.featureRequestRuns.delete(id);
      },
      getByFeatureRequestId: (featureRequestId: number) =>
        api?.db.featureRequestRuns.getByFeatureRequestId(featureRequestId) ?? Promise.resolve([]),
      getByFeatureRequestIdAndStatus: (featureRequestId: number, status: FeatureRequestRunStatus) =>
        api?.db.featureRequestRuns.getByFeatureRequestIdAndStatus(featureRequestId, status) ?? Promise.resolve([]),
      getByFeatureRequestIdAndStep: (featureRequestId: number, step: FeatureRequestRunStep) =>
        api?.db.featureRequestRuns.getByFeatureRequestIdAndStep(featureRequestId, step) ?? Promise.resolve([]),
      getById: (id: number) => {
        if (!api) return Promise.resolve(undefined);
        return api.db.featureRequestRuns.getById(id);
      },
      getCurrentRun: (featureRequestId: number, step: FeatureRequestRunStep) => {
        if (!api) return Promise.resolve(undefined);
        return api.db.featureRequestRuns.getCurrentRun(featureRequestId, step);
      },
      getLatestByFeatureRequestId: (featureRequestId: number) => {
        if (!api) return Promise.resolve(undefined);
        return api.db.featureRequestRuns.getLatestByFeatureRequestId(featureRequestId);
      },
      getLatestByFeatureRequestIdAndStep: (featureRequestId: number, step: FeatureRequestRunStep) => {
        if (!api) return Promise.resolve(undefined);
        return api.db.featureRequestRuns.getLatestByFeatureRequestIdAndStep(featureRequestId, step);
      },
      setCurrentRun: (featureRequestId: number, step: FeatureRequestRunStep, runId: number) => {
        if (!api) throw new Error('Electron API not available');
        return api.db.featureRequestRuns.setCurrentRun(featureRequestId, step, runId);
      },
      update: (id: number, data: Parameters<NonNullable<typeof api>['db']['featureRequestRuns']['update']>[1]) => {
        if (!api) throw new Error('Electron API not available');
        return api.db.featureRequestRuns.update(id, data);
      },
    }),
    [api]
  );

  const stepConfigurations = useMemo(
    () => ({
      create: (data: Parameters<NonNullable<typeof api>['db']['stepConfigurations']['create']>[0]) => {
        if (!api) throw new Error('Electron API not available');
        return api.db.stepConfigurations.create(data);
      },
      delete: (id: number) => {
        if (!api) throw new Error('Electron API not available');
        return api.db.stepConfigurations.delete(id);
      },
      getById: (id: number) => {
        if (!api) return Promise.resolve(undefined);
        return api.db.stepConfigurations.getById(id);
      },
      getByProjectId: (projectId: number) =>
        api?.db.stepConfigurations.getByProjectId(projectId) ?? Promise.resolve([]),
      getByProjectIdAndStep: (projectId: number, step: StepConfigurationStep) => {
        if (!api) return Promise.resolve(undefined);
        return api.db.stepConfigurations.getByProjectIdAndStep(projectId, step);
      },
      update: (id: number, data: Parameters<NonNullable<typeof api>['db']['stepConfigurations']['update']>[1]) => {
        if (!api) throw new Error('Electron API not available');
        return api.db.stepConfigurations.update(id, data);
      },
      upsert: (
        projectId: number,
        step: StepConfigurationStep,
        data: Parameters<NonNullable<typeof api>['db']['stepConfigurations']['upsert']>[2]
      ) => {
        if (!api) throw new Error('Electron API not available');
        return api.db.stepConfigurations.upsert(projectId, step, data);
      },
    }),
    [api]
  );

  const featureRequestContextFiles = useMemo(
    () => ({
      bulkCreate: (data: Parameters<NonNullable<typeof api>['db']['featureRequestContextFiles']['bulkCreate']>[0]) => {
        if (!api) throw new Error('Electron API not available');
        return api.db.featureRequestContextFiles.bulkCreate(data);
      },
      create: (data: Parameters<NonNullable<typeof api>['db']['featureRequestContextFiles']['create']>[0]) => {
        if (!api) throw new Error('Electron API not available');
        return api.db.featureRequestContextFiles.create(data);
      },
      delete: (id: number) => {
        if (!api) throw new Error('Electron API not available');
        return api.db.featureRequestContextFiles.delete(id);
      },
      getByFeatureRequestId: (featureRequestId: number) =>
        api?.db.featureRequestContextFiles.getByFeatureRequestId(featureRequestId) ?? Promise.resolve([]),
      getByFeatureRequestIdAndType: (featureRequestId: number, fileType: ContextFileType) =>
        api?.db.featureRequestContextFiles.getByFeatureRequestIdAndType(featureRequestId, fileType) ??
        Promise.resolve([]),
      getById: (id: number) => {
        if (!api) return Promise.resolve(undefined);
        return api.db.featureRequestContextFiles.getById(id);
      },
      setIncludedInContext: (id: number, includedInContext: boolean) => {
        if (!api) throw new Error('Electron API not available');
        return api.db.featureRequestContextFiles.setIncludedInContext(id, includedInContext);
      },
      update: (
        id: number,
        data: Parameters<NonNullable<typeof api>['db']['featureRequestContextFiles']['update']>[1]
      ) => {
        if (!api) throw new Error('Electron API not available');
        return api.db.featureRequestContextFiles.update(id, data);
      },
    }),
    [api]
  );

  return {
    featureRequestContextFiles,
    featureRequestRepositories,
    featureRequestRuns,
    featureRequests,
    isElectron,
    projects,
    repositories,
    repositoryOverviews,
    stepConfigurations,
  };
}

export function useElectronDialog() {
  const { api, isElectron } = useElectron();

  const openDirectory = useCallback(async (): Promise<null | string> => {
    if (!api) return null;
    return api.dialog.openDirectory();
  }, [api]);

  const openFile = useCallback(
    async (filters?: Array<{ extensions: Array<string>; name: string }>): Promise<null | string> => {
      if (!api) return null;
      return api.dialog.openFile(filters);
    },
    [api]
  );

  const saveFile = useCallback(
    async (
      defaultPath?: string,
      filters?: Array<{ extensions: Array<string>; name: string }>
    ): Promise<null | string> => {
      if (!api) return null;
      return api.dialog.saveFile(defaultPath, filters);
    },
    [api]
  );

  return {
    isElectron,
    openDirectory,
    openFile,
    saveFile,
  };
}

export function useElectronFileSearch() {
  const { api, isElectron } = useElectron();

  const search = useCallback(
    async (
      request: FileSearchRequest,
      repositories: Array<{ id: number; name: string; path: string }>
    ): Promise<{ error?: string; response?: FileSearchResponse; success: boolean }> => {
      if (!api) return { error: 'Not running in Electron', success: false };
      return api.fileSearch.search(request, repositories);
    },
    [api]
  );

  const cancel = useCallback(async (): Promise<void> => {
    if (!api) return;
    return api.fileSearch.cancel();
  }, [api]);

  const subscribeToProgress = useCallback(
    (callback: (progress: FileSearchProgress) => void): (() => void) => {
      if (!api) {
        // Return a no-op unsubscribe function
        return function noop() {
          // No cleanup needed when api is not available
        };
      }
      return api.fileSearch.onProgress(callback);
    },
    [api]
  );

  return {
    cancel,
    isElectron,
    search,
    subscribeToProgress,
  };
}

export function useElectronFs() {
  const { api, isElectron } = useElectron();

  const collectRepositoryData = useCallback(
    async (repositoryPath: string): Promise<CollectRepositoryDataResult> => {
      if (!api) return { error: 'Not running in Electron', success: false };
      return api.fs.collectRepositoryData(repositoryPath);
    },
    [api]
  );

  const readFile = useCallback(
    async (path: string): Promise<{ content?: string; error?: string; success: boolean }> => {
      if (!api) return { error: 'Not running in Electron', success: false };
      return api.fs.readFile(path);
    },
    [api]
  );

  const writeFile = useCallback(
    async (path: string, content: string): Promise<{ error?: string; success: boolean }> => {
      if (!api) return { error: 'Not running in Electron', success: false };
      return api.fs.writeFile(path, content);
    },
    [api]
  );

  const readDirectory = useCallback(
    async (
      path: string
    ): Promise<{
      entries?: Array<{ isDirectory: boolean; isFile: boolean; name: string }>;
      error?: string;
      success: boolean;
    }> => {
      if (!api) return { error: 'Not running in Electron', success: false };
      return api.fs.readDirectory(path);
    },
    [api]
  );

  const exists = useCallback(
    async (path: string): Promise<boolean> => {
      if (!api) return false;
      return api.fs.exists(path);
    },
    [api]
  );

  const mkdir = useCallback(
    async (path: string): Promise<{ error?: string; success: boolean }> => {
      if (!api) return { error: 'Not running in Electron', success: false };
      return api.fs.mkdir(path);
    },
    [api]
  );

  const stat = useCallback(
    async (
      path: string
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
      if (!api) return { error: 'Not running in Electron', success: false };
      return api.fs.stat(path);
    },
    [api]
  );

  return {
    collectRepositoryData,
    exists,
    isElectron,
    mkdir,
    readDirectory,
    readFile,
    stat,
    writeFile,
  };
}

export function useElectronOpenRouterModels() {
  const { api, isElectron } = useElectron();

  const clear = useCallback(async (): Promise<boolean> => {
    if (!api) return false;
    return api.openRouterModels.clear();
  }, [api]);

  const fetch = useCallback(async (): Promise<{
    error?: string;
    models?: Array<OpenRouterModel>;
    success: boolean;
  }> => {
    if (!api) return { error: 'Not running in Electron', success: false };
    return api.openRouterModels.fetch();
  }, [api]);

  const get = useCallback(async (): Promise<null | StoredOpenRouterModels> => {
    if (!api) return null;
    return api.openRouterModels.get();
  }, [api]);

  return {
    clear,
    fetch,
    get,
    isElectron,
  };
}

export function useElectronStore() {
  const { api, isElectron } = useElectron();

  const get = useCallback(
    async <T>(key: string): Promise<T | undefined> => {
      if (!api) return undefined;
      return api.store.get<T>(key);
    },
    [api]
  );

  const set = useCallback(
    async (key: string, value: unknown): Promise<boolean> => {
      if (!api) return false;
      return api.store.set(key, value);
    },
    [api]
  );

  const remove = useCallback(
    async (key: string): Promise<boolean> => {
      if (!api) return false;
      return api.store.delete(key);
    },
    [api]
  );

  return {
    get,
    isElectron,
    remove,
    set,
  };
}
