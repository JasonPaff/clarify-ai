'use client';

import type { ComponentPropsWithRef } from 'react';

import { Progress } from '@base-ui/react/progress';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useMemo } from 'react';

import type { FeatureRequestContextFile } from '@/db/schema/feature-request-context-files.schema';

import { cn } from '@/lib/utils';

/** Base prompt overhead in tokens (system prompt, instructions, etc.) */
const BASE_PROMPT_OVERHEAD_TOKENS = 2000;

/** Approximate chars per token ratio (conservative estimate) */
const CHARS_PER_TOKEN = 4;

/** Maximum reasonable file size for token estimation (100MB) */
const MAX_REASONABLE_FILE_SIZE_BYTES = 100 * 1024 * 1024;

/**
 * Estimates tokens from byte size.
 * Uses chars/4 heuristic which is a conservative approximation.
 * Handles edge cases like invalid or extremely large values.
 */
const estimateTokensFromBytes = (bytes: number): number => {
  // Handle invalid values
  if (!Number.isFinite(bytes) || bytes < 0) {
    return 0;
  }

  // Cap extremely large file sizes to prevent UI issues
  const cappedBytes = Math.min(bytes, MAX_REASONABLE_FILE_SIZE_BYTES);

  // Assume UTF-8 encoding where most chars are 1 byte
  return Math.ceil(cappedBytes / CHARS_PER_TOKEN);
};

/**
 * Formats a number with locale-specific thousand separators.
 */
const formatNumber = (value: number): string => {
  return value.toLocaleString();
};

export const tokenEstimationVariants = cva(
  `
    rounded-md border p-4
    transition-colors duration-200
  `,
  {
    defaultVariants: {
      status: 'safe',
    },
    variants: {
      status: {
        error: 'border-destructive/50 bg-destructive/5',
        safe: 'border-border bg-card',
        warning: 'border-amber-500/50 bg-amber-500/5',
      },
    },
  }
);

export const progressIndicatorVariants = cva(
  `
    block h-full transition-all duration-300
  `,
  {
    defaultVariants: {
      status: 'safe',
    },
    variants: {
      status: {
        error: 'bg-destructive',
        safe: 'bg-green-500',
        warning: 'bg-amber-500',
      },
    },
  }
);

interface ContextFile {
  sizeBytes: number;
}

interface TokenEstimationWarningProps
  extends Omit<ComponentPropsWithRef<'div'>, 'children'>,
    VariantProps<typeof tokenEstimationVariants> {
  contextFiles: Array<ContextFile | FeatureRequestContextFile>;
  modelContextLimit: number;
  repositoryOverviewTokens?: number;
}

type TokenStatus = 'error' | 'safe' | 'warning';

export const TokenEstimationWarning = ({
  className,
  contextFiles,
  modelContextLimit,
  ref,
  repositoryOverviewTokens = 0,
  ...props
}: TokenEstimationWarningProps) => {
  const tokenData = useMemo(() => {
    // Handle edge case: invalid model context limit
    const safeModelContextLimit =
      Number.isFinite(modelContextLimit) && modelContextLimit > 0 ? modelContextLimit : 200000;

    // Handle edge case: invalid repository overview tokens (fallback to 0)
    const safeRepositoryOverviewTokens =
      Number.isFinite(repositoryOverviewTokens) && repositoryOverviewTokens >= 0 ? repositoryOverviewTokens : 0;

    // Calculate tokens from context files, handling potential invalid values
    const contextFileTokens = contextFiles.reduce((total, file) => {
      const sizeBytes = 'sizeBytes' in file ? file.sizeBytes : 0;
      return total + estimateTokensFromBytes(sizeBytes);
    }, 0);

    // Flag if using fallback estimation (tokenlens failed and we're using byte-based)
    const isUsingFallbackEstimation = safeRepositoryOverviewTokens === 0 && contextFiles.length > 0;

    // Total estimated tokens
    const totalTokens = contextFileTokens + safeRepositoryOverviewTokens + BASE_PROMPT_OVERHEAD_TOKENS;

    // Calculate percentage
    const percentage = Math.min((totalTokens / safeModelContextLimit) * 100, 100);

    // Determine status based on thresholds
    let status: TokenStatus = 'safe';
    if (percentage >= 100) {
      status = 'error';
    } else if (percentage >= 80) {
      status = 'warning';
    }

    return {
      contextFileTokens,
      isUsingFallbackEstimation,
      percentage,
      status,
      totalTokens,
    };
  }, [contextFiles, repositoryOverviewTokens, modelContextLimit]);

  const { contextFileTokens, isUsingFallbackEstimation, percentage, status, totalTokens } = tokenData;

  const isError = status === 'error';
  const isWarning = status === 'warning';

  // Don't render if there's no context to estimate
  const hasNoContext = contextFiles.length === 0 && repositoryOverviewTokens === 0;
  if (hasNoContext) {
    return null;
  }

  return (
    <div className={cn(tokenEstimationVariants({ status }), className)} ref={ref} {...props}>
      {/* Header */}
      <div className={'mb-3 flex items-center justify-between'}>
        {/* Title with Status Icon */}
        <div className={'flex items-center gap-2'}>
          {isError ? (
            <AlertCircle className={'size-4 text-destructive'} />
          ) : isWarning ? (
            <AlertTriangle className={'size-4 text-amber-500'} />
          ) : (
            <CheckCircle2 className={'size-4 text-green-500'} />
          )}
          <span className={'text-sm font-medium'}>Context Token Estimation</span>
        </div>

        {/* Token Count */}
        <span className={'text-sm text-muted-foreground'}>
          {formatNumber(totalTokens)} / {formatNumber(modelContextLimit)} tokens
        </span>
      </div>

      {/* Progress Bar */}
      <Progress.Root className={'mb-3'} max={100} value={percentage}>
        <Progress.Track
          className={'h-2 w-full overflow-hidden rounded-full bg-muted'}
        >
          <Progress.Indicator
            className={cn(progressIndicatorVariants({ status }))}
            style={{ width: `${percentage}%` }}
          />
        </Progress.Track>
      </Progress.Root>

      {/* Token Breakdown */}
      <div className={'space-y-1 text-xs text-muted-foreground'}>
        <div className={'flex justify-between'}>
          <span>Context files ({contextFiles.length})</span>
          <span>{formatNumber(contextFileTokens)} tokens</span>
        </div>
        {repositoryOverviewTokens > 0 && (
          <div className={'flex justify-between'}>
            <span>Repository overview</span>
            <span>{formatNumber(repositoryOverviewTokens)} tokens</span>
          </div>
        )}
        <div className={'flex justify-between'}>
          <span>Base prompt overhead</span>
          <span>{formatNumber(BASE_PROMPT_OVERHEAD_TOKENS)} tokens</span>
        </div>
      </div>

      {/* Fallback estimation notice */}
      {isUsingFallbackEstimation && (
        <div className={'mt-2 text-xs text-muted-foreground italic'}>
          * Token counts are estimated using file size. Actual token usage may vary.
        </div>
      )}

      {/* Warning/Error Messages */}
      {isError && (
        <div className={'mt-3 rounded-sm border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive'}>
          <strong>Context limit exceeded.</strong> Remove some files or reduce content to proceed. The AI request may
          fail or truncate important context.
        </div>
      )}
      {isWarning && (
        <div
          className={'mt-3 rounded-sm border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-600 dark:text-amber-400'}
        >
          <strong>Approaching context limit.</strong> Consider removing unnecessary files to ensure optimal AI
          performance.
        </div>
      )}
    </div>
  );
};
