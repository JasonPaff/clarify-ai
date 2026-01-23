'use client';

import type { ComponentPropsWithRef } from 'react';

import { Progress } from '@base-ui/react/progress';
import { AlertCircle, CheckCircle2, Coins, Loader2, Sparkles, XCircle } from 'lucide-react';

import type { DiscoveryStatus } from '@/lib/validations/discovery';

import { CancelAiDialog } from '@/components/features/workflow/cancel-ai-dialog';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type AiDiscoveryProgressProps = ComponentPropsWithRef<'div'> & {
  /** Current step text describing what is happening */
  currentStep?: string;
  /** Error message if discovery failed */
  errorMessage?: string;
  /** Total count of files discovered so far */
  filesDiscovered?: number;
  /** Whether the AI operation is currently running */
  isLoading: boolean;
  /** Model name being used for discovery */
  modelName?: string;
  /** Callback when cancel is confirmed */
  onCancel?: () => void;
  /** Overall progress percentage (0-100) */
  percentage?: number;
  /** Current discovery workflow status */
  status: DiscoveryStatus;
  /** Token usage information during operation */
  tokenUsage?: TokenUsage;
};

/** Token usage data for display */
interface TokenUsage {
  /** Estimated completion tokens (output) */
  completionTokens?: number;
  /** Actual cost in USD (if available) */
  cost?: number;
  /** Estimated cost in USD */
  estimatedCost?: number;
  /** Prompt tokens used (input) */
  promptTokens?: number;
  /** Total tokens used */
  totalTokens?: number;
}

/**
 * Formats a number with locale-specific thousand separators.
 */
const formatNumber = (value: number): string => {
  return value.toLocaleString();
};

/**
 * Formats a USD cost value for display.
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
 * Displays progress during the AI-assisted discovery process.
 * Shows overall progress bar, current step text, token usage,
 * file count, and cancel capability with confirmation.
 */
export const AiDiscoveryProgress = ({
  className,
  currentStep,
  errorMessage,
  filesDiscovered = 0,
  isLoading,
  modelName,
  onCancel,
  percentage = 0,
  ref,
  status,
  tokenUsage,
  ...props
}: AiDiscoveryProgressProps) => {
  const isActive = status === 'scanning' || status === 'analyzing';
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';
  const isIdle = status === 'idle';

  // Derived conditions for UI rendering
  const shouldShowFileCount = (isActive || isCompleted) && filesDiscovered > 0;
  const shouldShowTokenUsage = tokenUsage && (tokenUsage.totalTokens || tokenUsage.promptTokens);
  const shouldRender = !isIdle || isLoading;
  const shouldShowIndeterminateProgress = status === 'analyzing' && percentage === 0;
  const shouldShowModelInfo = Boolean(modelName && isActive);
  const shouldShowErrorMessage = isFailed && Boolean(errorMessage);
  const shouldShowCancelButton = isActive && Boolean(onCancel);
  const shouldShowEstimatedCost = tokenUsage?.estimatedCost !== undefined && tokenUsage?.cost === undefined;

  const handleCancelConfirm = () => {
    onCancel?.();
  };

  // Get status-specific text
  const getStatusText = (): string => {
    if (currentStep) return currentStep;

    switch (status) {
      case 'analyzing':
        return 'AI is analyzing repository files...';
      case 'completed':
        return 'AI discovery complete';
      case 'failed':
        return 'AI discovery failed';
      case 'scanning':
        return 'Preparing files for AI analysis...';
      default:
        return 'Ready to start AI discovery';
    }
  };

  // Get status icon
  const renderStatusIcon = () => {
    if (isLoading) {
      return <Sparkles className={'size-4 animate-pulse text-accent'} />;
    }
    if (isCompleted) {
      return <CheckCircle2 className={'size-4 text-green-600 dark:text-green-400'} />;
    }
    if (isFailed) {
      return <XCircle className={'size-4 text-destructive'} />;
    }
    return <Sparkles className={'size-4 text-muted-foreground'} />;
  };

  // Build token usage tooltip content
  const renderTokenTooltipContent = () => {
    if (!tokenUsage) return null;

    return (
      <div className={'space-y-1'}>
        <div className={'font-medium'}>Token Usage</div>
        {tokenUsage.promptTokens !== undefined && (
          <div className={'flex justify-between gap-4'}>
            <span>Input tokens:</span>
            <span>{formatNumber(tokenUsage.promptTokens)}</span>
          </div>
        )}
        {tokenUsage.completionTokens !== undefined && (
          <div className={'flex justify-between gap-4'}>
            <span>Output tokens:</span>
            <span>{formatNumber(tokenUsage.completionTokens)}</span>
          </div>
        )}
        {tokenUsage.totalTokens !== undefined && (
          <div className={'flex justify-between gap-4 border-t border-border/50 pt-1'}>
            <span className={'font-medium'}>Total:</span>
            <span className={'font-medium'}>{formatNumber(tokenUsage.totalTokens)}</span>
          </div>
        )}
        {tokenUsage.cost !== undefined && (
          <div className={'flex justify-between gap-4 pt-1'}>
            <span>Actual cost:</span>
            <span className={'text-green-400'}>{formatCost(tokenUsage.cost)}</span>
          </div>
        )}
        {shouldShowEstimatedCost && (
          <div className={'flex justify-between gap-4 pt-1'}>
            <span>Estimated cost:</span>
            <span className={'text-muted-foreground'}>{formatCost(tokenUsage.estimatedCost!)}</span>
          </div>
        )}
        {modelName && <div className={'border-t border-border/50 pt-1 text-muted-foreground'}>{modelName}</div>}
      </div>
    );
  };

  // Don't render if idle and not loading
  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={cn(
        'rounded-md border border-border bg-linear-to-br from-accent/5 to-transparent p-4',
        isFailed && 'border-destructive/50 from-destructive/5',
        isCompleted && 'border-green-500/30 from-green-500/5',
        className
      )}
      ref={ref}
      {...props}
    >
      {/* Header Section */}
      <div className={'flex items-center justify-between gap-3'}>
        {/* Status and Text */}
        <div className={'flex items-center gap-2'}>
          {renderStatusIcon()}
          <span className={'text-sm font-medium text-foreground'}>{getStatusText()}</span>
        </div>

        {/* Badges */}
        <div className={'flex items-center gap-2'}>
          {/* File Count Badge */}
          {shouldShowFileCount && (
            <span className={'rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent'}>
              {filesDiscovered} {filesDiscovered === 1 ? 'file' : 'files'}
            </span>
          )}

          {/* Token Usage Badge */}
          {shouldShowTokenUsage && (
            <Tooltip content={renderTokenTooltipContent()} side={'bottom'}>
              <span
                className={
                  'inline-flex cursor-default items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'
                }
              >
                <Coins className={'size-3'} />
                {tokenUsage.cost !== undefined ? (
                  <span>{formatCost(tokenUsage.cost)}</span>
                ) : tokenUsage.totalTokens !== undefined ? (
                  <span>{formatNumber(tokenUsage.totalTokens)} tokens</span>
                ) : (
                  <span>{formatNumber(tokenUsage.promptTokens ?? 0)} tokens</span>
                )}
              </span>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Progress Bar Section */}
      {isActive && (
        <div className={'mt-3'}>
          <Progress.Root className={'w-full'} value={percentage}>
            {/* Progress Labels */}
            <div className={'mb-1 flex items-center justify-between'}>
              <Progress.Label className={'text-xs text-muted-foreground'}>Progress</Progress.Label>
              <Progress.Value className={'text-xs text-muted-foreground'} />
            </div>

            {/* Progress Track */}
            <Progress.Track className={'h-2 w-full overflow-hidden rounded-full bg-muted shadow-inner'}>
              <Progress.Indicator
                className={'block h-full bg-linear-to-r from-accent to-accent-hover transition-all duration-300 ease-out'}
              />
            </Progress.Track>
          </Progress.Root>
        </div>
      )}

      {/* Indeterminate Progress for Analysis */}
      {shouldShowIndeterminateProgress && (
        <div className={'mt-3'}>
          <div className={'mb-1 text-xs text-muted-foreground'}>AI is processing...</div>
          <div className={'h-2 w-full overflow-hidden rounded-full bg-muted shadow-inner'}>
            <div
              className={
                'h-full w-1/3 animate-[slide_1.5s_ease-in-out_infinite] bg-linear-to-r from-accent to-accent-hover'
              }
              style={{
                animation: 'slide 1.5s ease-in-out infinite',
              }}
            />
          </div>
          <style>
            {`
              @keyframes slide {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(400%); }
              }
            `}
          </style>
        </div>
      )}

      {/* Model Info Section */}
      {shouldShowModelInfo && (
        <div className={'mt-2 flex items-center gap-1 text-xs text-muted-foreground'}>
          <Sparkles className={'size-3'} />
          <span>Using {modelName}</span>
        </div>
      )}

      {/* Error Message Section */}
      {shouldShowErrorMessage && (
        <div
          className={
            'mt-3 flex items-start gap-2 rounded-sm border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive'
          }
        >
          <AlertCircle className={'mt-0.5 size-3 shrink-0'} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Spinner for Loading State */}
      {isLoading && (
        <div className={'mt-3 flex items-center gap-2 text-xs text-muted-foreground'}>
          <Loader2 className={'size-3 animate-spin'} />
          <span>AI is working on your request...</span>
        </div>
      )}

      {/* Cancel Button Section */}
      {shouldShowCancelButton && (
        <div className={'mt-4'}>
          <CancelAiDialog onConfirm={handleCancelConfirm} stepName={'AI Discovery'}>
            <Button size={'sm'} variant={'outline'}>
              Cancel
            </Button>
          </CancelAiDialog>
        </div>
      )}
    </div>
  );
};
