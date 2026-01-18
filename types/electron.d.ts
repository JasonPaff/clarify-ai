// Re-export database types for renderer use
export type { FeatureRequest, NewFeatureRequest } from '../db/schema/feature-requests.schema';
export type { NewProject, Project } from '../db/schema/projects.schema';
export type { NewRepository, Repository } from '../db/schema/repositories.schema';

export interface ElectronAPI {
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

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
