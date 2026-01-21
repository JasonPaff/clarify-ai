'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { type StepId } from '@/lib/workflow/stale-detection';

/**
 * Human-readable labels for each step, used in UI messages.
 */
const STEP_LABELS: Record<StepId, string> = {
  describe: 'Description',
  plan: 'Planning',
  refine: 'Clarification',
  research: 'Discovery',
} as const;

interface WorkflowContextValue {
  /**
   * Array of step IDs that currently have running AI operations.
   */
  activeAiOperations: Array<StepId>;

  /**
   * Gets the human-readable label of the currently running AI operation step.
   * Returns undefined if no AI operation is running.
   */
  getActiveOperationStep: () => string | undefined;

  /**
   * Whether any AI operation is currently running.
   */
  isAnyAiOperationRunning: boolean;

  /**
   * Registers an AI operation as running for the given step.
   * Call this when starting an AI operation.
   */
  registerAiOperation: (step: StepId) => void;

  /**
   * Unregisters an AI operation for the given step.
   * Call this when an AI operation completes (success or failure).
   */
  unregisterAiOperation: (step: StepId) => void;
}

const WorkflowContext = createContext<undefined | WorkflowContextValue>(undefined);

type WorkflowProviderProps = RequiredChildren;

export function useWorkflow(): WorkflowContextValue {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
}

export function WorkflowProvider({ children }: WorkflowProviderProps) {
  const [activeAiOperations, setActiveAiOperations] = useState<Array<StepId>>([]);

  const registerAiOperation = useCallback((step: StepId) => {
    setActiveAiOperations((prev) => {
      // Prevent duplicate registrations
      if (prev.includes(step)) {
        return prev;
      }
      return [...prev, step];
    });
  }, []);

  const unregisterAiOperation = useCallback((step: StepId) => {
    setActiveAiOperations((prev) => prev.filter((s) => s !== step));
  }, []);

  const isAnyAiOperationRunning = activeAiOperations.length > 0;

  const getActiveOperationStep = useCallback((): string | undefined => {
    if (activeAiOperations.length === 0) {
      return undefined;
    }
    // Return the first active operation's label (typically there's only one)
    const firstStep = activeAiOperations[0];
    return firstStep ? STEP_LABELS[firstStep] : undefined;
  }, [activeAiOperations]);

  const value = useMemo<WorkflowContextValue>(
    () => ({
      activeAiOperations,
      getActiveOperationStep,
      isAnyAiOperationRunning,
      registerAiOperation,
      unregisterAiOperation,
    }),
    [activeAiOperations, getActiveOperationStep, isAnyAiOperationRunning, registerAiOperation, unregisterAiOperation]
  );

  return <WorkflowContext.Provider value={value}>{children}</WorkflowContext.Provider>;
}
