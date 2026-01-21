'use client';

import type { ComponentPropsWithRef } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, Calculator, Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { costFromUsage, modelMeta } from 'tokenlens';

import type { FullModelId } from '@/lib/ai/models';

import { Tooltip } from '@/components/ui/tooltip';
import { DEFAULT_CLARIFICATION_PROMPT } from '@/lib/ai/prompts/clarification';
import { cn } from '@/lib/utils';

/** Cost warning threshold in USD */
const COST_WARNING_THRESHOLD = 0.1;

/** Estimated average output tokens for clarification (questions + analysis) */
const ESTIMATED_OUTPUT_TOKENS = 2000;

/** Approximate characters per token (conservative estimate) */
const CHARS_PER_TOKEN = 4;

/**
 * Estimates token count from text content.
 * Uses chars/4 heuristic which is a conservative approximation.
 */
const estimateTokensFromText = (text: string): number => {
  if (!text) {
    return 0;
  }
  return Math.ceil(text.length / CHARS_PER_TOKEN);
};

/**
 * Formats a USD value for display.
 */
const formatCost = (cost: number): string => {
  if (cost < 0.001) {
    return '< $0.001';
  }
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }
  return `$${cost.toFixed(3)}`;
};

/**
 * Formats a number with locale-specific thousand separators.
 */
const formatNumber = (value: number): string => {
  return value.toLocaleString();
};

export const costEstimateVariants = cva(
  `
    transition-colors duration-200
  `,
  {
    compoundVariants: [
      {
        className: 'border-border bg-muted/30',
        status: 'normal',
        variant: 'full',
      },
      {
        className: 'border-amber-500/50 bg-amber-500/5',
        status: 'warning',
        variant: 'full',
      },
      {
        className: 'text-muted-foreground',
        status: 'normal',
        variant: 'compact',
      },
      {
        className: 'text-amber-600 dark:text-amber-400',
        status: 'warning',
        variant: 'compact',
      },
    ],
    defaultVariants: {
      status: 'normal',
      variant: 'full',
    },
    variants: {
      status: {
        normal: '',
        warning: '',
      },
      variant: {
        compact: 'inline-flex items-center gap-1.5 text-xs',
        full: 'rounded-md border p-3',
      },
    },
  }
);

interface ClarificationCostEstimateProps
  extends Omit<ComponentPropsWithRef<'div'>, 'children'>, VariantProps<typeof costEstimateVariants> {
  featureRequestContent: string;
  isLoading?: boolean;
  modelId: FullModelId | null;
}

export const ClarificationCostEstimate = ({
  className,
  featureRequestContent,
  isLoading = false,
  modelId,
  ref,
  variant = 'full',
  ...props
}: ClarificationCostEstimateProps) => {
  const estimateData = useMemo(() => {
    if (!modelId) {
      return null;
    }

    // Get model metadata from tokenlens
    // Convert our FullModelId format (provider:modelId) to tokenlens format
    const meta = modelMeta(modelId);

    // Calculate input tokens from feature request + system prompt
    const featureRequestTokens = estimateTokensFromText(featureRequestContent);
    const systemPromptTokens = estimateTokensFromText(DEFAULT_CLARIFICATION_PROMPT);
    const totalInputTokens = featureRequestTokens + systemPromptTokens;

    // Estimate cost using tokenlens
    const rawCost = costFromUsage({
      id: modelId,
      usage: {
        completion_tokens: ESTIMATED_OUTPUT_TOKENS,
        prompt_tokens: totalInputTokens,
      },
    });
    // Normalize null/undefined to null for consistent handling
    const estimatedCost = rawCost ?? null;

    // Check if cost exceeds warning threshold
    const isWarning = estimatedCost !== null && estimatedCost > COST_WARNING_THRESHOLD;

    return {
      displayName: meta?.displayName ?? modelId.split(':').pop() ?? 'Unknown Model',
      estimatedCost,
      estimatedOutputTokens: ESTIMATED_OUTPUT_TOKENS,
      featureRequestTokens,
      hasPricing: meta?.pricePerTokenIn !== undefined && meta?.pricePerTokenOut !== undefined,
      isWarning,
      systemPromptTokens,
      totalInputTokens,
    };
  }, [modelId, featureRequestContent]);

  // Don't render if no model is configured
  if (!modelId) {
    return null;
  }

  // Loading state
  if (isLoading) {
    const isCompactVariant = variant === 'compact';

    if (isCompactVariant) {
      return (
        <div
          className={cn(costEstimateVariants({ status: 'normal', variant: 'compact' }), className)}
          ref={ref}
          {...props}
        >
          <Loader2 className={'size-3 animate-spin'} />
          <span>Calculating...</span>
        </div>
      );
    }

    return (
      <div className={cn(costEstimateVariants({ status: 'normal', variant: 'full' }), className)} ref={ref} {...props}>
        <div className={'flex items-center gap-2'}>
          <Loader2 className={'size-4 animate-spin text-muted-foreground'} />
          <span className={'text-sm text-muted-foreground'}>Calculating estimate...</span>
        </div>
      </div>
    );
  }

  // No estimate data available
  if (!estimateData) {
    return null;
  }

  const {
    displayName,
    estimatedCost,
    estimatedOutputTokens,
    featureRequestTokens,
    hasPricing,
    isWarning,
    systemPromptTokens,
    totalInputTokens,
  } = estimateData;

  const isCostAvailable = hasPricing && estimatedCost !== null;
  const formattedCost = estimatedCost !== null ? formatCost(estimatedCost) : null;
  const statusValue = isWarning ? 'warning' : 'normal';

  // Compact variant - inline display with tooltip for details
  if (variant === 'compact') {
    const tooltipContent = (
      <div className={'space-y-1'}>
        <div className={'font-medium'}>Cost Estimate</div>
        <div className={'flex justify-between gap-4'}>
          <span>Input tokens:</span>
          <span>~{formatNumber(totalInputTokens)}</span>
        </div>
        <div className={'flex justify-between gap-4'}>
          <span>Output tokens:</span>
          <span>~{formatNumber(estimatedOutputTokens)}</span>
        </div>
        <div className={'border-t border-border/50 pt-1 text-muted-foreground'}>{displayName}</div>
        {isWarning && <div className={'pt-1 text-amber-400'}>High cost estimate</div>}
      </div>
    );

    return (
      <Tooltip content={tooltipContent} side={'bottom'}>
        <div
          className={cn(costEstimateVariants({ status: statusValue, variant: 'compact' }), className)}
          ref={ref}
          {...props}
        >
          <Calculator className={'size-3'} />
          {isCostAvailable ? (
            <span>~{formattedCost} est.</span>
          ) : (
            <span>~{formatNumber(totalInputTokens + estimatedOutputTokens)} tokens</span>
          )}
          {isWarning && <AlertCircle className={'size-3'} />}
        </div>
      </Tooltip>
    );
  }

  // Full variant - detailed breakdown
  return (
    <div className={cn(costEstimateVariants({ status: statusValue, variant: 'full' }), className)} ref={ref} {...props}>
      {/* Header */}
      <div className={'mb-2 flex items-center justify-between'}>
        {/* Title with Icon */}
        <div className={'flex items-center gap-2'}>
          <Calculator className={'size-4 text-muted-foreground'} />
          <span className={'text-sm font-medium'}>Cost Estimate</span>
        </div>

        {/* Cost Display */}
        {isCostAvailable ? (
          <span className={cn('text-sm font-medium', isWarning && 'text-amber-600 dark:text-amber-400')}>
            {formattedCost}
          </span>
        ) : (
          <span className={'text-sm text-muted-foreground'}>Pricing unavailable</span>
        )}
      </div>

      {/* Token Breakdown */}
      <div className={'space-y-1 text-xs text-muted-foreground'}>
        <div className={'flex justify-between'}>
          <span>Feature request</span>
          <span>~{formatNumber(featureRequestTokens)} tokens</span>
        </div>
        <div className={'flex justify-between'}>
          <span>System prompt</span>
          <span>~{formatNumber(systemPromptTokens)} tokens</span>
        </div>
        <div className={'flex justify-between border-t border-border pt-1'}>
          <span className={'font-medium'}>Estimated input</span>
          <span className={'font-medium'}>~{formatNumber(totalInputTokens)} tokens</span>
        </div>
        <div className={'flex justify-between'}>
          <span>Estimated output</span>
          <span>~{formatNumber(estimatedOutputTokens)} tokens</span>
        </div>
      </div>

      {/* Model Info */}
      <div className={'mt-2 text-xs text-muted-foreground'}>Using {displayName}</div>

      {/* Warning Message */}
      {isWarning && (
        <div
          className={
            'mt-2 flex items-start gap-2 rounded-sm border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-600 dark:text-amber-400'
          }
        >
          <AlertCircle className={'mt-0.5 size-3 shrink-0'} />
          <span>
            <strong>High estimated cost.</strong> This request may cost more than $0.10. Consider using a smaller model
            or reducing the feature request length.
          </span>
        </div>
      )}

      {/* Estimation Notice */}
      <div className={'mt-2 text-xs text-muted-foreground italic'}>
        * Token counts are estimates. Actual usage and cost may vary based on model response.
      </div>
    </div>
  );
};
