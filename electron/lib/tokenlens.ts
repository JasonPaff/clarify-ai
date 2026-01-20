/**
 * Tokenlens client for Electron main process.
 *
 * This module provides tokenlens v2 integration for the main process only.
 * It cannot be imported in renderer code (Next.js) as tokenlens requires Node.js.
 *
 * Uses the OpenRouter catalog as the primary data source with 1-hour caching.
 */

import { countTokens as tokenlensCountTokens, createTokenlens } from 'tokenlens';

/**
 * Singleton tokenlens instance configured with:
 * - OpenRouter catalog for comprehensive model coverage
 * - 1-hour TTL for cached provider data
 */
export const tokenlens = createTokenlens({
  catalog: 'openrouter',
  ttlMs: 60 * 60 * 1000, // 1 hour cache
});

/**
 * Estimate the cost of a model request using tokenlens v2.
 * Falls back to 0 if tokenlens lookup fails.
 *
 * @param modelId - The model ID
 * @param inputTokens - Number of input tokens
 * @param outputTokens - Number of output tokens
 * @param provider - Optional provider name for accurate lookup
 * @returns Estimated cost in USD
 */
export async function estimateCostWithTokenlens(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
  provider?: string
): Promise<number> {
  try {
    const result = await tokenlens.computeCostUSD({
      modelId,
      provider,
      usage: { input_tokens: inputTokens, output_tokens: outputTokens },
    });

    if (result.totalTokenCostUSD !== undefined) {
      return result.totalTokenCostUSD;
    }
  } catch (error) {
    console.warn('[tokenlens] Cost lookup failed:', error);
  }

  return 0;
}

/**
 * Get context window limit for a model using tokenlens v2.
 *
 * @param modelId - The model ID
 * @param provider - Optional provider name for accurate lookup
 * @returns Context window limit in tokens, or null if not found
 */
export async function getContextWindowWithTokenlens(
  modelId: string,
  provider?: string
): Promise<null | number> {
  try {
    const limits = await tokenlens.getContextLimits({ modelId, provider });

    if (limits?.context) {
      return limits.context;
    }
  } catch (error) {
    console.warn('[tokenlens] Context lookup failed:', error);
  }

  return null;
}

/**
 * Count tokens in a text string using tokenlens v2.
 * Uses the actual tokenizer for the model (OpenAI tiktoken, Anthropic, Google).
 *
 * @param modelId - The model ID (e.g., "gpt-4o", "claude-sonnet-4-5")
 * @param text - The text to count tokens for
 * @returns Token count, or undefined if counting fails
 */
export async function countTokensWithTokenlens(
  modelId: string,
  text: string
): Promise<number | undefined> {
  try {
    return await tokenlensCountTokens({ data: text, modelId });
  } catch (error) {
    console.warn('[tokenlens] Token counting failed:', error);
    return undefined;
  }
}
