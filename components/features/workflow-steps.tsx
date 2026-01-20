'use client';

import { AlertTriangle, Check } from 'lucide-react';
import { Fragment } from 'react';

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
    title: 'Refine',
  },
  {
    description: 'Analyze codebase context',
    id: 'research',
    title: 'Research',
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

  return (
    <div className={'flex items-center justify-between'}>
      {WORKFLOW_STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = step.id === currentStep;
        const isClickable = onStepClick && (isCompleted || isCurrent);
        const isStale = staleSteps.includes(step.id);

        const stepIndicator = (
          <div className={'relative'}>
            {/* Step indicator */}
            <div
              className={cn(
                `
                  flex size-10 items-center justify-center rounded-full
                  border-2 text-sm font-medium transition-colors
                `,
                isCompleted && 'border-accent bg-accent text-accent-foreground',
                isCurrent && 'border-accent bg-background text-accent',
                !isCompleted && !isCurrent && 'border-border bg-background text-muted-foreground',
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
          <Fragment key={step.id}>
            <button
              className={cn(
                'flex flex-col items-center text-center',
                isClickable && 'cursor-pointer',
                !isClickable && 'cursor-default'
              )}
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick?.(step.id)}
              type={'button'}
            >
              {/* Step indicator with optional stale tooltip */}
              {isStale ? (
                <Tooltip content={'This step is outdated due to changes in a previous step'} side={'top'}>
                  {stepIndicator}
                </Tooltip>
              ) : (
                stepIndicator
              )}

              {/* Step label */}
              <span
                className={cn(
                  'mt-2 text-sm font-medium',
                  isCurrent && 'text-foreground',
                  !isCurrent && 'text-muted-foreground',
                  isStale && 'text-amber-500'
                )}
              >
                {step.title}
              </span>
              <span className={'mt-0.5 text-xs text-muted-foreground'}>{step.description}</span>
            </button>

            {/* Connector line */}
            {index < WORKFLOW_STEPS.length - 1 && (
              <div className={cn('mx-2 h-0.5 flex-1', index < currentIndex ? 'bg-accent' : 'bg-border')} />
            )}
          </Fragment>
        );
      })}
    </div>
  );
};
