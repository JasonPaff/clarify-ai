'use client';

import type { ComponentPropsWithRef } from 'react';

import { Collapsible as BaseCollapsible } from '@base-ui/react/collapsible';
import { cva, type VariantProps } from 'class-variance-authority';
import { Activity, ChevronDown, Clock, DollarSign } from 'lucide-react';

import { formatCost } from '@/lib/ai/pricing';
import { cn } from '@/lib/utils';

/**
 * Format token count for display
 * Examples: "1,234", "12.5k"
 */
const formatTokens = (tokens: number): string => {
  if (tokens >= 10000) {
    return `${(tokens / 1000).toFixed(1)}k`;
  }
  return tokens.toLocaleString();
};

/**
 * Format duration in milliseconds for display
 * Examples: "1.2s", "0.5s", "2.0s"
 */
const formatDuration = (ms: number): string => {
  const seconds = ms / 1000;
  return `${seconds.toFixed(1)}s`;
};

/**
 * Get the cost color class based on the cost amount
 * - < $0.01 -> green (low cost)
 * - $0.01 - $0.10 -> yellow (moderate cost)
 * - > $0.10 -> orange/red (high cost)
 */
const getCostColorClass = (costUsd: number): string => {
  if (costUsd < 0.01) {
    return 'text-green-600 dark:text-green-400';
  } else if (costUsd <= 0.1) {
    return 'text-yellow-600 dark:text-yellow-400';
  } else {
    return 'text-orange-600 dark:text-orange-400';
  }
};

export const usageFooterVariants = cva(
  `
    border-t border-border bg-muted/50 text-muted-foreground
    transition-colors
    focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0 focus-visible:outline-none
  `,
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        compact: 'px-3 py-1.5 text-xs',
        default: 'px-4 py-2 text-sm',
      },
    },
  }
);

interface UsageFooterProps
  extends Omit<ComponentPropsWithRef<'div'>, 'children'>, VariantProps<typeof usageFooterVariants> {
  costUsd: number;
  durationMs: number;
  inputTokens: number;
  isCollapsible?: boolean;
  outputTokens: number;
  reasoningTokens?: number;
  totalTokens: number;
}

export const UsageFooter = ({
  className,
  costUsd,
  durationMs,
  inputTokens,
  isCollapsible = false,
  outputTokens,
  reasoningTokens,
  ref,
  totalTokens,
  variant = 'default',
  ...props
}: UsageFooterProps) => {
  const costColorClass = getCostColorClass(costUsd);
  const isCompact = variant === 'compact';
  const reasoningDisplay = reasoningTokens ? ` | Reasoning: ${formatTokens(reasoningTokens)}` : '';

  /* Summary Line */
  const summaryContent = (
    <div className={'flex items-center gap-4'}>
      {/* Cost */}
      <div className={'flex items-center gap-1.5'}>
        <DollarSign aria-hidden={'true'} className={cn('size-3.5', costColorClass)} />
        <span className={cn('font-medium', costColorClass)}>{formatCost(costUsd)}</span>
      </div>

      {/* Duration */}
      <div className={'flex items-center gap-1.5'}>
        <Clock aria-hidden={'true'} className={'size-3.5'} />
        <span>{formatDuration(durationMs)}</span>
      </div>
    </div>
  );

  /* Token Details */
  const tokenDetailsContent = (
    <div className={'flex items-center gap-1.5'}>
      <Activity aria-hidden={'true'} className={'size-3.5'} />
      <span>
        Input: {formatTokens(inputTokens)} | Output: {formatTokens(outputTokens)}
        {reasoningDisplay} | Total: {formatTokens(totalTokens)} tokens
      </span>
    </div>
  );

  /* Collapsible Version */
  if (isCollapsible) {
    return (
      <BaseCollapsible.Root defaultOpen={!isCompact}>
        <div className={cn(usageFooterVariants({ className, variant }))} ref={ref} {...props}>
          {/* Collapsible Trigger */}
          <BaseCollapsible.Trigger
            className={'flex w-full cursor-pointer items-center justify-between gap-4 focus-visible:outline-none'}
          >
            {summaryContent}
            <ChevronDown
              aria-hidden={'true'}
              className={'size-4 transition-transform duration-200 ease-out group-data-panel-open:rotate-180'}
            />
          </BaseCollapsible.Trigger>

          {/* Collapsible Content */}
          <BaseCollapsible.Panel
            className={
              'flex h-(--collapsible-panel-height) flex-col overflow-hidden transition-all duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0'
            }
          >
            <div className={'mt-2 border-t border-border/50 pt-2'}>{tokenDetailsContent}</div>
          </BaseCollapsible.Panel>
        </div>
      </BaseCollapsible.Root>
    );
  }

  /* Non-Collapsible Version */
  if (isCompact) {
    return (
      <div className={cn(usageFooterVariants({ className, variant }))} ref={ref} {...props}>
        {summaryContent}
      </div>
    );
  }

  return (
    <div className={cn(usageFooterVariants({ className, variant }))} ref={ref} {...props}>
      <div className={'flex flex-wrap items-center justify-between gap-4'}>
        {summaryContent}
        {tokenDetailsContent}
      </div>
    </div>
  );
};
