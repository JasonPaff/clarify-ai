// Re-export database types for renderer use
export type {
  ContextFileType,
  FeatureRequestContextFile,
  NewFeatureRequestContextFile,
} from '../db/schema/feature-request-context-files.schema';
export type {
  FeatureRequestRun,
  FeatureRequestRunStatus,
  FeatureRequestRunStep,
  NewFeatureRequestRun,
} from '../db/schema/feature-request-runs.schema';
export type { FeatureRequest, NewFeatureRequest } from '../db/schema/feature-requests.schema';
export type { NewProject, Project, ProjectWithFeatureCount } from '../db/schema/projects.schema';
export type { NewRepository, Repository } from '../db/schema/repositories.schema';
export type { NewRepositoryOverview, RepositoryOverview } from '../db/schema/repository-overviews.schema';
export type {
  NewStepConfiguration,
  StepConfiguration,
  StepConfigurationStep,
} from '../db/schema/step-configurations.schema';

// Re-export AI clarification types for renderer use
export type {
  ClarificationContextFile,
  ClarificationGenerateRequest,
  ClarificationRepositoryOverview,
  ClarificationStreamChunk,
} from '../electron/ipc/ai-clarification.handlers';

// Re-export AI discovery types for renderer use
export type {
  DiscoveredFile,
  DiscoveryGenerateRequest,
  DiscoveryRepositoryOverview,
  DiscoveryScopeConfig,
  DiscoveryStreamChunk,
} from '../electron/ipc/ai-discovery.handlers';

// Re-export AI overview types for renderer use
export type {
  RepositoryOverviewGenerateRequest,
  RepositoryOverviewStreamChunk,
} from '../electron/ipc/ai-overview.handlers';

// Re-export AI plan types for renderer use
export type {
  ImplementationPlan,
  PlanGenerateRequest,
  PlanRepositoryOverview,
  PlanRisk,
  PlanScopeConfig,
  PlanStep,
  PlanStreamChunk,
  PlanToolResultData,
  QualityGate,
  TestingStrategy,
} from '../electron/ipc/ai-plan.handlers';

// Re-export API key types for renderer use (excluding ApiKeyProvider and ProviderCredentials which come from provider-types)
export type { ApiKeyInfo, ApiKeySource, SetApiKeyInput } from '../electron/ipc/api-keys.handlers';
// Re-export file search types for renderer use
export type { FileSearchProgress } from '../electron/ipc/file-search.handlers';
// Re-export file system types for renderer use
export type { CollectRepositoryDataResult, DetectedFramework, RepositoryData } from '../electron/ipc/fs.handlers';

// Re-export provider types from centralized module (single source of truth)
export type {
  ApiKeyProvider,
  ProviderAuthType,
  ProviderCategory,
  ProviderConfig,
  ProviderCredentials,
} from '../electron/ipc/lib/provider-types';

export {
  ALL_PROVIDERS,
  getMajorProviders,
  getOptionalCredentialFields,
  getProviderDisplayName,
  getProviderEnvVar,
  getProvidersByCategory,
  getRequiredCredentialFields,
  isValidProvider,
  PROVIDER_CATEGORIES,
  PROVIDER_CONFIGS,
  PROVIDER_DISPLAY_NAMES,
  PROVIDER_ENV_VARS,
  providerRequiresAdditionalConfig,
  providerRequiresApiKey,
  validateProviderCredentials,
} from '../electron/ipc/lib/provider-types';
// Re-export OpenRouter models types for renderer use
export type { OpenRouterModel, StoredOpenRouterModels } from '../electron/ipc/openrouter-models.handlers';

export type {
  FileSearchRequest,
  FileSearchResponse,
  FileSearchResult,
  FileSearchSnippet,
  FileType,
  HighlightRange,
} from '../lib/validations/file-search';

/**
 * Electron API exposed to the renderer process via context bridge.
 * Provides access to native capabilities, database operations, and AI functionality.
 */
export interface ElectronAPI {
  /** AI-related operations including clarification, discovery, plan, and repository overview generation */
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
    discovery: {
      cancel(): Promise<void>;
      generate(
        request: import('../electron/ipc/ai-discovery.handlers').DiscoveryGenerateRequest
      ): Promise<{ error?: string; success: boolean }>;
      onStream(
        callback: (chunk: import('../electron/ipc/ai-discovery.handlers').DiscoveryStreamChunk) => void
      ): () => void;
    };
    plan: {
      cancel(): Promise<void>;
      generate(
        request: import('../electron/ipc/ai-plan.handlers').PlanGenerateRequest
      ): Promise<{ error?: string; success: boolean }>;
      onStream(callback: (chunk: import('../electron/ipc/ai-plan.handlers').PlanStreamChunk) => void): () => void;
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
  /**
   * API key management for AI providers.
   * Supports multiple authentication types:
   * - Standard API keys (most providers)
   * - Azure OpenAI (endpoint + deployment name + API key)
   * - AWS Bedrock (access key + secret key + region)
   * - Ollama (endpoint only, no authentication required)
   */
  apiKeys: {
    /** Delete stored credentials for a provider */
    delete(
      provider: import('../electron/ipc/lib/provider-types').ApiKeyProvider
    ): Promise<{ error?: string; success: boolean }>;
    /**
     * Get credentials for a provider (decrypted for API calls).
     * Returns the full ProviderCredentials object for complex auth types.
     */
    get(provider: import('../electron/ipc/lib/provider-types').ApiKeyProvider): Promise<{
      /** Full credentials object including API key, endpoint, region, etc. */
      credentials?: import('../electron/ipc/lib/provider-types').ProviderCredentials;
      error?: string;
      /** Backward compatible: API key value (same as credentials.apiKey) */
      key?: string;
      source?: 'environment' | 'user';
    }>;
    /** Get info for all configured providers (masked values for display) */
    getAll(): Promise<Array<import('../electron/ipc/api-keys.handlers').ApiKeyInfo>>;
    /** Check if secure storage encryption is available on this system */
    isEncryptionAvailable(): Promise<boolean>;
    /**
     * Store credentials for a provider.
     * Input includes all fields needed for the provider's auth type.
     */
    set(
      input: import('../electron/ipc/api-keys.handlers').SetApiKeyInput
    ): Promise<{ error?: string; success: boolean }>;
    /** Test credentials by making a minimal API call to the provider */
    test(
      provider: import('../electron/ipc/lib/provider-types').ApiKeyProvider,
      credentials?: import('../electron/ipc/lib/provider-types').ProviderCredentials
    ): Promise<{ error?: string; success: boolean }>;
    /** Toggle the disabled state of stored credentials for a provider */
    toggleDisabled(
      provider: import('../electron/ipc/lib/provider-types').ApiKeyProvider
    ): Promise<{ error?: string; success: boolean }>;
  };
  app: {
    getPath(name: 'appData' | 'desktop' | 'documents' | 'downloads' | 'home' | 'temp' | 'userData'): Promise<string>;
    getVersion(): Promise<string>;
  };
  /** Database operations for managing application data */
  db: {
    featureRequestContextFiles: {
      bulkCreate(
        data: Array<import('../db/schema/feature-request-context-files.schema').NewFeatureRequestContextFile>
      ): Promise<Array<import('../db/schema/feature-request-context-files.schema').FeatureRequestContextFile>>;
      create(
        data: import('../db/schema/feature-request-context-files.schema').NewFeatureRequestContextFile
      ): Promise<import('../db/schema/feature-request-context-files.schema').FeatureRequestContextFile>;
      delete(id: number): Promise<boolean>;
      getByFeatureRequestId(
        featureRequestId: number
      ): Promise<Array<import('../db/schema/feature-request-context-files.schema').FeatureRequestContextFile>>;
      getByFeatureRequestIdAndType(
        featureRequestId: number,
        fileType: import('../db/schema/feature-request-context-files.schema').ContextFileType
      ): Promise<Array<import('../db/schema/feature-request-context-files.schema').FeatureRequestContextFile>>;
      getById(
        id: number
      ): Promise<import('../db/schema/feature-request-context-files.schema').FeatureRequestContextFile | undefined>;
      setIncludedInContext(
        id: number,
        includedInContext: boolean
      ): Promise<import('../db/schema/feature-request-context-files.schema').FeatureRequestContextFile | undefined>;
      update(
        id: number,
        data: Partial<import('../db/schema/feature-request-context-files.schema').NewFeatureRequestContextFile>
      ): Promise<import('../db/schema/feature-request-context-files.schema').FeatureRequestContextFile | undefined>;
    };
    featureRequestRepositories: {
      addToFeatureRequest(featureRequestId: number, repositoryId: number): Promise<boolean>;
      getByFeatureRequestId(featureRequestId: number): Promise<Array<number>>;
      removeFromFeatureRequest(featureRequestId: number, repositoryId: number): Promise<boolean>;
      setForFeatureRequest(featureRequestId: number, repositoryIds: Array<number>): Promise<void>;
    };
    featureRequestRuns: {
      create(
        data: import('../db/schema/feature-request-runs.schema').NewFeatureRequestRun
      ): Promise<import('../db/schema/feature-request-runs.schema').FeatureRequestRun>;
      delete(id: number): Promise<boolean>;
      getByFeatureRequestId(
        featureRequestId: number
      ): Promise<Array<import('../db/schema/feature-request-runs.schema').FeatureRequestRun>>;
      getByFeatureRequestIdAndStatus(
        featureRequestId: number,
        status: import('../db/schema/feature-request-runs.schema').FeatureRequestRunStatus
      ): Promise<Array<import('../db/schema/feature-request-runs.schema').FeatureRequestRun>>;
      getByFeatureRequestIdAndStep(
        featureRequestId: number,
        step: import('../db/schema/feature-request-runs.schema').FeatureRequestRunStep
      ): Promise<Array<import('../db/schema/feature-request-runs.schema').FeatureRequestRun>>;
      getById(id: number): Promise<import('../db/schema/feature-request-runs.schema').FeatureRequestRun | undefined>;
      getCurrentRun(
        featureRequestId: number,
        step: import('../db/schema/feature-request-runs.schema').FeatureRequestRunStep
      ): Promise<import('../db/schema/feature-request-runs.schema').FeatureRequestRun | undefined>;
      getLatestByFeatureRequestId(
        featureRequestId: number
      ): Promise<import('../db/schema/feature-request-runs.schema').FeatureRequestRun | undefined>;
      getLatestByFeatureRequestIdAndStep(
        featureRequestId: number,
        step: import('../db/schema/feature-request-runs.schema').FeatureRequestRunStep
      ): Promise<import('../db/schema/feature-request-runs.schema').FeatureRequestRun | undefined>;
      setCurrentRun(
        featureRequestId: number,
        step: import('../db/schema/feature-request-runs.schema').FeatureRequestRunStep,
        runId: number
      ): Promise<import('../db/schema/feature-request-runs.schema').FeatureRequestRun | undefined>;
      update(
        id: number,
        data: Partial<import('../db/schema/feature-request-runs.schema').NewFeatureRequestRun>
      ): Promise<import('../db/schema/feature-request-runs.schema').FeatureRequestRun | undefined>;
    };
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
      getAll(): Promise<Array<import('../db/schema/projects.schema').ProjectWithFeatureCount>>;
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
      ): Promise<import('../db/schema/repository-overviews.schema').RepositoryOverview | undefined>;
      update(
        id: number,
        data: Partial<import('../db/schema/repository-overviews.schema').NewRepositoryOverview>
      ): Promise<import('../db/schema/repository-overviews.schema').RepositoryOverview | undefined>;
      upsert(
        repositoryId: number,
        data: Omit<import('../db/schema/repository-overviews.schema').NewRepositoryOverview, 'repositoryId'>
      ): Promise<import('../db/schema/repository-overviews.schema').RepositoryOverview>;
    };
    stepConfigurations: {
      create(
        data: import('../db/schema/step-configurations.schema').NewStepConfiguration
      ): Promise<import('../db/schema/step-configurations.schema').StepConfiguration>;
      delete(id: number): Promise<boolean>;
      getById(id: number): Promise<import('../db/schema/step-configurations.schema').StepConfiguration | undefined>;
      getByProjectId(
        projectId: number
      ): Promise<Array<import('../db/schema/step-configurations.schema').StepConfiguration>>;
      getByProjectIdAndStep(
        projectId: number,
        step: import('../db/schema/step-configurations.schema').StepConfigurationStep
      ): Promise<import('../db/schema/step-configurations.schema').StepConfiguration | undefined>;
      update(
        id: number,
        data: Partial<import('../db/schema/step-configurations.schema').NewStepConfiguration>
      ): Promise<import('../db/schema/step-configurations.schema').StepConfiguration | undefined>;
      upsert(
        projectId: number,
        step: import('../db/schema/step-configurations.schema').StepConfigurationStep,
        data: Omit<import('../db/schema/step-configurations.schema').NewStepConfiguration, 'projectId' | 'step'>
      ): Promise<import('../db/schema/step-configurations.schema').StepConfiguration>;
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
  /** Electron-specific operations (non-database, non-AI) */
  electron: {
    /**
     * Import a repository overview from external content (e.g., markdown file).
     * Validates and upserts the content into the database for the given repository.
     */
    importRepositoryOverview(
      repositoryId: number,
      content: string
    ): Promise<{
      error?: string;
      overview?: import('../db/schema/repository-overviews.schema').RepositoryOverview;
      success: boolean;
    }>;
  };
  /** File search operations for searching across repositories */
  fileSearch: {
    /** Cancel an ongoing search operation */
    cancel(): Promise<void>;
    /** Subscribe to search progress updates. Returns an unsubscribe function. */
    onProgress(
      callback: (progress: import('../electron/ipc/file-search.handlers').FileSearchProgress) => void
    ): () => void;
    /** Execute a file search across repositories */
    search(
      request: import('../lib/validations/file-search').FileSearchRequest,
      repositories: Array<{ id: number; name: string; path: string }>
    ): Promise<{
      error?: string;
      response?: import('../lib/validations/file-search').FileSearchResponse;
      success: boolean;
    }>;
  };
  fs: {
    collectRepositoryData(
      repositoryPath: string
    ): Promise<import('../electron/ipc/fs.handlers').CollectRepositoryDataResult>;
    exists(path: string): Promise<boolean>;
    mkdir(path: string): Promise<{ error?: string; success: boolean }>;
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
  /** OpenRouter models fetching and caching */
  openRouterModels: {
    /** Clear cached models */
    clear(): Promise<boolean>;
    /** Fetch models from OpenRouter API and cache them */
    fetch(): Promise<{
      error?: string;
      models?: Array<import('../electron/ipc/openrouter-models.handlers').OpenRouterModel>;
      success: boolean;
    }>;
    /** Get cached models (returns null if not cached) */
    get(): Promise<import('../electron/ipc/openrouter-models.handlers').StoredOpenRouterModels | null>;
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
