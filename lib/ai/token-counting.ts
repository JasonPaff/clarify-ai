/**
 * Token counting utilities for AI model usage estimation.
 *
 * Uses tokenlens v2 via IPC for accurate token counting with actual model tokenizers.
 * Falls back to character-based estimation when tokenlens is unavailable or fails.
 *
 * Context window lookups use tokenlens v2 via IPC for live data.
 */

import type { ApiKeyProvider } from '@/electron/ipc/lib/provider-types';

import { type FullModelId, parseModelId } from './models';

/**
 * Tokenizer type based on model family.
 * Used for fallback character-to-token ratio when tokenlens unavailable.
 */
export type TokenizerType = 'claude' | 'gemini' | 'gpt' | 'llama' | 'mistral' | 'other';

/**
 * Character-to-token ratios for fallback estimation.
 * Used when tokenlens is unavailable (SSR, tests, or lookup failure).
 */
const CHARS_PER_TOKEN: Record<TokenizerType, number> = {
  claude: 3.5,
  gemini: 4.0,
  gpt: 4.0,
  llama: 3.8,
  mistral: 3.8,
  other: 4.0,
};

/**
 * Maps provider to their typical tokenizer type for fallback.
 */
const PROVIDER_TOKENIZER_MAP: Record<ApiKeyProvider, TokenizerType> = {
  anthropic: 'claude',
  azure: 'gpt',
  bedrock: 'other',
  cohere: 'other',
  deepseek: 'other',
  google: 'gemini',
  groq: 'llama',
  mistral: 'mistral',
  ollama: 'other',
  openai: 'gpt',
  openrouter: 'other',
  togetherai: 'other',
  xai: 'other',
};

/** Default context window for unknown models */
const DEFAULT_CONTEXT_WINDOW = 128000;

/**
 * Normalized token usage data.
 */
export interface NormalizedTokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

/**
 * Usage input format.
 * Supports both camelCase and snake_case formats.
 */
export interface UsageInput {
  input_tokens?: number;
  inputTokens?: number;
  output_tokens?: number;
  outputTokens?: number;
  total_tokens?: number;
  totalTokens?: number;
}

/**
 * Get the tokenizer type for fallback estimation.
 *
 * @param fullModelId - The full model ID (provider:modelId format)
 * @returns The tokenizer type to use for estimation
 */
export function getTokenizerForModel(fullModelId: FullModelId): TokenizerType {
  try {
    const { modelId, provider } = parseModelId(fullModelId);
    const modelLower = modelId.toLowerCase();

    if (modelLower.includes('claude')) {
      return 'claude';
    }
    if (modelLower.includes('gpt') || modelLower.includes('o1') || modelLower.includes('o3')) {
      return 'gpt';
    }
    if (modelLower.includes('gemini')) {
      return 'gemini';
    }
    if (modelLower.includes('llama')) {
      return 'llama';
    }
    if (modelLower.includes('mistral') || modelLower.includes('mixtral') || modelLower.includes('codestral')) {
      return 'mistral';
    }

    return PROVIDER_TOKENIZER_MAP[provider] ?? 'other';
  } catch {
    return 'other';
  }
}

/**
 * Fallback character-based token estimation.
 * Used when tokenlens is unavailable.
 *
 * @param text - The text to count tokens for
 * @param fullModelId - The full model ID (provider:modelId format)
 * @returns Estimated token count
 */
function estimateTokensFallback(text: string, fullModelId: FullModelId): number {
  if (!text) {
    return 0;
  }

  const tokenizerType = getTokenizerForModel(fullModelId);
  const charsPerToken = CHARS_PER_TOKEN[tokenizerType];

  return Math.ceil(text.length / charsPerToken);
}

/**
 * Count tokens in a text string.
 * Uses tokenlens v2 via IPC for accurate counting with actual model tokenizers.
 * Falls back to character-based estimation if tokenlens is unavailable.
 *
 * @param text - The text to count tokens for
 * @param fullModelId - The full model ID (provider:modelId format)
 * @returns Token count (estimated if tokenlens unavailable)
 */
export async function countTokens(text: string, fullModelId: FullModelId): Promise<number> {
  if (!text) {
    return 0;
  }

  // Check if we're in Electron environment
  if (typeof window === 'undefined' || !window.electronAPI?.tokenlens) {
    return estimateTokensFallback(text, fullModelId);
  }

  try {
    const { modelId } = parseModelId(fullModelId);
    const result = await window.electronAPI.tokenlens.countTokens(modelId, text);

    if (result.count !== undefined) {
      return result.count;
    }

    // Fall back to estimation if tokenlens returns undefined
    return estimateTokensFallback(text, fullModelId);
  } catch (error) {
    console.warn('[token-counting] Tokenlens count failed, using fallback:', error);
    return estimateTokensFallback(text, fullModelId);
  }
}

/**
 * Synchronous token estimation using character-based calculation.
 * Use this when async is not feasible. Prefer countTokens for accuracy.
 *
 * @param text - The text to count tokens for
 * @param fullModelId - The full model ID (provider:modelId format)
 * @returns Estimated token count
 */
export function countTokensSync(text: string, fullModelId: FullModelId): number {
  return estimateTokensFallback(text, fullModelId);
}

/**
 * Create a usage estimate object for cost calculations.
 *
 * @param inputTokens - Number of input tokens
 * @param outputTokens - Number of output tokens
 * @returns Usage object
 */
export function createUsageEstimate(inputTokens: number, outputTokens: number): UsageInput {
  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
  };
}

/**
 * Estimate the total input tokens for a prompt including system prompt.
 *
 * @param prompt - The user prompt text
 * @param systemPrompt - The system prompt text (optional)
 * @param fullModelId - The full model ID (provider:modelId format)
 * @returns Estimated total input token count
 */
export async function estimateInputTokens(
  prompt: string,
  systemPrompt: string | undefined,
  fullModelId: FullModelId
): Promise<number> {
  const promptTokens = await countTokens(prompt, fullModelId);
  const systemTokens = systemPrompt ? await countTokens(systemPrompt, fullModelId) : 0;

  // Add a small overhead for message formatting (role tags, separators, etc.)
  const formatOverhead = 10;

  return promptTokens + systemTokens + formatOverhead;
}

/**
 * Get context window limit for a model.
 * Uses tokenlens v2 via IPC for live data from provider catalogs.
 *
 * @param fullModelId - The full model ID (provider:modelId format)
 * @returns Context window limit in tokens
 */
export async function getModelContextWindow(fullModelId: FullModelId): Promise<number> {
  if (typeof window === 'undefined' || !window.electronAPI?.tokenlens) {
    return DEFAULT_CONTEXT_WINDOW;
  }

  try {
    const { modelId, provider } = parseModelId(fullModelId);
    const result = await window.electronAPI.tokenlens.getContextLimits(modelId, provider);

    if (result.context) {
      return result.context;
    }

    return DEFAULT_CONTEXT_WINDOW;
  } catch (error) {
    console.warn('[token-counting] Failed to get context window:', error);
    return DEFAULT_CONTEXT_WINDOW;
  }
}

/**
 * Check if a prompt fits within a model's context window.
 *
 * @param estimatedTokens - Estimated number of tokens
 * @param fullModelId - The full model ID (provider:modelId format)
 * @param reserveForOutput - Tokens to reserve for output (default: 4096)
 * @returns true if the prompt fits, false otherwise
 */
export async function fitsInContext(
  estimatedTokens: number,
  fullModelId: FullModelId,
  reserveForOutput = 4096
): Promise<boolean> {
  const contextLimit = await getModelContextWindow(fullModelId);
  return estimatedTokens <= contextLimit - reserveForOutput;
}

/**
 * Calculate what percentage of the context window is used.
 *
 * @param estimatedTokens - Estimated number of tokens
 * @param fullModelId - The full model ID (provider:modelId format)
 * @returns Percentage of context used (0-100)
 */
export async function getContextUsagePercent(estimatedTokens: number, fullModelId: FullModelId): Promise<number> {
  const contextLimit = await getModelContextWindow(fullModelId);
  return Math.min(100, Math.round((estimatedTokens / contextLimit) * 100));
}

/**
 * Normalize usage data from various formats into a standard format.
 *
 * @param usage - Usage data in any supported format
 * @returns Normalized usage object with consistent property names
 */
export function normalizeTokenUsage(usage: UsageInput): NormalizedTokenUsage {
  try {
    const inputTokens = usage.inputTokens ?? usage.input_tokens ?? 0;
    const outputTokens = usage.outputTokens ?? usage.output_tokens ?? 0;
    const totalTokens = usage.totalTokens ?? usage.total_tokens ?? inputTokens + outputTokens;

    return {
      inputTokens,
      outputTokens,
      totalTokens,
    };
  } catch (error) {
    console.warn('[token-counting] Error normalizing usage:', error);
    return {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    };
  }
}
