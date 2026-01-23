'use client';

import type { ComponentPropsWithRef } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import { AlertTriangle, Settings, Sparkles } from 'lucide-react';

import { AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Formats a number with locale-specific thousand separators.
 */
const formatNumber = (value: number): string => {
  return value.toLocaleString();
};

export const aiDiscoveryCostWarningVariants = cva(
  `
    relative flex w-full flex-col gap-3 rounded-md border p-4 text-sm
    focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0 focus-visible:outline-none
  `,
  {
    defaultVariants: {
      severity: 'warning',
    },
    variants: {
      severity: {
        critical: 'border-destructive/50 bg-destructive/10',
        warning: 'border-amber-500/50 bg-amber-500/10',
      },
    },
  }
);

interface AiDiscoveryCostWarningProps
  extends Omit<ComponentPropsWithRef<'div'>, 'children'>,
    VariantProps<typeof aiDiscoveryCostWarningVariants> {
  /** Configured token budget limit */
  budgetLimit: number;
  /** Estimated token count from pruned file tree */
  estimatedTokens: number;
  /** Whether the warning is dismissed */
  isDismissed?: boolean;
  /** Callback when "Adjust Scope" button is clicked */
  onAdjustScope?: () => void;
  /** Callback when "Proceed Anyway" button is clicked */
  onProceedAnyway?: () => void;
}

export const AiDiscoveryCostWarning = ({
  budgetLimit,
  className,
  estimatedTokens,
  isDismissed = false,
  onAdjustScope,
  onProceedAnyway,
  ref,
  severity,
  ...props
}: AiDiscoveryCostWarningProps) => {
  // Calculate how much over budget
  const overageAmount = estimatedTokens - budgetLimit;
  const overagePercentage = Math.round((overageAmount / budgetLimit) * 100);

  // Determine severity if not explicitly provided
  const isOverBudget = estimatedTokens > budgetLimit;
  const isCritical = overagePercentage > 50;
  const resolvedSeverity = severity ?? (isCritical ? 'critical' : 'warning');

  // Derived conditions for rendering
  const shouldRender = isOverBudget && !isDismissed;
  const shouldShowAdjustScope = Boolean(onAdjustScope);
  const shouldShowProceedAnyway = Boolean(onProceedAnyway);
  const shouldShowActions = shouldShowAdjustScope || shouldShowProceedAnyway;

  // Event handlers
  const handleAdjustScopeClick = () => {
    onAdjustScope?.();
  };

  const handleProceedAnywayClick = () => {
    onProceedAnyway?.();
  };

  // Don't render if not over budget or dismissed
  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={cn(aiDiscoveryCostWarningVariants({ severity: resolvedSeverity }), className)}
      ref={ref}
      role={'alert'}
      {...props}
    >
      {/* Header Section */}
      <div className={'flex items-start gap-3'}>
        {/* Warning Icon */}
        <AlertTriangle
          className={cn(
            'mt-0.5 size-5 shrink-0',
            resolvedSeverity === 'critical' ? 'text-destructive' : 'text-amber-600 dark:text-amber-400'
          )}
        />

        {/* Content */}
        <div className={'flex-1 space-y-2'}>
          {/* Title */}
          <AlertTitle
            className={cn(
              'leading-none font-semibold',
              resolvedSeverity === 'critical' ? 'text-destructive' : 'text-amber-600 dark:text-amber-400'
            )}
          >
            {resolvedSeverity === 'critical' ? 'Token Budget Significantly Exceeded' : 'Token Budget Exceeded'}
          </AlertTitle>

          {/* Description */}
          <AlertDescription
            className={cn(
              'text-sm',
              resolvedSeverity === 'critical'
                ? 'text-destructive/90'
                : 'text-amber-700/90 dark:text-amber-300/90'
            )}
          >
            The pruned file tree contains approximately{' '}
            <strong className={'font-semibold'}>{formatNumber(estimatedTokens)}</strong> tokens, which exceeds your
            configured budget of <strong className={'font-semibold'}>{formatNumber(budgetLimit)}</strong> tokens by{' '}
            <strong className={'font-semibold'}>
              {formatNumber(overageAmount)} ({overagePercentage}%)
            </strong>
            .
          </AlertDescription>

          {/* Suggestions */}
          <div
            className={cn(
              'mt-3 space-y-1 text-xs',
              resolvedSeverity === 'critical'
                ? 'text-destructive/80'
                : 'text-amber-700/80 dark:text-amber-300/80'
            )}
          >
            <div className={'font-medium'}>To reduce token usage, consider:</div>
            <ul className={'ml-4 list-disc space-y-0.5'}>
              <li>Adding more file exclusion patterns</li>
              <li>Selecting fewer repositories</li>
              <li>Excluding large directories or file types</li>
              <li>Increasing your token budget in settings</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Buttons Section */}
      {shouldShowActions && (
        <div className={'mt-2 flex items-center gap-2'}>
          {shouldShowAdjustScope && (
            <Button onClick={handleAdjustScopeClick} size={'sm'} variant={'outline'}>
              <Settings className={'size-4'} />
              Adjust Scope
            </Button>
          )}

          {shouldShowProceedAnyway && (
            <Button
              onClick={handleProceedAnywayClick}
              size={'sm'}
              variant={resolvedSeverity === 'critical' ? 'destructive' : 'secondary'}
            >
              <Sparkles className={'size-4'} />
              Proceed Anyway
            </Button>
          )}
        </div>
      )}

      {/* Cost Notice */}
      <div
        className={cn(
          'mt-1 text-xs italic',
          resolvedSeverity === 'critical' ? 'text-destructive/70' : 'text-amber-600/70 dark:text-amber-400/70'
        )}
      >
        * Proceeding may result in higher API costs or incomplete analysis.
      </div>
    </div>
  );
};
