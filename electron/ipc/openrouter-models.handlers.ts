import { ipcMain, safeStorage } from 'electron';
import Store from 'electron-store';

import { IpcChannels } from './channels';

/** Stored OpenRouter model data */
export interface OpenRouterModel {
  contextLength: null | number;
  id: string;
  name: string;
  supportsThinking: boolean;
}

/** Stored OpenRouter models cache structure */
export interface StoredOpenRouterModels {
  lastFetchedAt: string;
  models: Array<OpenRouterModel>;
}

/** Result type for fetch operations */
interface FetchResult {
  error?: string;
  models?: Array<OpenRouterModel>;
  success: boolean;
}

/** Store namespace for OpenRouter models cache */
const OPENROUTER_MODELS_NAMESPACE = 'openRouterModels';

/** Store namespace for API keys (same as api-keys.handlers.ts) */
const API_KEYS_NAMESPACE = 'apiKeys';

interface StoreType {
  delete(key: string): void;
  get(key: string): unknown;
  set(key: string, value: unknown): void;
}

const store = new Store() as unknown as StoreType;

/** OpenRouter API response model structure */
interface OpenRouterApiModel {
  context_length?: number;
  id: string;
  name: string;
  supported_parameters?: Array<string>;
}

/** OpenRouter API response structure */
interface OpenRouterApiResponse {
  data: Array<OpenRouterApiModel>;
}

export function registerOpenRouterModelsHandlers(): void {
  // Fetch models from OpenRouter API and cache them
  ipcMain.handle(IpcChannels.openRouterModels.fetch, async (): Promise<FetchResult> => {
    const apiKey = getOpenRouterApiKey();

    if (!apiKey) {
      return {
        error: 'OpenRouter API key not configured or disabled',
        success: false,
      };
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/models/user', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        method: 'GET',
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      if (!response.ok) {
        if (response.status === 401) {
          return {
            error: 'Invalid OpenRouter API key',
            success: false,
          };
        }
        return {
          error: `OpenRouter API error: ${response.status} ${response.statusText}`,
          success: false,
        };
      }

      const data = (await response.json()) as OpenRouterApiResponse;

      if (!data.data || !Array.isArray(data.data)) {
        return {
          error: 'Invalid response from OpenRouter API',
          success: false,
        };
      }

      // Transform models to our format
      const models = data.data.map(transformModel);

      // Cache the models
      const cached: StoredOpenRouterModels = {
        lastFetchedAt: new Date().toISOString(),
        models,
      };

      store.set(OPENROUTER_MODELS_NAMESPACE, cached);

      return {
        models,
        success: true,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          error: 'Request to OpenRouter API timed out',
          success: false,
        };
      }

      return {
        error: error instanceof Error ? error.message : 'Unknown error fetching models',
        success: false,
      };
    }
  });

  // Get cached models (returns null if not cached)
  ipcMain.handle(IpcChannels.openRouterModels.get, (): null | StoredOpenRouterModels => {
    const cached = store.get(OPENROUTER_MODELS_NAMESPACE) as StoredOpenRouterModels | undefined;
    return cached ?? null;
  });

  // Clear cached models
  ipcMain.handle(IpcChannels.openRouterModels.clear, (): boolean => {
    try {
      store.delete(OPENROUTER_MODELS_NAMESPACE);
      return true;
    } catch {
      return false;
    }
  });
}

/**
 * Gets the stored and encrypted OpenRouter API key.
 * Returns null if not configured or decryption fails.
 */
function getOpenRouterApiKey(): null | string {
  const storeKey = `${API_KEYS_NAMESPACE}.openrouter`;
  const storedData = store.get(storeKey) as undefined | { encrypted?: string; isDisabled?: boolean };

  if (!storedData?.encrypted) {
    return null;
  }

  if (storedData.isDisabled === true) {
    return null;
  }

  if (!safeStorage.isEncryptionAvailable()) {
    return null;
  }

  try {
    const buffer = Buffer.from(storedData.encrypted, 'base64');
    return safeStorage.decryptString(buffer);
  } catch {
    return null;
  }
}

/**
 * Transforms an OpenRouter API model to our internal model format.
 */
function transformModel(model: OpenRouterApiModel): OpenRouterModel {
  const supportedParams = model.supported_parameters ?? [];

  // Check if model supports thinking/reasoning
  const supportsThinking = supportedParams.includes('include_reasoning') || supportedParams.includes('reasoning');

  return {
    contextLength: model.context_length ?? null,
    id: model.id,
    name: model.name,
    supportsThinking,
  };
}
