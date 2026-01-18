'use client';

import { useMemo } from 'react';

import type { ApiKeyProvider } from '@/types/electron';

import { useApiKeys } from '@/hooks/queries/use-api-keys';
import { AI_MODELS, type AIModel, createModelId, type FullModelId } from '@/lib/ai/models';

export interface AvailableModel extends AIModel {
  fullId: FullModelId;
  provider: ApiKeyProvider;
}

interface UseAvailableModelsResult {
  configuredProviders: Array<ApiKeyProvider>;
  isLoading: boolean;
  models: Array<AvailableModel>;
  modelsByProvider: Record<ApiKeyProvider, Array<AvailableModel>>;
}

/**
 * Hook that returns available AI models filtered by configured providers.
 * Only shows models for providers that have API keys configured.
 */
export function useAvailableModels(): UseAvailableModelsResult {
  const { data: apiKeys, isLoading } = useApiKeys();

  const configuredProviders = useMemo(() => {
    if (!apiKeys) return [];
    return apiKeys.filter((key) => key.isConfigured).map((key) => key.provider);
  }, [apiKeys]);

  const models = useMemo(() => {
    const result: Array<AvailableModel> = [];
    for (const provider of configuredProviders) {
      const providerModels = AI_MODELS[provider];
      if (providerModels) {
        for (const model of providerModels) {
          result.push({
            ...model,
            fullId: createModelId(provider, model.id),
            provider,
          });
        }
      }
    }
    return result;
  }, [configuredProviders]);

  const modelsByProvider = useMemo(() => {
    const result: Record<ApiKeyProvider, Array<AvailableModel>> = {
      anthropic: [],
      google: [],
      openai: [],
    };
    for (const model of models) {
      result[model.provider].push(model);
    }
    return result;
  }, [models]);

  return {
    configuredProviders,
    isLoading,
    models,
    modelsByProvider,
  };
}
