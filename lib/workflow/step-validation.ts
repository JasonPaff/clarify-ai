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
 * Validates the Clarify step for completeness.
 *
 * Checks:
 * - Clarification questions were generated
 * - All clarification questions have been answered
 * - Describe step is complete (prerequisite)
 *
 * @param context - Validation context with feature request
 * @returns Array of validation warnings (empty if valid)
 */
export function validateClarifyStep(context: ValidationContext): Array<ValidationWarning> {
  const { featureRequest } = context;
  const warnings: Array<ValidationWarning> = [];

  // Check prerequisite: Describe step should have content
  const describeWarnings = validateDescribeStep(context);
  const hasMissingDescription = describeWarnings.some((w) => w.type === 'missing_description');
  if (hasMissingDescription) {
    warnings.push({
      message: 'The Describe step is incomplete. Complete the description before clarifying requirements.',
      severity: 'caution',
      type: 'missing_prerequisite',
    });
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
      severity: 'warning',
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
          severity: 'warning',
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
 * - Feature description is present and not empty
 * - At least one repository is linked
 *
 * @param context - Validation context with feature request and linked repositories
 * @returns Array of validation warnings (empty if valid)
 */
export function validateDescribeStep(context: ValidationContext): Array<ValidationWarning> {
  const { featureRequest, linkedRepositoryIds } = context;
  const warnings: Array<ValidationWarning> = [];

  // Check for empty or missing description
  const description = featureRequest.description?.trim();
  if (!description) {
    warnings.push({
      message: 'Feature description is empty. Add a description to help the AI understand your request.',
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
 * - Research findings are present
 * - Context files have been identified
 * - Clarify step is complete (prerequisite)
 *
 * @param context - Validation context with feature request and context files
 * @returns Array of validation warnings (empty if valid)
 */
export function validateDiscoverStep(context: ValidationContext): Array<ValidationWarning> {
  const { contextFiles, featureRequest } = context;
  const warnings: Array<ValidationWarning> = [];

  // Check prerequisite: Clarify step
  const clarifyWarnings = validateClarifyStep(context);
  const hasMissingPrereq = clarifyWarnings.some((w) => w.type === 'missing_prerequisite');
  if (hasMissingPrereq) {
    warnings.push({
      message: 'Previous steps are incomplete. Complete earlier steps for better discovery results.',
      severity: 'caution',
      type: 'missing_prerequisite',
    });
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
 * - All prerequisite steps are sufficiently complete
 * - Implementation plan prerequisites are met
 *
 * @param context - Validation context with feature request and context files
 * @returns Array of validation warnings (empty if valid)
 */
export function validatePlanStep(context: ValidationContext): Array<ValidationWarning> {
  const { featureRequest } = context;
  const warnings: Array<ValidationWarning> = [];

  // Check describe step prerequisite
  const describeWarnings = validateDescribeStep(context);
  if (describeWarnings.some((w) => w.type === 'missing_description')) {
    warnings.push({
      message: 'Feature description is missing. A description is required for plan generation.',
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
const STEP_VALIDATORS: Record<StepId, (context: ValidationContext) => Array<ValidationWarning>> = {
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
 * @returns Array of validation warnings for the step
 *
 * @example
 * ```ts
 * const warnings = getStepWarnings('refine', {
 *   featureRequest,
 *   linkedRepositories,
 *   contextFiles,
 * });
 *
 * if (warnings.length > 0) {
 *   // Show warnings to user
 *   warnings.forEach(w => console.log(`[${w.severity}] ${w.message}`));
 * }
 * ```
 */
export function getStepWarnings(step: StepId, context: ValidationContext): Array<ValidationWarning> {
  const validator = STEP_VALIDATORS[step];
  return validator(context);
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
