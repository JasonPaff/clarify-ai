'use client';

import { AlertTriangle, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useState } from 'react';

import { CancelAiDialog } from '@/components/features/workflow/cancel-ai-dialog';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface Step {
  description: string;
  id: string;
  isStale?: boolean;
  title: string;
}

export const WORKFLOW_STEPS: Array<Step> = [
  {
    description: 'Describe your feature idea',
    id: 'describe',
    title: 'Describe',
  },
  {
    description: 'Clarify and expand requirements',
    id: 'refine',
    title: 'Clarify',
  },
  {
    description: 'Discover relevant codebase context',
    id: 'research',
    title: 'Discover',
  },
  {
    description: 'Generate implementation plan',
    id: 'plan',
    title: 'Plan',
  },
];

interface WorkflowStepsProps {
  /** Name of the active AI operation step for the cancel dialog message */
  activeOperationStepName?: string;
  canGoBack: boolean;
  canGoNext: boolean;
  currentIndex: number;
  currentStep: string;
  /** Whether an AI operation is currently running (used for navigation blocking) */
  isAiOperationRunning?: boolean;
  /** Callback to cancel the active AI operation */
  onCancelAiOperation?: () => void;
  onGoBack: () => void;
  onGoNext: () => void;
  onStepClick?: (stepId: string) => void;
  staleSteps?: Array<string>;
  totalSteps: number;
}

export const WorkflowSteps = ({
  activeOperationStepName = 'current',
  canGoBack,
  canGoNext,
  currentIndex,
  currentStep,
  isAiOperationRunning = false,
  onCancelAiOperation,
  onGoBack,
  onGoNext,
  onStepClick,
  staleSteps = [],
  totalSteps,
}: WorkflowStepsProps) => {
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [pendingStepId, setPendingStepId] = useState<null | string>(null);

  const isLastStep = (index: number) => index === WORKFLOW_STEPS.length - 1;

  const handleStepClick = (stepId: string, isClickable: boolean) => {
    if (!isClickable) return;

    if (isAiOperationRunning) {
      setPendingStepId(stepId);
      setIsCancelDialogOpen(true);
      return;
    }

    onStepClick?.(stepId);
  };

  const handleCancelConfirm = () => {
    onCancelAiOperation?.();
    setIsCancelDialogOpen(false);

    if (pendingStepId) {
      onStepClick?.(pendingStepId);
      setPendingStepId(null);
    }
  };

  const handleDialogOpenChange = (isOpen: boolean) => {
    setIsCancelDialogOpen(isOpen);
    if (!isOpen) {
      setPendingStepId(null);
    }
  };

  return (
    <div
      className={'flex flex-col rounded-lg border border-border/50 bg-muted/30 p-4'}
      style={{ width: 'var(--stepper-width)' }}
    >
      {WORKFLOW_STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = step.id === currentStep;
        const isClickable = onStepClick && (isCompleted || isCurrent);
        const isStale = staleSteps.includes(step.id);

        const stepIndicator = (
          <div className={'relative shrink-0'}>
            {/* Step indicator */}
            <div
              className={cn(
                `
                  flex size-10 items-center justify-center rounded-full
                  border-2 text-sm font-medium transition-colors
                `,
                isCompleted && 'border-accent bg-accent text-accent-foreground',
                isCurrent && 'border-accent bg-background text-accent shadow-sm',
                !isCompleted && !isCurrent && 'border-border/60 bg-background text-muted-foreground/70',
                isStale && 'border-amber-500'
              )}
            >
              {isCompleted ? <Check className={'size-5'} /> : index + 1}
            </div>

            {/* Stale warning indicator */}
            {isStale && (
              <div
                className={
                  'absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-amber-500 text-white'
                }
              >
                <AlertTriangle className={'size-3'} />
              </div>
            )}
          </div>
        );

        const isNavigationBlocked = isAiOperationRunning && isClickable && step.id !== currentStep;

        return (
          <div className={'flex flex-col'} key={step.id}>
            {/* Step Row */}
            <button
              className={cn(
                'flex items-center gap-3 text-left',
                isClickable && !isNavigationBlocked && 'cursor-pointer',
                !isClickable && 'cursor-default',
                isNavigationBlocked && 'cursor-not-allowed opacity-60'
              )}
              disabled={!isClickable}
              onClick={() => handleStepClick(step.id, !!isClickable)}
              type={'button'}
            >
              {/* Step indicator with optional stale tooltip */}
              {isStale ? (
                <Tooltip content={'This step is outdated due to changes in a previous step'} side={'right'}>
                  {stepIndicator}
                </Tooltip>
              ) : (
                stepIndicator
              )}

              {/* Step labels */}
              <div className={'flex min-w-0 flex-col'}>
                <span
                  className={cn(
                    'truncate text-sm font-medium',
                    isCurrent && 'text-foreground',
                    isCompleted && !isStale && 'text-muted-foreground',
                    !isCompleted && !isCurrent && 'text-muted-foreground/70',
                    isStale && 'text-amber-500'
                  )}
                >
                  {step.title}
                </span>
                <span className={'truncate text-xs text-muted-foreground'}>{step.description}</span>
              </div>
            </button>

            {/* Vertical connector line */}
            {!isLastStep(index) && (
              <div className={'my-2 ml-[19px]'}>
                <div className={cn('h-5 w-0.5', index < currentIndex ? 'bg-accent' : 'bg-border/60')} />
              </div>
            )}
          </div>
        );
      })}

      {/* Navigation */}
      <div className={'mt-4 flex flex-col gap-3 border-t border-border/50 pt-4'}>
        <span className={'text-center text-xs text-muted-foreground'}>
          Step {currentIndex + 1} of {totalSteps}
        </span>
        <div className={'flex gap-2'}>
          <Button className={'flex-1'} disabled={!canGoBack} onClick={onGoBack} size={'sm'} variant={'outline'}>
            <ArrowLeft className={'size-4'} />
            Previous
          </Button>
          <Button className={'flex-1'} disabled={!canGoNext} onClick={onGoNext} size={'sm'}>
            Next
            <ArrowRight className={'size-4'} />
          </Button>
        </div>
      </div>

      {/* Cancel AI Dialog */}
      <CancelAiDialog
        onConfirm={handleCancelConfirm}
        onOpenChange={handleDialogOpenChange}
        open={isCancelDialogOpen}
        stepName={activeOperationStepName}
      />
    </div>
  );
};
