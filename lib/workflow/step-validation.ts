/**
 * Step validation utility for the feature workflow.
 *
 * This module provides soft validation functions that return warnings rather than
 * blocking errors. Users can acknowledge warnings and proceed with incomplete data.
 *
 * Validation is performed at each step to check:
 * - Required data presence
 * - Prerequisite step completion
 * - Data quality indicators
 */

import type { FeatureRequestContextFile } from '@/db/schema/feature-request-context-files.schema';
import type { FeatureRequest } from '@/db/schema/feature-requests.schema';
import type { StepId } from '@/lib/workflow/stale-detection';

/**
 * Context data needed to validate a feature request across all steps.
 */
export interface ValidationContext {
  /** Context files discovered for the feature request */
  contextFiles?: Array<FeatureRequestContextFile>;
  /** The feature request being validated */
  featureRequest: FeatureRequest;
  /**
   * Repository IDs linked to the feature request.
   * Accepts either full repository objects or just the IDs as numbers.
   */
  linkedRepositoryIds?: Array<number>;
}

/**
 * Options for step validation functions.
 */
export interface ValidationOptions {
  /**
   * Whether to check if the step's work is complete (e.g., questions answered).
   * When false, only prerequisite checks are performed.
   * Defaults to true for backward compatibility.
   */
  checkCompleteness?: boolean;
}

/**
 * Severity levels for validation warnings.
 * - 'info': Informational, no action needed
 * - 'warning': Suggested action, can proceed
 * - 'caution': Recommended to address, but can proceed with acknowledgment
 */
export type ValidationSeverity = 'caution' | 'info' | 'warning';

/**
 * A validation warning that indicates potential issues without blocking navigation.
 */
export interface ValidationWarning {
  /** Human-readable message describing the issue */
  message: string;
  /** Severity level of the warning */
  severity: ValidationSeverity;
  /** Category of the warning for programmatic handling */
  type: ValidationWarningType;
}

/**
 * Warning type categories for validation messages.
 */
export type ValidationWarningType =
  | 'incomplete_answers'
  | 'missing_context_files'
  | 'missing_description'
  | 'missing_prerequisite'
  | 'missing_repository'
  | 'missing_research'
  | 'no_questions_generated'
  | 'stale_data';

/**
 * Type for step validation functions.
 */
type StepValidator = (context: ValidationContext, options?: ValidationOptions) => Array<ValidationWarning>;

/**
 * Validates the Clarify step for completeness.
 *
 * Checks:
 * - Describe step is complete (prerequisite) - always checked
 * - Clarification questions were generated - only when checkCompleteness is true
 * - All clarification questions have been answered - only when checkCompleteness is true
 *
 * @param context - Validation context with feature request
 * @param options - Validation options (checkCompleteness defaults to true)
 * @returns Array of validation warnings (empty if valid)
 */
export function validateClarifyStep(
  context: ValidationContext,
  options?: ValidationOptions
): Array<ValidationWarning> {
  const { checkCompleteness = true } = options ?? {};
  const { featureRequest } = context;
  const warnings: Array<ValidationWarning> = [];

  // Check prerequisite: Describe step should have content
  const describeWarnings = validateDescribeStep(context);
  const hasMissingDescription = describeWarnings.some((w) => w.type === 'missing_description');
  if (hasMissingDescription) {
    warnings.push({
      message: 'The Describe step is incomplete. Add a feature request before clarifying requirements.',
      severity: 'caution',
      type: 'missing_prerequisite',
    });
  }

  // If only checking prerequisites, return early
  if (!checkCompleteness) {
    return warnings;
  }

  // Check if clarification questions were generated
  const hasQuestions = featureRequest.clarificationQuestions?.trim();
  if (!hasQuestions) {
    warnings.push({
      message: 'No clarification questions have been generated. Run the Clarify step to generate questions.',
      severity: 'info',
      type: 'no_questions_generated',
    });
    // If no questions, no need to check for answers
    return warnings;
  }

  // Check if answers have been provided
  const hasAnswers = featureRequest.clarificationAnswers?.trim();
  if (!hasAnswers) {
    warnings.push({
      message: 'Clarification questions have not been answered. Answering questions improves plan quality.',
      severity: 'caution',
      type: 'incomplete_answers',
    });
  } else {
    // Try to parse answers and check for completeness
    // We know these are non-null strings at this point due to the checks above
    const answersJson = featureRequest.clarificationAnswers;
    const questionsJson = featureRequest.clarificationQuestions;
    if (!answersJson || !questionsJson) {
      return warnings;
    }
    try {
      const answers = JSON.parse(answersJson) as Record<string, string>;
      const questions = JSON.parse(questionsJson) as Array<{ id: string }>;

      const unansweredCount = questions.filter((q) => {
        const answer = answers[q.id];
        return !answer || answer.trim() === '';
      }).length;

      if (unansweredCount > 0) {
        warnings.push({
          message: `${unansweredCount} clarification question${unansweredCount > 1 ? 's remain' : ' remains'} unanswered. Complete answers improve plan accuracy.`,
          severity: 'caution',
          type: 'incomplete_answers',
        });
      }
    } catch {
      // If parsing fails, we can't determine completeness - don't add a warning
      // The data structure might be different than expected
    }
  }

  return warnings;
}

/**
 * Validates the Describe step for completeness.
 *
 * Checks:
 * - Feature request is present and not empty
 * - At least one repository is linked
 *
 * @param context - Validation context with feature request and linked repositories
 * @param options - Validation options (unused for Describe step, included for consistent API)
 * @returns Array of validation warnings (empty if valid)
 */
export function validateDescribeStep(
  context: ValidationContext,
  options?: ValidationOptions
): Array<ValidationWarning> {
  void options; // Intentionally unused - included for consistent API signature
  const { featureRequest, linkedRepositoryIds } = context;
  const warnings: Array<ValidationWarning> = [];

  // Check for empty or missing feature request content
  const requestContent = featureRequest.rawRequest?.trim();
  if (!requestContent) {
    warnings.push({
      message: 'Feature request is empty. Add details in the Describe step to proceed.',
      severity: 'caution',
      type: 'missing_description',
    });
  }

  // Check for linked repositories
  if (!linkedRepositoryIds || linkedRepositoryIds.length === 0) {
    warnings.push({
      message: 'No repositories are linked. Link at least one repository to enable code analysis in later steps.',
      severity: 'warning',
      type: 'missing_repository',
    });
  }

  return warnings;
}

/**
 * Validates the Discover step for completeness.
 *
 * Checks:
 * - Clarify step prerequisite is complete (Describe step done)
 * - Research findings are present - only when checkCompleteness is true
 * - Context files have been identified - only when checkCompleteness is true
 *
 * @param context - Validation context with feature request and context files
 * @param options - Validation options (checkCompleteness defaults to true)
 * @returns Array of validation warnings (empty if valid)
 */
export function validateDiscoverStep(
  context: ValidationContext,
  options?: ValidationOptions
): Array<ValidationWarning> {
  const { checkCompleteness = true } = options ?? {};
  const { contextFiles, featureRequest } = context;
  const warnings: Array<ValidationWarning> = [];

  // Check prerequisite: Clarify step (only check prerequisites, not completeness)
  const clarifyWarnings = validateClarifyStep(context, { checkCompleteness: false });
  const hasMissingPrereq = clarifyWarnings.some((w) => w.type === 'missing_prerequisite');
  if (hasMissingPrereq) {
    warnings.push({
      message: 'Previous steps are incomplete. Complete earlier steps for better discovery results.',
      severity: 'caution',
      type: 'missing_prerequisite',
    });
  }

  // If only checking prerequisites, return early
  if (!checkCompleteness) {
    return warnings;
  }

  // Check for research findings
  const hasResearch = featureRequest.researchFindings?.trim();
  if (!hasResearch) {
    warnings.push({
      message: 'No research findings available. Run the Discover step to analyze the codebase.',
      severity: 'info',
      type: 'missing_research',
    });
  }

  // Check for context files
  if (!contextFiles || contextFiles.length === 0) {
    warnings.push({
      message: 'No context files have been identified. Discovery helps identify relevant files for planning.',
      severity: 'warning',
      type: 'missing_context_files',
    });
  }

  return warnings;
}

/**
 * Validates the Plan step for completeness.
 *
 * Checks:
 * - Describe step is complete (hard prerequisite)
 * - Clarify step was done with answers (soft prerequisite)
 * - Discover step was done (soft prerequisite)
 * - Data is not stale
 *
 * @param context - Validation context with feature request and context files
 * @param options - Validation options (Plan step always checks all requirements)
 * @returns Array of validation warnings (empty if valid)
 */
export function validatePlanStep(
  context: ValidationContext,
  options?: ValidationOptions
): Array<ValidationWarning> {
  void options; // Intentionally unused - Plan step always checks all requirements
  const { featureRequest } = context;
  const warnings: Array<ValidationWarning> = [];

  // Check describe step prerequisite
  const describeWarnings = validateDescribeStep(context);
  if (describeWarnings.some((w) => w.type === 'missing_description')) {
    warnings.push({
      message: 'Feature request is missing. The Describe step is required for plan generation.',
      severity: 'caution',
      type: 'missing_prerequisite',
    });
  }

  // Check if clarification was done (soft requirement)
  const hasQuestions = featureRequest.clarificationQuestions?.trim();
  const hasAnswers = featureRequest.clarificationAnswers?.trim();
  if (!hasQuestions || !hasAnswers) {
    warnings.push({
      message: 'Clarification step was skipped or incomplete. Plans are more accurate with clarified requirements.',
      severity: 'warning',
      type: 'missing_prerequisite',
    });
  }

  // Check if discovery was done (soft requirement)
  const hasResearch = featureRequest.researchFindings?.trim();
  if (!hasResearch) {
    warnings.push({
      message: 'Discovery step was skipped. Plans are more accurate when informed by codebase analysis.',
      severity: 'warning',
      type: 'missing_prerequisite',
    });
  }

  // Check for stale data
  if (featureRequest.staleSteps) {
    try {
      const staleSteps = JSON.parse(featureRequest.staleSteps) as Array<string>;
      if (staleSteps.includes('plan')) {
        warnings.push({
          message: 'Previous steps have changed since the last plan. Consider regenerating the plan.',
          severity: 'warning',
          type: 'stale_data',
        });
      }
    } catch {
      // If parsing fails, skip stale check
    }
  }

  return warnings;
}

/**
 * Step validation function mapping.
 */
const STEP_VALIDATORS: Record<StepId, StepValidator> = {
  describe: validateDescribeStep,
  plan: validatePlanStep,
  refine: validateClarifyStep,
  research: validateDiscoverStep,
};

/**
 * Filters warnings by severity level.
 *
 * @param warnings - Array of validation warnings to filter
 * @param severity - Severity level to filter by
 * @returns Filtered array of warnings matching the severity
 */
export function filterWarningsBySeverity(
  warnings: Array<ValidationWarning>,
  severity: ValidationSeverity
): Array<ValidationWarning> {
  return warnings.filter((w) => w.severity === severity);
}

/**
 * Filters warnings by type.
 *
 * @param warnings - Array of validation warnings to filter
 * @param type - Warning type to filter by
 * @returns Filtered array of warnings matching the type
 */
export function filterWarningsByType(
  warnings: Array<ValidationWarning>,
  type: ValidationWarningType
): Array<ValidationWarning> {
  return warnings.filter((w) => w.type === type);
}

/**
 * Gets all validation warnings for a given step.
 *
 * This is the main entry point for step validation. It aggregates all warnings
 * relevant to the specified step.
 *
 * @param step - The step ID to validate
 * @param context - Validation context with all necessary data
 * @param options - Validation options (e.g., checkCompleteness)
 * @returns Array of validation warnings for the step
 *
 * @example
 * ```ts
 * // Full validation (default) - checks prerequisites AND completeness
 * const warnings = getStepWarnings('refine', { featureRequest, linkedRepositories, contextFiles });
 *
 * // Prerequisite-only validation - when entering a step
 * const prereqWarnings = getStepWarnings('refine', context, { checkCompleteness: false });
 * ```
 */
export function getStepWarnings(
  step: StepId,
  context: ValidationContext,
  options?: ValidationOptions
): Array<ValidationWarning> {
  const validator = STEP_VALIDATORS[step];
  return validator(context, options);
}

/**
 * Checks if any warnings are of caution severity (highest severity).
 *
 * @param warnings - Array of validation warnings to check
 * @returns true if any warning has caution severity
 */
export function hasCautionWarnings(warnings: Array<ValidationWarning>): boolean {
  return warnings.some((w) => w.severity === 'caution');
}
