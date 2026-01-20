/**
 * Shared AI utility functions for IPC handlers.
 *
 * This module provides common AI-related utilities used across multiple
 * AI handler files to avoid code duplication.
 */

import type { ApiKeyProvider } from './provider-types';

// ============================================================================
// Constants
// ============================================================================

/** Default thinking budget in tokens for models that support extended thinking */
export const DEFAULT_THINKING_BUDGET = 10000;

// ============================================================================
// Thinking/Reasoning Provider Options
// ============================================================================

/**
 * Build provider options to enable thinking/reasoning for supported models.
 *
 * Each AI provider has different configuration requirements for enabling
 * extended thinking or reasoning capabilities:
 * - Anthropic: Uses `thinking.budgetTokens` with type 'enabled'
 * - Google: Uses `thinkingConfig` with `includeThoughts` and `thinkingBudget`
 * - OpenAI: Uses `reasoningEffort` with effort level
 *
 * @param provider - The AI provider type
 * @param shouldEnableThinking - Whether thinking should be enabled (based on model support AND user preference)
 * @returns Provider-specific options object or undefined if thinking should not be enabled
 *
 * @example
 * const options = buildThinkingProviderOptions('anthropic', true);
 * // => { anthropic: { thinking: { budgetTokens: 10000, type: 'enabled' } } }
 *
 * @example
 * const options = buildThinkingProviderOptions('openai', false);
 * // => undefined
 */
export function buildThinkingProviderOptions(
  provider: ApiKeyProvider,
  shouldEnableThinking: boolean
): Record<string, unknown> | undefined {
  if (!shouldEnableThinking) {
    return undefined;
  }

  switch (provider) {
    case 'anthropic':
      return {
        anthropic: {
          thinking: { budgetTokens: DEFAULT_THINKING_BUDGET, type: 'enabled' },
        },
      };
    case 'google':
      return {
        google: {
          thinkingConfig: { includeThoughts: true, thinkingBudget: DEFAULT_THINKING_BUDGET },
        },
      };
    case 'openai':
      return {
        openai: { reasoningEffort: 'medium' },
      };
    default:
      return undefined;
  }
}
