/**
 * Model pricing utilities for cost estimation.
 *
 * Uses tokenlens v2 via IPC for live pricing data from provider catalogs.
 * All functions are async as they call into the Electron main process.
 */

import { type FullModelId, parseModelId } from './models';

/** Cost estimation result from tokenlens */
export interface CostEstimate {
  inputTokenCostUSD?: number;
  outputTokenCostUSD?: number;
  totalTokenCostUSD: number;
}

/** Cost tier for UI display */
export type CostTier = '$$$' | '$$' | '$';

/** Model pricing data */
export interface ModelPricing {
  inputCostPer1M?: number;
  outputCostPer1M?: number;
}

/**
 * Estimate the cost of a model request based on token counts.
 * Uses tokenlens v2 via IPC for live pricing from provider catalogs.
 *
 * @param fullModelId - The full model ID (provider:modelId format)
 * @param inputTokens - Number of input tokens
 * @param outputTokens - Number of output tokens
 * @returns Estimated cost in USD
 */
export async function estimateCost(
  fullModelId: FullModelId,
  inputTokens: number,
  outputTokens: number
): Promise<CostEstimate> {
  if (typeof window === 'undefined' || !window.electronAPI?.tokenlens) {
    // Running in non-Electron context (SSR, tests)
    return { totalTokenCostUSD: 0 };
  }

  const { modelId, provider } = parseModelId(fullModelId);
  const result = await window.electronAPI.tokenlens.estimateCost(modelId, inputTokens, outputTokens, provider);

  return {
    inputTokenCostUSD: result.inputTokenCostUSD,
    outputTokenCostUSD: result.outputTokenCostUSD,
    totalTokenCostUSD: result.totalTokenCostUSD ?? 0,
  };
}

/**
 * Format a cost value as a human-readable USD string.
 * Examples: "$0.0042", "< $0.0001", "$1.23"
 */
export function formatCost(costUsd: number): string {
  if (costUsd === 0) {
    return '$0.00';
  }

  if (costUsd < 0.0001) {
    return '< $0.0001';
  }

  // Format with appropriate precision
  if (costUsd < 0.01) {
    return `$${costUsd.toFixed(4)}`;
  } else if (costUsd < 1) {
    return `$${costUsd.toFixed(3)}`;
  } else {
    return `$${costUsd.toFixed(2)}`;
  }
}

/**
 * Get the cost tier for a model based on pricing data.
 * Uses tokenlens v2 via IPC for live pricing.
 *
 * - '$' for average < $0.005/1K (budget-friendly)
 * - '$$' for average < $0.02/1K (moderate)
 * - '$$$' for average >= $0.02/1K (premium)
 *
 * @param fullModelId - The full model ID (provider:modelId format)
 */
export async function getCostTier(fullModelId: FullModelId): Promise<CostTier> {
  if (typeof window === 'undefined' || !window.electronAPI?.tokenlens) {
    return '$$'; // Default tier for non-Electron context
  }

  const { modelId, provider } = parseModelId(fullModelId);
  const data = await window.electronAPI.tokenlens.getModelData(modelId, provider);

  if (!data.inputCostPer1M && !data.outputCostPer1M) {
    return '$$'; // Default for unknown models
  }

  // Convert from per-1M to per-1K
  const inputPer1k = (data.inputCostPer1M ?? 0) / 1000;
  const outputPer1k = (data.outputCostPer1M ?? 0) / 1000;

  // Calculate average cost
  const averageCost = (inputPer1k + outputPer1k) / 2;

  if (averageCost < 0.005) {
    return '$';
  } else if (averageCost < 0.02) {
    return '$$';
  } else {
    return '$$$';
  }
}

/**
 * Get the cost tier display label with description.
 */
export function getCostTierLabel(tier: CostTier): { description: string; label: string } {
  switch (tier) {
    case '$':
      return { description: 'Budget-friendly', label: '$' };
    case '$$':
      return { description: 'Moderate cost', label: '$$' };
    case '$$$':
      return { description: 'Premium pricing', label: '$$$' };
  }
}

/**
 * Get pricing information for a model.
 * Uses tokenlens v2 via IPC for live pricing.
 *
 * @param fullModelId - The full model ID (provider:modelId format)
 * @returns Pricing data or null if not available
 */
export async function getPricing(fullModelId: FullModelId): Promise<ModelPricing | null> {
  if (typeof window === 'undefined' || !window.electronAPI?.tokenlens) {
    return null;
  }

  const { modelId, provider } = parseModelId(fullModelId);
  const data = await window.electronAPI.tokenlens.getModelData(modelId, provider);

  if (!data.inputCostPer1M && !data.outputCostPer1M) {
    return null;
  }

  return {
    inputCostPer1M: data.inputCostPer1M,
    outputCostPer1M: data.outputCostPer1M,
  };
}
