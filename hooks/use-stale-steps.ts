'use client';

import { useCallback, useMemo } from 'react';

import { useClearStepsStale, useMarkStepsStale } from '@/hooks/queries/use-feature-requests';
import { getDownstreamSteps, type StepId } from '@/lib/workflow/stale-detection';

// Re-export StepId for convenience so consumers don't need to import from stale-detection
export type { StepId } from '@/lib/workflow/stale-detection';

/**
 * Represents a stale step with its step identifier and timestamp when it became stale.
 */
export interface StaleStep {
  /** ISO timestamp when the step was marked as stale */
  staleAt: string;
  /** Step identifier (e.g., 'refine', 'research', 'plan') */
  step: string;
}

interface UseStaleStepsOptions {
  /** The feature request ID to manage stale steps for */
  featureRequestId: number;
  /** The raw staleSteps JSON string from the feature request */
  staleStepsJson: null | string;
}

interface UseStaleStepsReturn {
  /** Clear one or more steps from the stale state */
  clearStale: (steps: Array<string> | string) => Promise<void>;
  /** Check if a specific step is marked as stale */
  isStale: (step: string) => boolean;
  /**
   * Mark all downstream steps as stale based on the step dependency graph.
   * This is a convenience function that uses the centralized stale detection utility.
   *
   * @param step - The step that changed (will mark all downstream steps as stale)
   *
   * @example
   * ```ts
   * // When 'describe' step changes, marks 'refine', 'research', 'plan' as stale
   * await markDownstreamStale('describe');
   *
   * // When 'refine' step changes, marks 'research', 'plan' as stale
   * await markDownstreamStale('refine');
   * ```
   */
  markDownstreamStale: (step: StepId) => Promise<void>;
  /** Mark one or more steps as stale */
  markStale: (steps: Array<string> | string) => Promise<void>;
  /** Array of step names that are currently stale (for easy iteration) */
  staleStepNames: Array<string>;
  /** The parsed array of stale steps with timestamps */
  staleSteps: Array<StaleStep>;
}

/**
 * Hook for managing stale steps state for a feature request.
 *
 * Provides a clean API for checking if steps are stale and marking/clearing stale state.
 * This centralizes stale state logic for use in Clarify, Research, and Plan steps.
 *
 * The hook provides two ways to mark steps as stale:
 * - `markStale(steps)`: Directly mark specific steps as stale
 * - `markDownstreamStale(step)`: Mark all downstream steps based on the dependency graph
 *
 * @example
 * ```tsx
 * const { isStale, markStale, markDownstreamStale, clearStale, staleSteps } = useStaleSteps({
 *   featureRequestId: featureRequest.id,
 *   staleStepsJson: featureRequest.staleSteps,
 * });
 *
 * // Check if refine step is stale
 * if (isStale('refine')) {
 *   // Show stale warning banner
 * }
 *
 * // Mark research and plan as stale when refine output changes
 * await markStale(['research', 'plan']);
 *
 * // Or use markDownstreamStale for automatic dependency-based marking
 * // This marks 'research' and 'plan' as stale based on the dependency graph
 * await markDownstreamStale('refine');
 *
 * // Clear refine stale state when user re-runs
 * await clearStale('refine');
 * ```
 */
export function useStaleSteps({ featureRequestId, staleStepsJson }: UseStaleStepsOptions): UseStaleStepsReturn {
  const markStepsStale = useMarkStepsStale();
  const clearStepsStale = useClearStepsStale();

  // Parse stale steps from JSON (stored as text field in database)
  const staleSteps = useMemo<Array<StaleStep>>(() => {
    if (!staleStepsJson) return [];
    try {
      const parsed = JSON.parse(staleStepsJson) as Array<StaleStep>;
      // Validate the structure
      if (Array.isArray(parsed) && parsed.every((s) => typeof s.step === 'string' && typeof s.staleAt === 'string')) {
        return parsed;
      }
      return [];
    } catch {
      return [];
    }
  }, [staleStepsJson]);

  // Extract just the step names for easy checking and iteration
  const staleStepNames = useMemo<Array<string>>(() => {
    return staleSteps.map((s) => s.step);
  }, [staleSteps]);

  // Check if a specific step is marked as stale
  const isStale = useCallback(
    (step: string): boolean => {
      return staleStepNames.includes(step);
    },
    [staleStepNames]
  );

  // Mark one or more steps as stale
  const markStale = useCallback(
    async (steps: Array<string> | string): Promise<void> => {
      const stepsArray = Array.isArray(steps) ? steps : [steps];
      await markStepsStale.mutateAsync({
        featureRequestId,
        steps: stepsArray,
      });
    },
    [markStepsStale, featureRequestId]
  );

  // Clear one or more steps from the stale state
  const clearStale = useCallback(
    async (steps: Array<string> | string): Promise<void> => {
      const stepsArray = Array.isArray(steps) ? steps : [steps];
      await clearStepsStale.mutateAsync({
        featureRequestId,
        steps: stepsArray,
      });
    },
    [clearStepsStale, featureRequestId]
  );

  // Mark all downstream steps as stale using the centralized dependency graph
  const markDownstreamStale = useCallback(
    async (step: StepId): Promise<void> => {
      const downstreamSteps = getDownstreamSteps(step);
      if (downstreamSteps.length === 0) {
        // No downstream steps to mark (e.g., 'plan' has no dependents)
        return;
      }
      await markStepsStale.mutateAsync({
        featureRequestId,
        steps: [...downstreamSteps],
      });
    },
    [markStepsStale, featureRequestId]
  );

  return {
    clearStale,
    isStale,
    markDownstreamStale,
    markStale,
    staleStepNames,
    staleSteps,
  };
}
