'use client';

import { AlertTriangle, Check } from 'lucide-react';

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
  currentStep: string;
  onStepClick?: (stepId: string) => void;
  staleSteps?: Array<string>;
}

export const WorkflowSteps = ({ currentStep, onStepClick, staleSteps = [] }: WorkflowStepsProps) => {
  const currentIndex = WORKFLOW_STEPS.findIndex((s) => s.id === currentStep);
  const isLastStep = (index: number) => index === WORKFLOW_STEPS.length - 1;

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

        return (
          <div className={'flex flex-col'} key={step.id}>
            {/* Step Row */}
            <button
              className={cn(
                'flex items-center gap-3 text-left',
                isClickable && 'cursor-pointer',
                !isClickable && 'cursor-default'
              )}
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick?.(step.id)}
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
    </div>
  );
};
