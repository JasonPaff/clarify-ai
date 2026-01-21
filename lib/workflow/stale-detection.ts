/**
 * Centralized stale detection utility for the feature workflow.
 *
 * This module consolidates the step dependency graph and stale propagation logic
 * into a single source of truth, replacing scattered stale marking logic
 * in individual step components.
 *
 * Step Dependency Graph:
 * - describe -> refine -> research -> plan
 * - When a step changes, all downstream steps become stale
 *
 * UI Step Names vs Internal Step IDs:
 * - 'describe' = Describe step (initial feature description)
 * - 'refine' = Clarify step (AI-assisted requirement refinement)
 * - 'research' = Discover step (file discovery and research)
 * - 'plan' = Plan step (implementation planning)
 */

/**
 * Step identifier type matching the STEP_ORDER in the feature workflow page.
 */
export type StepId = 'describe' | 'plan' | 'refine' | 'research';

/**
 * Step dependency graph defining which steps depend on which.
 *
 * Key: The step that changed
 * Value: Array of steps that should be marked stale when the key step changes
 *
 * Dependencies:
 * - describe affects: refine (Clarify), research (Discover), plan (Plan)
 * - refine (Clarify) affects: research (Discover), plan (Plan)
 * - research (Discover) affects: plan (Plan)
 * - plan has no downstream dependencies
 */
export const STEP_DEPENDENCY_GRAPH: Readonly<Record<StepId, ReadonlyArray<StepId>>> = {
  describe: ['refine', 'research', 'plan'],
  plan: [],
  refine: ['research', 'plan'],
  research: ['plan'],
} as const;

/**
 * Reverse dependency graph for upstream lookup.
 *
 * Key: The step to check
 * Value: Array of steps that this step depends on (upstream steps)
 */
export const STEP_UPSTREAM_GRAPH: Readonly<Record<StepId, ReadonlyArray<StepId>>> = {
  describe: [],
  plan: ['describe', 'refine', 'research'],
  refine: ['describe'],
  research: ['describe', 'refine'],
} as const;

/**
 * The ordered list of steps in the workflow.
 * This matches STEP_ORDER in the feature workflow page.
 */
export const STEP_ORDER: ReadonlyArray<StepId> = ['describe', 'refine', 'research', 'plan'] as const;

/**
 * Returns all downstream steps that should be marked stale when the given step changes.
 *
 * @param step - The step that has changed
 * @returns Array of step IDs that depend on the changed step
 *
 * @example
 * ```ts
 * getDownstreamSteps('describe'); // ['refine', 'research', 'plan']
 * getDownstreamSteps('refine');   // ['research', 'plan']
 * getDownstreamSteps('research'); // ['plan']
 * getDownstreamSteps('plan');     // []
 * ```
 */
export function getDownstreamSteps(step: StepId): ReadonlyArray<StepId> {
  return STEP_DEPENDENCY_GRAPH[step];
}

/**
 * Gets the step index in the workflow order.
 *
 * @param step - The step to get the index for
 * @returns The zero-based index of the step in the workflow
 */
export function getStepIndex(step: StepId): number {
  return STEP_ORDER.indexOf(step);
}

/**
 * Returns all upstream steps that the given step depends on.
 *
 * @param step - The step to check dependencies for
 * @returns Array of step IDs that the given step depends on
 *
 * @example
 * ```ts
 * getUpstreamSteps('describe'); // []
 * getUpstreamSteps('refine');   // ['describe']
 * getUpstreamSteps('research'); // ['describe', 'refine']
 * getUpstreamSteps('plan');     // ['describe', 'refine', 'research']
 * ```
 */
export function getUpstreamSteps(step: StepId): ReadonlyArray<StepId> {
  return STEP_UPSTREAM_GRAPH[step];
}

/**
 * Checks if one step comes after another in the workflow order.
 *
 * @param step - The step to check
 * @param otherStep - The step to compare against
 * @returns true if step comes after otherStep
 */
export function isStepAfter(step: StepId, otherStep: StepId): boolean {
  return getStepIndex(step) > getStepIndex(otherStep);
}

/**
 * Checks if one step comes before another in the workflow order.
 *
 * @param step - The step to check
 * @param otherStep - The step to compare against
 * @returns true if step comes before otherStep
 */
export function isStepBefore(step: StepId, otherStep: StepId): boolean {
  return getStepIndex(step) < getStepIndex(otherStep);
}

/**
 * Type guard to check if a string is a valid StepId.
 *
 * @param value - The value to check
 * @returns true if the value is a valid StepId
 */
export function isValidStepId(value: string): value is StepId {
  return STEP_ORDER.includes(value as StepId);
}

/**
 * Checks if a specific target step should be marked stale when a source step changes.
 *
 * @param changedStep - The step that has changed
 * @param targetStep - The step to check if it should be marked stale
 * @returns true if the target step should be marked stale
 *
 * @example
 * ```ts
 * shouldMarkStale('describe', 'refine');   // true
 * shouldMarkStale('describe', 'plan');     // true
 * shouldMarkStale('refine', 'describe');   // false (describe is upstream)
 * shouldMarkStale('plan', 'research');     // false (research is upstream)
 * ```
 */
export function shouldMarkStale(changedStep: StepId, targetStep: StepId): boolean {
  const downstreamSteps = STEP_DEPENDENCY_GRAPH[changedStep];
  return downstreamSteps.includes(targetStep);
}
