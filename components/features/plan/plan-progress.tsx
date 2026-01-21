'use client';

import type { ComponentPropsWithRef } from 'react';

import { Progress } from '@base-ui/react/progress';
import { CheckCircle2, ClipboardList, Loader2, XCircle } from 'lucide-react';

import type { PlanStatus } from '@/lib/validations/plan';

import { CancelAiDialog } from '@/components/features/workflow/cancel-ai-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PlanProgressProps = ComponentPropsWithRef<'div'> & {
  /** Current step text describing what is happening */
  currentStep?: string;
  /** Whether the plan generation process is currently running */
  isLoading: boolean;
  /** Callback when cancel is confirmed */
  onCancel?: () => void;
  /** Overall progress percentage (0-100) */
  percentage?: number;
  /** Current plan workflow status */
  status: PlanStatus;
};

/**
 * Displays progress during the AI plan generation process.
 * Shows overall progress bar, current step text, status icons,
 * and provides cancel capability for long-running operations.
 */
export const PlanProgress = ({
  className,
  currentStep,
  isLoading,
  onCancel,
  percentage = 0,
  ref,
  status,
  ...props
}: PlanProgressProps) => {
  const isActive = status === 'generating';
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';
  const isIdle = status === 'idle';

  // Derived conditions for UI rendering
  const shouldRender = !isIdle || isLoading;
  const shouldShowProgressBadge = isActive && percentage > 0;
  const shouldShowCancelButton = isActive && onCancel;

  const handleCancelConfirm = () => {
    onCancel?.();
  };

  // Get status-specific text
  const getStatusText = (): string => {
    if (currentStep) return currentStep;

    switch (status) {
      case 'completed':
        return 'Plan generation complete';
      case 'failed':
        return 'Plan generation failed';
      case 'generating':
        return 'Generating implementation plan...';
      default:
        return 'Ready to generate plan';
    }
  };

  // Get status icon
  const renderStatusIcon = () => {
    if (isLoading) {
      return <Loader2 className={'size-4 animate-spin text-accent'} />;
    }
    if (isCompleted) {
      return <CheckCircle2 className={'size-4 text-green-600 dark:text-green-400'} />;
    }
    if (isFailed) {
      return <XCircle className={'size-4 text-destructive'} />;
    }
    return <ClipboardList className={'size-4 text-muted-foreground'} />;
  };

  // Don't render if idle and not loading
  if (!shouldRender) {
    return null;
  }

  return (
    <div className={cn('rounded-md border border-border bg-muted/30 p-4', className)} ref={ref} {...props}>
      {/* Header Section */}
      <div className={'flex items-center justify-between gap-3'}>
        <div className={'flex items-center gap-2'}>
          {renderStatusIcon()}
          <span className={'text-sm font-medium text-foreground'}>{getStatusText()}</span>
        </div>

        {/* Progress Percentage Badge */}
        {shouldShowProgressBadge && (
          <span className={'rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent'}>
            {percentage}% complete
          </span>
        )}
      </div>

      {/* Progress Bar Section */}
      {isActive && (
        <div className={'mt-3'}>
          <Progress.Root className={'w-full'} value={percentage}>
            <div className={'mb-1 flex items-center justify-between'}>
              <Progress.Label className={'text-xs text-muted-foreground'}>Progress</Progress.Label>
              <Progress.Value className={'text-xs text-muted-foreground'} />
            </div>
            <Progress.Track className={'h-2 w-full overflow-hidden rounded-full bg-muted shadow-inner'}>
              <Progress.Indicator className={'block h-full bg-accent transition-all duration-300 ease-out'} />
            </Progress.Track>
          </Progress.Root>
        </div>
      )}

      {/* Cancel Button Section */}
      {shouldShowCancelButton && (
        <div className={'mt-4'}>
          <CancelAiDialog onConfirm={handleCancelConfirm} stepName={'Plan'}>
            <Button size={'sm'} variant={'outline'}>
              Cancel
            </Button>
          </CancelAiDialog>
        </div>
      )}
    </div>
  );
};
