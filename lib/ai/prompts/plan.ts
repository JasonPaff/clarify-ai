import type { DiscoveredFileEntry } from '../../validations/discovery';

/** Repository overview data for plan prompt */
export interface PlanRepositoryOverview {
  overview: string;
  repositoryId: number;
  repositoryName: string;
  repositoryPath: string;
}

/** Scope configuration for plan generation */
export interface PlanScopeConfig {
  /** Complexity threshold filter */
  complexityFilter?: 'all' | 'high' | 'low' | 'medium';
  /** Whether to include risk assessment */
  includeRiskAssessment?: boolean;
  /** Whether to include testing strategy */
  includeTestingStrategy?: boolean;
  /** Maximum number of steps to generate */
  maxSteps?: number;
  /** Specific repository IDs to focus on */
  repositoryIds?: Array<number>;
}

// Default prompt template for implementation plan generation
// Based on the implementation-planner agent prompt structure
export const DEFAULT_PLAN_PROMPT = `You are an expert implementation planner who creates comprehensive, actionable implementation plans for software features. You analyze feature requests, discovered files, and codebase context to produce step-by-step implementation guides that developers can follow with confidence.

## Instructions

1. **Analyze the Feature Request**: Carefully examine the feature request to understand:
   - The core functionality being requested
   - User-facing requirements and acceptance criteria
   - Technical implications and integration points
   - Scope boundaries and constraints

2. **Review Discovered Files**: Analyze the discovered files to understand:
   - Which files need to be modified vs. created
   - Existing patterns and conventions to follow
   - Dependencies between files and components
   - Risk areas that require careful attention

3. **Consider Clarification Context**: If clarifications have been gathered:
   - Incorporate user preferences and decisions
   - Address any edge cases or requirements clarified
   - Respect scope boundaries established during clarification

4. **Create Implementation Steps**: Generate a logical sequence of steps that:
   - Progress from foundational changes to dependent features
   - Group related file changes together
   - Include clear descriptions of what each step accomplishes
   - Specify which files are affected and how (create, modify, delete, review)
   - Estimate complexity (low, medium, high) for each step

5. **Define Quality Gates**: For each step, provide validation checkpoints:
   - Automated commands (lint, typecheck, test) where applicable
   - Manual verification points for user testing
   - Integration validation between steps

6. **Assess Risks**: Identify potential implementation risks:
   - Breaking changes or regressions
   - Complex integrations or dependencies
   - Areas requiring extra testing or review
   - Provide mitigation strategies for each risk

7. **Outline Testing Strategy**: Recommend testing approaches:
   - Unit tests for new functionality
   - Integration tests for component interactions
   - Manual testing scenarios for user-facing features

## Output Format

Call the \`generatePlan\` tool with:
- A summary of the implementation approach
- An overview explaining the high-level strategy
- Reasoning for the chosen approach
- Confidence score (0-100) based on available context
- Prerequisites needed before implementation
- Ordered implementation steps with files, descriptions, complexity, and quality gates
- Risk assessment with mitigation strategies
- Testing strategy recommendations

## Quality Standards

- **Actionable**: Each step should be clear enough for a developer to execute without additional research
- **Complete**: Cover all necessary changes including edge cases and error handling
- **Ordered**: Steps should be sequenced to minimize conflicts and enable incremental progress
- **Validated**: Include quality gates that verify successful completion of each step
- **Context-Aware**: Respect existing codebase patterns, conventions, and architecture

{scopeInstructions}

## Repository Context

{repositoryOverviews}

{clarificationContext}

## Discovered Files

{discoveredFiles}

## Feature Request

{featureRequest}`;

/**
 * Build the discovered files section for the prompt.
 *
 * @param discoveredFiles - Array of discovered file entries from the discovery step
 * @returns Formatted discovered files string
 */
export function buildDiscoveredFilesSection(discoveredFiles: Array<DiscoveredFileEntry>): string {
  if (discoveredFiles.length === 0) {
    return 'No files have been discovered for this feature. The implementation plan should identify necessary files based on the feature request and repository context.';
  }

  const groupedByAction: Record<string, Array<DiscoveredFileEntry>> = {
    create: [],
    delete: [],
    modify: [],
    review: [],
  };

  // Group files by action
  for (const file of discoveredFiles) {
    const action = file.action || 'review';
    const group = groupedByAction[action];
    if (group) {
      group.push(file);
    }
  }

  const sections: Array<string> = [];

  // Build sections for each action type
  const actionOrder: Array<'create' | 'delete' | 'modify' | 'review'> = ['modify', 'create', 'review', 'delete'];
  const actionLabels: Record<string, string> = {
    create: 'Files to Create',
    delete: 'Files to Delete',
    modify: 'Files to Modify',
    review: 'Files to Review',
  };

  for (const action of actionOrder) {
    const files = groupedByAction[action];
    if (files && files.length > 0) {
      const label = actionLabels[action] ?? action;
      const fileList = files
        .map((file) => {
          const riskBadge = file.risk ? ` [${file.risk.toUpperCase()} risk]` : '';
          const confidence = file.confidence !== undefined ? ` (${file.confidence}% confidence)` : '';
          return `- **${file.path}**${riskBadge}${confidence}\n  ${file.reason}`;
        })
        .join('\n');
      sections.push(`### ${label}\n\n${fileList}`);
    }
  }

  return sections.join('\n\n');
}

/**
 * Build the plan prompt by replacing template variables with actual data.
 *
 * @param featureRequest - The feature request description
 * @param repositoryOverviews - Array of repository overview data
 * @param clarificationContext - Optional clarification context from previous step
 * @param discoveredFiles - Array of discovered files from discovery step
 * @param scopeConfig - Optional scope configuration for plan generation
 * @param customPrompt - Optional custom prompt template to use instead of the default
 * @returns The prompt with all template variables replaced
 */
export function buildPlanPrompt(
  featureRequest: string,
  repositoryOverviews: Array<PlanRepositoryOverview>,
  clarificationContext?: string,
  discoveredFiles?: Array<DiscoveredFileEntry>,
  scopeConfig?: PlanScopeConfig,
  customPrompt?: string
): string {
  // Use customPrompt only if it's a non-empty string, otherwise use the default
  const template = customPrompt && customPrompt.trim() ? customPrompt : DEFAULT_PLAN_PROMPT;

  // Build the scope instructions section
  const scopeInstructions = buildScopeInstructions(scopeConfig);

  // Build the repository overviews section
  const repositoryOverviewsSection = buildRepositoryOverviewsSection(repositoryOverviews);

  // Build the clarification context section
  const clarificationSection = clarificationContext
    ? `## Clarification Context\n\nThe following clarifications have been gathered about this feature request:\n\n${clarificationContext}`
    : '';

  // Build the discovered files section
  const discoveredFilesSection = buildDiscoveredFilesSection(discoveredFiles ?? []);

  // Replace template variables with actual data
  return template
    .replace('{scopeInstructions}', scopeInstructions)
    .replace('{repositoryOverviews}', repositoryOverviewsSection)
    .replace('{clarificationContext}', clarificationSection)
    .replace('{discoveredFiles}', discoveredFilesSection)
    .replace('{featureRequest}', featureRequest);
}

/**
 * Build repository overviews section for the prompt.
 *
 * @param repositoryOverviews - Array of repository overview data
 * @returns Formatted repository overviews string
 */
export function buildRepositoryOverviewsSection(repositoryOverviews: Array<PlanRepositoryOverview>): string {
  if (repositoryOverviews.length === 0) {
    return 'No repository overviews available.';
  }

  const sections = repositoryOverviews.map((repo) => {
    return `### ${repo.repositoryName}
**Path**: ${repo.repositoryPath}
**Repository ID**: ${repo.repositoryId}

${repo.overview}`;
  });

  return sections.join('\n\n---\n\n');
}

/**
 * Build scope configuration instructions based on the provided config.
 *
 * @param scopeConfig - Optional scope configuration for plan generation
 * @returns Formatted scope instructions string
 */
function buildScopeInstructions(scopeConfig?: PlanScopeConfig): string {
  if (!scopeConfig) {
    return '';
  }

  const instructions: Array<string> = [];

  if (scopeConfig.maxSteps) {
    instructions.push(
      `**Maximum Steps**: Limit the implementation plan to at most ${scopeConfig.maxSteps} steps, combining related changes where appropriate.`
    );
  }

  if (scopeConfig.includeTestingStrategy === false) {
    instructions.push(`**Testing Strategy**: Skip the testing strategy section in the output.`);
  }

  if (scopeConfig.includeRiskAssessment === false) {
    instructions.push(`**Risk Assessment**: Skip the risk assessment section in the output.`);
  }

  if (scopeConfig.repositoryIds && scopeConfig.repositoryIds.length > 0) {
    instructions.push(
      `**Repository Scope**: Focus implementation steps on repositories with IDs: ${scopeConfig.repositoryIds.join(', ')}`
    );
  }

  if (scopeConfig.complexityFilter && scopeConfig.complexityFilter !== 'all') {
    const filterDescriptions: Record<string, string> = {
      high: 'only high-complexity changes',
      low: 'only low-complexity changes',
      medium: 'only medium-complexity changes',
    };
    instructions.push(
      `**Complexity Filter**: Focus on ${filterDescriptions[scopeConfig.complexityFilter]} in the discovered files.`
    );
  }

  if (instructions.length === 0) {
    return '';
  }

  return `## Scope Configuration\n\n${instructions.join('\n')}`;
}
