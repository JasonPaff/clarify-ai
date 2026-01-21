'use client';

import type { KeyboardEvent } from 'react';

import { AlertTriangle, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

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
  const [focusedIndex, setFocusedIndex] = useState(currentIndex);
  const stepRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const isLastStep = (index: number) => index === WORKFLOW_STEPS.length - 1;

  // Announce status changes via live region
  const announce = useCallback((message: string) => {
    if (liveRegionRef.current) {
      // Clear first to ensure re-announcement of same message
      liveRegionRef.current.textContent = '';
      requestAnimationFrame(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = message;
        }
      });
    }
  }, []);

  // Announce step changes
  useEffect(() => {
    const step = WORKFLOW_STEPS[currentIndex];
    if (step) {
      announce(`Step ${currentIndex + 1} of ${totalSteps}: ${step.title}. ${step.description}`);
    }
  }, [currentIndex, totalSteps, announce]);

  // Announce stale step warnings
  useEffect(() => {
    if (staleSteps.length > 0) {
      const staleStepNames = staleSteps
        .map((id) => WORKFLOW_STEPS.find((s) => s.id === id)?.title)
        .filter(Boolean)
        .join(', ');
      announce(`Warning: The following steps are outdated and may need to be re-run: ${staleStepNames}`);
    }
  }, [staleSteps, announce]);

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

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const { key } = event;
    let newIndex = focusedIndex;

    switch (key) {
      case ' ':
      case 'Enter': {
        event.preventDefault();
        const step = WORKFLOW_STEPS[focusedIndex];
        const isCompleted = focusedIndex < currentIndex;
        const isCurrent = step?.id === currentStep;
        const isClickable = onStepClick && (isCompleted || isCurrent);
        if (step && isClickable) {
          handleStepClick(step.id, true);
        }
        return;
      }
      case 'ArrowDown':
        event.preventDefault();
        newIndex = Math.min(focusedIndex + 1, WORKFLOW_STEPS.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        newIndex = Math.max(focusedIndex - 1, 0);
        break;
      case 'End':
        event.preventDefault();
        newIndex = WORKFLOW_STEPS.length - 1;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      default:
        return;
    }

    if (newIndex !== focusedIndex) {
      setFocusedIndex(newIndex);
      stepRefs.current[newIndex]?.focus();
    }
  };

  return (
    <nav
      aria-label={'Workflow progress'}
      className={'flex flex-col rounded-lg border border-border/50 bg-muted/30 p-3 sm:p-4 md:w-(--stepper-width)'}
      onKeyDown={handleKeyDown}
      role={'navigation'}
    >
      {/* Hidden live region for screen reader announcements */}
      <div aria-atomic={'true'} aria-live={'polite'} className={'sr-only'} ref={liveRegionRef} role={'status'} />

      <ol aria-label={'Workflow steps'} role={'list'}>
        {WORKFLOW_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = step.id === currentStep;
          const isClickable = onStepClick && (isCompleted || isCurrent);
          const isStale = staleSteps.includes(step.id);

          const stepIndicator = (
            <div className={'relative shrink-0'}>
              {/* Step indicator - min 44x44px on mobile for touch accessibility, 40x40px on md+ */}
              <div
                className={cn(
                  `
                  flex size-11 items-center justify-center rounded-full border-2 text-sm
                  font-medium transition-colors md:size-10
                `,
                  isCompleted && 'border-accent bg-accent text-accent-foreground',
                  isCurrent && 'border-accent bg-background text-accent shadow-sm',
                  !isCompleted && !isCurrent && 'border-border/60 bg-background text-muted-foreground/70',
                  isStale && 'border-amber-500'
                )}
              >
                {isCompleted ? <Check className={'size-4 md:size-5'} /> : index + 1}
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
          const stepStatus = isCompleted ? 'completed' : isCurrent ? 'current' : 'upcoming';
          const ariaLabel = `Step ${index + 1}: ${step.title}. ${step.description}. Status: ${stepStatus}${isStale ? '. Warning: This step is outdated.' : ''}`;

          return (
            <li className={'flex flex-col'} key={step.id} role={'listitem'}>
              {/* Step Row */}
              <button
                aria-current={isCurrent ? 'step' : undefined}
                aria-describedby={isStale ? `stale-warning-${step.id}` : undefined}
                aria-disabled={!isClickable}
                aria-label={ariaLabel}
                className={cn(
                  'flex items-center gap-2 text-left sm:gap-3',
                  isClickable && !isNavigationBlocked && 'cursor-pointer',
                  !isClickable && 'cursor-default',
                  isNavigationBlocked && 'cursor-not-allowed opacity-60'
                )}
                disabled={!isClickable}
                onClick={() => handleStepClick(step.id, !!isClickable)}
                onFocus={() => setFocusedIndex(index)}
                ref={(el) => {
                  stepRefs.current[index] = el;
                }}
                tabIndex={index === focusedIndex ? 0 : -1}
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
                  {/* Description hidden on small screens, visible on md+ */}
                  <span className={'hidden truncate text-xs text-muted-foreground sm:block'}>{step.description}</span>
                </div>
              </button>

              {/* Hidden stale warning for aria-describedby */}
              {isStale && (
                <span className={'sr-only'} id={`stale-warning-${step.id}`}>
                  This step is outdated due to changes in a previous step and may need to be re-run.
                </span>
              )}

              {/* Vertical connector line - centered under step indicator */}
              {!isLastStep(index) && (
                <div aria-hidden={'true'} className={'my-1.5 ml-[21px] sm:my-2 md:ml-[19px]'}>
                  <div className={cn('h-4 w-0.5 sm:h-5', index < currentIndex ? 'bg-accent' : 'bg-border/60')} />
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* Navigation */}
      <div className={'mt-3 flex flex-col gap-2 border-t border-border/50 pt-3 sm:mt-4 sm:gap-3 sm:pt-4'}>
        <span className={'text-center text-xs text-muted-foreground'}>
          Step {currentIndex + 1} of {totalSteps}
        </span>
        <div className={'flex gap-2'}>
          <Button className={'flex-1'} disabled={!canGoBack} onClick={onGoBack} size={'sm'} variant={'outline'}>
            <ArrowLeft className={'size-4'} />
            <span className={'hidden sm:inline'}>Previous</span>
          </Button>
          <Button className={'flex-1'} disabled={!canGoNext} onClick={onGoNext} size={'sm'}>
            <span className={'hidden sm:inline'}>Next</span>
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
    </nav>
  );
};
