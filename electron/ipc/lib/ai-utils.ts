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
 * Options returned by buildThinkingStreamOptions for use with streamText.
 */
export interface ThinkingStreamOptions {
  providerOptions?: Record<string, unknown>;
  temperature?: number;
}

// ============================================================================
// Stream Options Builder
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
 * @param customBudget - Optional custom thinking budget in tokens (defaults to DEFAULT_THINKING_BUDGET)
 * @returns Provider-specific options object or undefined if thinking should not be enabled
 *
 * @example
 * const options = buildThinkingProviderOptions('anthropic', true);
 * // => { anthropic: { thinking: { budgetTokens: 10000, type: 'enabled' } } }
 *
 * @example
 * const options = buildThinkingProviderOptions('anthropic', true, 20000);
 * // => { anthropic: { thinking: { budgetTokens: 20000, type: 'enabled' } } }
 *
 * @example
 * const options = buildThinkingProviderOptions('openai', false);
 * // => undefined
 */
export function buildThinkingProviderOptions(
  provider: ApiKeyProvider,
  shouldEnableThinking: boolean,
  customBudget?: number
): Record<string, unknown> | undefined {
  if (!shouldEnableThinking) {
    return undefined;
  }

  const budget = customBudget ?? DEFAULT_THINKING_BUDGET;

  switch (provider) {
    case 'anthropic':
      return {
        anthropic: {
          thinking: { budgetTokens: budget, type: 'enabled' },
        },
      };
    case 'google':
      return {
        google: {
          thinkingConfig: { includeThoughts: true, thinkingBudget: budget },
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

/**
 * Build stream options including provider-specific thinking configuration and temperature.
 *
 * This function handles the incompatibility between temperature and thinking mode
 * for certain providers (notably Anthropic, which does not support temperature
 * when extended thinking is enabled).
 *
 * @param provider - The AI provider type
 * @param shouldEnableThinking - Whether thinking should be enabled (based on model support AND user preference)
 * @param temperature - Optional temperature setting from the request
 * @param customBudget - Optional custom thinking budget in tokens (defaults to DEFAULT_THINKING_BUDGET)
 * @returns Object with providerOptions and/or temperature to spread into streamText call
 *
 * @example
 * const options = buildThinkingStreamOptions('anthropic', true, 0.7);
 * // => { providerOptions: { anthropic: { thinking: { ... } } } }
 * // Note: temperature is NOT included because Anthropic doesn't support it with thinking
 *
 * @example
 * const options = buildThinkingStreamOptions('google', true, 0.7);
 * // => { providerOptions: { google: { thinkingConfig: { ... } } }, temperature: 0.7 }
 *
 * @example
 * const options = buildThinkingStreamOptions('anthropic', false, 0.7);
 * // => { temperature: 0.7 }
 */
export function buildThinkingStreamOptions(
  provider: ApiKeyProvider,
  shouldEnableThinking: boolean,
  temperature?: number,
  customBudget?: number
): ThinkingStreamOptions {
  const result: ThinkingStreamOptions = {};

  if (shouldEnableThinking) {
    const providerOptions = buildThinkingProviderOptions(provider, true, customBudget);
    if (providerOptions) {
      result.providerOptions = providerOptions;
    }
    // Anthropic does NOT support temperature when thinking is enabled
    if (provider !== 'anthropic' && temperature !== undefined) {
      result.temperature = temperature;
    }
  } else {
    if (temperature !== undefined) {
      result.temperature = temperature;
    }
  }

  return result;
}
