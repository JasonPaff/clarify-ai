'use client';

import { useMemo } from 'react';

import type { ApiKeyProvider } from '@/types/electron';

import { useApiKeys } from '@/hooks/queries/use-api-keys';
import { useOpenRouterModels } from '@/hooks/queries/use-openrouter-models';
import { AI_MODELS, type AIModel, createModelId, type FullModelId } from '@/lib/ai/models';
import { type CostTier, getCostTier, getPricing, type ModelPricing } from '@/lib/ai/pricing';

export interface AvailableModel extends AIModel {
  costTier: CostTier;
  fullId: FullModelId;
  pricing: ModelPricing | null;
  provider: ApiKeyProvider;
}

interface UseAvailableModelsResult {
  configuredProviders: Array<ApiKeyProvider>;
  isLoading: boolean;
  models: Array<AvailableModel>;
  modelsByProvider: Partial<Record<ApiKeyProvider, Array<AvailableModel>>>;
}

/**
 * Hook that returns available AI models filtered by configured providers.
 * Only shows models for providers that have API keys configured.
 * For OpenRouter, uses dynamically fetched models if available.
 */
export function useAvailableModels(): UseAvailableModelsResult {
  const { data: apiKeys, isLoading: isApiKeysLoading } = useApiKeys();
  const { data: openRouterModelsData, isLoading: isOpenRouterLoading } = useOpenRouterModels();

  const isLoading = isApiKeysLoading || isOpenRouterLoading;

  const configuredProviders = useMemo(() => {
    if (!apiKeys) return [];
    return apiKeys.filter((key) => key.isConfigured && !key.isDisabled).map((key) => key.provider);
  }, [apiKeys]);

  const models = useMemo(() => {
    const result: Array<AvailableModel> = [];
    for (const provider of configuredProviders) {
      // For OpenRouter, use dynamic models if available, otherwise fallback to hardcoded
      if (provider === 'openrouter') {
        const dynamicModels = openRouterModelsData?.models;
        if (dynamicModels && dynamicModels.length > 0) {
          for (const model of dynamicModels) {
            result.push({
              contextLength: model.contextLength,
              costTier: getCostTier(model.id),
              fullId: createModelId(provider, model.id),
              id: model.id,
              name: model.name,
              pricing: getPricing(model.id),
              provider,
              supportsThinking: model.supportsThinking,
            });
          }
          continue;
        }
      }

      // Use hardcoded models for other providers (or OpenRouter fallback)
      const providerModels = AI_MODELS[provider];
      if (providerModels) {
        for (const model of providerModels) {
          result.push({
            ...model,
            costTier: getCostTier(model.id),
            fullId: createModelId(provider, model.id),
            pricing: getPricing(model.id),
            provider,
          });
        }
      }
    }
    return result;
  }, [configuredProviders, openRouterModelsData]);

  const modelsByProvider = useMemo(() => {
    // Create a partial record that only contains entries for configured providers
    const result: Partial<Record<ApiKeyProvider, Array<AvailableModel>>> = {};
    for (const model of models) {
      if (!result[model.provider]) {
        result[model.provider] = [];
      }
      result[model.provider]!.push(model);
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
