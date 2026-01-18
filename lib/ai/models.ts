import type { ApiKeyProvider } from '@/types/electron';

// Model definition
export interface AIModel {
  id: string;
  name: string;
  supportsThinking?: boolean;
}

// Available models per provider
export const AI_MODELS: Record<ApiKeyProvider, Array<AIModel>> = {
  anthropic: [
    { id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5', supportsThinking: true },
    { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', supportsThinking: true },
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', supportsThinking: true },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', supportsThinking: false },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', supportsThinking: false },
  ],
  google: [
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', supportsThinking: true },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', supportsThinking: true },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', supportsThinking: false },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', supportsThinking: false },
  ],
  openai: [
    { id: 'gpt-5.2', name: 'GPT-5.2', supportsThinking: true },
    { id: 'gpt-5.1', name: 'GPT-5.1', supportsThinking: true },
    { id: 'gpt-5', name: 'GPT-5', supportsThinking: true },
    { id: 'gpt-5-mini', name: 'GPT-5 Mini', supportsThinking: true },
    { id: 'gpt-4.1', name: 'GPT-4.1', supportsThinking: false },
    { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', supportsThinking: false },
    { id: 'o3-mini', name: 'o3 Mini', supportsThinking: true },
    { id: 'o1', name: 'o1', supportsThinking: true },
    { id: 'gpt-4o', name: 'GPT-4o', supportsThinking: false },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', supportsThinking: false },
  ],
};

// Full model identifier format: "provider:modelId"
export type FullModelId = `${ApiKeyProvider}:${string}`;

// Create a full model ID from provider and model
export function createModelId(provider: ApiKeyProvider, modelId: string): FullModelId {
  return `${provider}:${modelId}`;
}

// Get all models as flat list with provider info
export function getAllModels(): Array<AIModel & { provider: ApiKeyProvider }> {
  const models: Array<AIModel & { provider: ApiKeyProvider }> = [];
  for (const [provider, providerModels] of Object.entries(AI_MODELS)) {
    for (const model of providerModels) {
      models.push({ ...model, provider: provider as ApiKeyProvider });
    }
  }
  return models;
}

// Get model info by full ID
export function getModelInfo(fullModelId: FullModelId): AIModel | undefined {
  const { modelId, provider } = parseModelId(fullModelId);
  return AI_MODELS[provider]?.find((m) => m.id === modelId);
}

// Parse a full model ID into provider and model
export function parseModelId(fullModelId: FullModelId): { modelId: string; provider: ApiKeyProvider } {
  const [provider, ...rest] = fullModelId.split(':');
  return {
    modelId: rest.join(':'),
    provider: provider as ApiKeyProvider,
  };
}

// Provider display names
export const PROVIDER_NAMES: Record<ApiKeyProvider, string> = {
  anthropic: 'Anthropic',
  google: 'Google',
  openai: 'OpenAI',
};
