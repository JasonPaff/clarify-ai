// Database types (mirrors db/schema.ts)
export interface Project {
  createdAt: string;
  description: string | null;
  id: number;
  name: string;
  updatedAt: string;
}

export interface NewProject {
  description?: string | null;
  name: string;
}

export interface ElectronAPI {
  app: {
    getPath(
      name:
        | "appData"
        | "desktop"
        | "documents"
        | "downloads"
        | "home"
        | "temp"
        | "userData"
    ): Promise<string>;
    getVersion(): Promise<string>;
  };
  db: {
    projects: {
      create(data: NewProject): Promise<Project>;
      delete(id: number): Promise<boolean>;
      getAll(): Promise<Project[]>;
      getById(id: number): Promise<Project | undefined>;
      update(id: number, data: Partial<NewProject>): Promise<Project | undefined>;
    };
  };
  dialog: {
    openDirectory(): Promise<null | string>;
    openFile(
      filters?: Array<{ extensions: Array<string>; name: string }>
    ): Promise<null | string>;
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
    readFile(
      path: string
    ): Promise<{ content?: string; error?: string; success: boolean }>;
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
    writeFile(
      path: string,
      content: string
    ): Promise<{ error?: string; success: boolean }>;
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
