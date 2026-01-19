import { type ApiKeyProvider, PROVIDER_DISPLAY_NAMES } from '@/electron/ipc/lib/provider-types';

// Re-export the canonical ApiKeyProvider type
export type { ApiKeyProvider } from '@/electron/ipc/lib/provider-types';

// Model definition
export interface AIModel {
  contextLength?: null | number;
  id: string;
  name: string;
  supportsThinking?: boolean;
}

// Available models per provider (for major providers with known model catalogs)
// This type uses a partial record since not all providers have models defined yet
export const AI_MODELS: Partial<Record<ApiKeyProvider, Array<AIModel>>> = {
  // Major providers
  anthropic: [
    { id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5', supportsThinking: true },
    { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', supportsThinking: true },
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', supportsThinking: true },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', supportsThinking: false },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', supportsThinking: false },
  ],
  // Enterprise providers
  azure: [
    // Note: Azure OpenAI uses deployment names, these are common deployment patterns
    // Actual model IDs depend on user's Azure deployments
    { id: 'gpt-4o', name: 'GPT-4o (Azure)', supportsThinking: false },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Azure)', supportsThinking: false },
    { id: 'gpt-4', name: 'GPT-4 (Azure)', supportsThinking: false },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo (Azure)', supportsThinking: false },
    { id: 'gpt-35-turbo', name: 'GPT-3.5 Turbo (Azure)', supportsThinking: false },
  ],
  bedrock: [
    // Anthropic models on Bedrock
    {
      id: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      name: 'Claude 3.5 Sonnet v2 (Bedrock)',
      supportsThinking: false,
    },
    { id: 'anthropic.claude-3-5-haiku-20241022-v1:0', name: 'Claude 3.5 Haiku (Bedrock)', supportsThinking: false },
    { id: 'anthropic.claude-3-opus-20240229-v1:0', name: 'Claude 3 Opus (Bedrock)', supportsThinking: false },
    { id: 'anthropic.claude-3-sonnet-20240229-v1:0', name: 'Claude 3 Sonnet (Bedrock)', supportsThinking: false },
    { id: 'anthropic.claude-3-haiku-20240307-v1:0', name: 'Claude 3 Haiku (Bedrock)', supportsThinking: false },
    // Amazon Nova models
    { id: 'amazon.nova-pro-v1:0', name: 'Amazon Nova Pro (Bedrock)', supportsThinking: false },
    { id: 'amazon.nova-lite-v1:0', name: 'Amazon Nova Lite (Bedrock)', supportsThinking: false },
    { id: 'amazon.nova-micro-v1:0', name: 'Amazon Nova Micro (Bedrock)', supportsThinking: false },
    // Amazon Titan models
    { id: 'amazon.titan-text-express-v1', name: 'Amazon Titan Text Express (Bedrock)', supportsThinking: false },
    { id: 'amazon.titan-text-lite-v1', name: 'Amazon Titan Text Lite (Bedrock)', supportsThinking: false },
  ],

  // Emerging providers
  cohere: [
    { id: 'command-r-plus', name: 'Command R+', supportsThinking: false },
    { id: 'command-r', name: 'Command R', supportsThinking: false },
    { id: 'command', name: 'Command', supportsThinking: false },
    { id: 'command-light', name: 'Command Light', supportsThinking: false },
  ],
  deepseek: [
    { id: 'deepseek-chat', name: 'DeepSeek Chat', supportsThinking: false },
    { id: 'deepseek-coder', name: 'DeepSeek Coder', supportsThinking: false },
    { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', supportsThinking: true },
  ],

  google: [
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', supportsThinking: true },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', supportsThinking: true },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', supportsThinking: false },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', supportsThinking: false },
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', supportsThinking: false },
    { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B Versatile', supportsThinking: false },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', supportsThinking: false },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', supportsThinking: false },
    { id: 'gemma2-9b-it', name: 'Gemma 2 9B', supportsThinking: false },
  ],
  mistral: [
    { id: 'mistral-large-latest', name: 'Mistral Large', supportsThinking: false },
    { id: 'mistral-small-latest', name: 'Mistral Small', supportsThinking: false },
    { id: 'codestral-latest', name: 'Codestral', supportsThinking: false },
    { id: 'pixtral-large-latest', name: 'Pixtral Large', supportsThinking: false },
    { id: 'magistral-medium-2506', name: 'Magistral Medium', supportsThinking: true },
    { id: 'ministral-8b-latest', name: 'Ministral 8B', supportsThinking: false },
  ],
  // Local providers
  ollama: [
    // Placeholder models - Ollama models are user-installed locally
    // Consider implementing dynamic model discovery in future
    { id: 'llama3.3:latest', name: 'Llama 3.3 (Local)', supportsThinking: false },
    { id: 'llama3.2:latest', name: 'Llama 3.2 (Local)', supportsThinking: false },
    { id: 'llama3.1:latest', name: 'Llama 3.1 (Local)', supportsThinking: false },
    { id: 'mistral:latest', name: 'Mistral (Local)', supportsThinking: false },
    { id: 'mixtral:latest', name: 'Mixtral (Local)', supportsThinking: false },
    { id: 'codellama:latest', name: 'Code Llama (Local)', supportsThinking: false },
    { id: 'qwen2.5:latest', name: 'Qwen 2.5 (Local)', supportsThinking: false },
    { id: 'deepseek-coder:latest', name: 'DeepSeek Coder (Local)', supportsThinking: false },
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
  openrouter: [
    // Anthropic models via OpenRouter
    { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4 (OpenRouter)', supportsThinking: true },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (OpenRouter)', supportsThinking: false },
    { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku (OpenRouter)', supportsThinking: false },
    { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus (OpenRouter)', supportsThinking: false },

    // OpenAI models via OpenRouter
    { id: 'openai/gpt-4o', name: 'GPT-4o (OpenRouter)', supportsThinking: false },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini (OpenRouter)', supportsThinking: false },
    { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo (OpenRouter)', supportsThinking: false },
    { id: 'openai/o1', name: 'o1 (OpenRouter)', supportsThinking: true },
    { id: 'openai/o1-mini', name: 'o1 Mini (OpenRouter)', supportsThinking: true },
    { id: 'openai/o3-mini', name: 'o3 Mini (OpenRouter)', supportsThinking: true },

    // Google models via OpenRouter
    { id: 'google/gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (OpenRouter)', supportsThinking: false },
    { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5 (OpenRouter)', supportsThinking: false },
    { id: 'google/gemini-flash-1.5', name: 'Gemini Flash 1.5 (OpenRouter)', supportsThinking: false },

    // Meta Llama models via OpenRouter
    { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B Instruct (OpenRouter)', supportsThinking: false },
    { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B Instruct (OpenRouter)', supportsThinking: false },
    { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B Instruct (OpenRouter)', supportsThinking: false },
    { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B Instruct (OpenRouter)', supportsThinking: false },

    // Mistral models via OpenRouter
    { id: 'mistralai/mistral-large', name: 'Mistral Large (OpenRouter)', supportsThinking: false },
    { id: 'mistralai/mistral-medium', name: 'Mistral Medium (OpenRouter)', supportsThinking: false },
    { id: 'mistralai/mixtral-8x22b-instruct', name: 'Mixtral 8x22B Instruct (OpenRouter)', supportsThinking: false },
    { id: 'mistralai/codestral-latest', name: 'Codestral (OpenRouter)', supportsThinking: false },

    // DeepSeek models via OpenRouter
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat (OpenRouter)', supportsThinking: false },
    { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 (OpenRouter)', supportsThinking: true },
    {
      id: 'deepseek/deepseek-r1-distill-llama-70b',
      name: 'DeepSeek R1 Distill Llama 70B (OpenRouter)',
      supportsThinking: true,
    },

    // Qwen models via OpenRouter
    { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B Instruct (OpenRouter)', supportsThinking: false },
    { id: 'qwen/qwq-32b-preview', name: 'QwQ 32B Preview (OpenRouter)', supportsThinking: true },

    // Cohere models via OpenRouter
    { id: 'cohere/command-r-plus', name: 'Command R+ (OpenRouter)', supportsThinking: false },
    { id: 'cohere/command-r', name: 'Command R (OpenRouter)', supportsThinking: false },

    // xAI models via OpenRouter
    { id: 'x-ai/grok-2', name: 'Grok 2 (OpenRouter)', supportsThinking: false },
    { id: 'x-ai/grok-beta', name: 'Grok Beta (OpenRouter)', supportsThinking: false },

    // Perplexity models via OpenRouter
    {
      id: 'perplexity/llama-3.1-sonar-huge-128k-online',
      name: 'Sonar Huge 128K Online (OpenRouter)',
      supportsThinking: false,
    },
    {
      id: 'perplexity/llama-3.1-sonar-large-128k-online',
      name: 'Sonar Large 128K Online (OpenRouter)',
      supportsThinking: false,
    },
  ],
  togetherai: [
    { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B Instruct Turbo', supportsThinking: false },
    {
      id: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
      name: 'Llama 3.1 70B Instruct Turbo',
      supportsThinking: false,
    },
    { id: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo', name: 'Llama 3.1 8B Instruct Turbo', supportsThinking: false },
    { id: 'mistralai/Mixtral-8x22B-Instruct-v0.1', name: 'Mixtral 8x22B Instruct', supportsThinking: false },
    { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', name: 'Mixtral 8x7B Instruct', supportsThinking: false },
    { id: 'Qwen/QwQ-32B-Preview', name: 'QwQ 32B Preview', supportsThinking: true },
    { id: 'Qwen/Qwen2.5-72B-Instruct-Turbo', name: 'Qwen 2.5 72B Instruct Turbo', supportsThinking: false },
    { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1', supportsThinking: true },
  ],

  xai: [
    { id: 'grok-2', name: 'Grok 2', supportsThinking: false },
    { id: 'grok-2-vision', name: 'Grok 2 Vision', supportsThinking: false },
    { id: 'grok-beta', name: 'Grok Beta', supportsThinking: false },
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

// Re-export provider display names from centralized module
export const PROVIDER_NAMES = PROVIDER_DISPLAY_NAMES;
