'use client';

import { useCallback, useMemo } from 'react';

import type {
  ApiKeyInfo,
  ApiKeyProvider,
  CollectRepositoryDataResult,
  ElectronAPI,
  RepositoryOverviewGenerateRequest,
  RepositoryOverviewStreamChunk,
  SetApiKeyInput,
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
    async (provider: ApiKeyProvider, apiKey?: string): Promise<{ error?: string; success: boolean }> => {
      if (!api) return { error: 'Not running in Electron', success: false };
      return api.apiKeys.test(provider, apiKey);
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

  return { featureRequestRepositories, featureRequests, isElectron, projects, repositories, repositoryOverviews };
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
    readDirectory,
    readFile,
    stat,
    writeFile,
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
