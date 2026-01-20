'use client';

import { useEffect, useMemo, useState } from 'react';

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

/** Base model without pricing (before async pricing data loads) */
interface BaseModel extends AIModel {
  fullId: FullModelId;
  provider: ApiKeyProvider;
}

/** Cached pricing data for a model */
interface ModelPricingData {
  costTier: CostTier;
  pricing: ModelPricing | null;
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
 * Pricing data is fetched asynchronously via IPC and merged with models.
 */
export function useAvailableModels(): UseAvailableModelsResult {
  const { data: apiKeys, isLoading: isApiKeysLoading } = useApiKeys();
  const { data: openRouterModelsData, isLoading: isOpenRouterLoading } = useOpenRouterModels();

  // State for async pricing data, keyed by model ID
  const [pricingCache, setPricingCache] = useState<Record<string, ModelPricingData>>({});

  const isLoading = isApiKeysLoading || isOpenRouterLoading;

  const configuredProviders = useMemo(() => {
    if (!apiKeys) return [];
    return apiKeys.filter((key) => key.isConfigured && !key.isDisabled).map((key) => key.provider);
  }, [apiKeys]);

  // Create base models without pricing (sync)
  const baseModels = useMemo(() => {
    const result: Array<BaseModel> = [];
    for (const provider of configuredProviders) {
      // For OpenRouter, use dynamic models if available, otherwise fallback to hardcoded
      if (provider === 'openrouter') {
        const dynamicModels = openRouterModelsData?.models;
        if (dynamicModels && dynamicModels.length > 0) {
          for (const model of dynamicModels) {
            result.push({
              contextLength: model.contextLength,
              fullId: createModelId(provider, model.id),
              id: model.id,
              name: model.name,
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
            fullId: createModelId(provider, model.id),
            provider,
          });
        }
      }
    }
    return result;
  }, [configuredProviders, openRouterModelsData]);

  // Fetch pricing data for all models asynchronously
  useEffect(() => {
    if (baseModels.length === 0) return;

    let cancelled = false;

    // Fetch pricing for models not yet in cache
    const modelsNeedingPricing = baseModels.filter((model) => !pricingCache[model.id]);

    if (modelsNeedingPricing.length === 0) return;

    // Fetch pricing for all models in parallel
    const fetchPricing = async () => {
      const pricingResults = await Promise.all(
        modelsNeedingPricing.map(async (model) => {
          const [costTier, pricing] = await Promise.all([getCostTier(model.id), getPricing(model.id)]);
          return { costTier, id: model.id, pricing };
        })
      );

      if (cancelled) return;

      // Update cache with new pricing data
      setPricingCache((prev) => {
        const updated = { ...prev };
        for (const result of pricingResults) {
          updated[result.id] = {
            costTier: result.costTier,
            pricing: result.pricing,
          };
        }
        return updated;
      });
    };

    fetchPricing();

    return () => {
      cancelled = true;
    };
  }, [baseModels, pricingCache]);

  // Merge base models with pricing data
  const models = useMemo(() => {
    return baseModels.map((model): AvailableModel => {
      const pricingData = pricingCache[model.id];
      return {
        ...model,
        costTier: pricingData?.costTier ?? '$$', // Default tier while loading
        pricing: pricingData?.pricing ?? null,
      };
    });
  }, [baseModels, pricingCache]);

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
