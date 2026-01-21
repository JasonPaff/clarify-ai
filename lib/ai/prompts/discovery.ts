import type { DiscoveryScopeConfig } from '../../validations/discovery';

/** Repository overview data for discovery prompt */
export interface DiscoveryRepositoryOverview {
  overview: string;
  repositoryId: number;
  repositoryName: string;
  repositoryPath: string;
}

// Default prompt template for file discovery analysis
// Based on the file-discovery-agent prompt structure
export const DEFAULT_DISCOVERY_PROMPT = `You are an expert codebase analysis agent who identifies all files relevant to implementing a feature request. You will analyze the project structure, search for relevant files, and return a curated list of files that are essential for implementing the requested feature.

## Instructions

1. **Analyze Project Structure**: Examine the codebase architecture to understand how features are organized, identify naming conventions, and locate relevant directories based on the project's folder structure and patterns.

2. **Conduct Systematic File Discovery**: Use multiple discovery strategies including:
   - Pattern-based searches using relevant keywords and file naming conventions
   - Directory traversal focusing on areas likely to contain related functionality
   - Content analysis to validate file relevance and understand existing implementations
   - Cross-reference analysis to find integration points and dependencies

3. **Validate and Prioritize Files**: For each discovered file, assess its relevance by:
   - Reading file contents to understand current functionality
   - Identifying key exports, components, and integration points
   - Determining the level of modification needed (core implementation vs. supporting changes)
   - Categorizing files by implementation priority

4. **Provide Comprehensive Analysis**: Return your findings using the \`discoverFiles\` tool with:
   - A summary of your analysis and discovery process
   - Discovered files with their paths, actions needed, risk levels, and reasons
   - Architecture insights about patterns and integration points

## Quality Standards

- Be thorough but precise - include all necessary files without adding irrelevant ones
- Prioritize files accurately based on their role in the implementation
- Provide actionable insights about existing patterns and recommended approaches
- Validate file relevance by examining file contents, not just file names
- Consider both direct implementation files and supporting infrastructure that may need updates
- Identify potential integration challenges or conflicts with existing functionality

{scopeInstructions}

## Repository Context

{repositoryOverviews}

{clarificationContext}

## Feature Request

{featureRequest}`;

/**
 * Build the discovery prompt by replacing template variables with actual data.
 *
 * @param featureRequest - The feature request description
 * @param repositoryOverviews - Array of repository overview data
 * @param clarificationContext - Optional clarification context from previous step
 * @param scopeConfig - Optional scope configuration for discovery
 * @param customPrompt - Optional custom prompt template to use instead of the default
 * @returns The prompt with all template variables replaced
 */
export function buildDiscoveryPrompt(
  featureRequest: string,
  repositoryOverviews: Array<DiscoveryRepositoryOverview>,
  clarificationContext?: string,
  scopeConfig?: DiscoveryScopeConfig,
  customPrompt?: string
): string {
  // Use customPrompt only if it's a non-empty string, otherwise use the default
  const template = customPrompt && customPrompt.trim() ? customPrompt : DEFAULT_DISCOVERY_PROMPT;

  // Build the scope instructions section
  const scopeInstructions = buildScopeInstructions(scopeConfig);

  // Build the repository overviews section
  const repositoryOverviewsSection = buildRepositoryOverviewsSection(repositoryOverviews);

  // Build the clarification context section
  const clarificationSection = clarificationContext
    ? `## Clarification Context\n\nThe following clarifications have been gathered about this feature request:\n\n${clarificationContext}`
    : '';

  // Replace template variables with actual data
  return template
    .replace('{scopeInstructions}', scopeInstructions)
    .replace('{repositoryOverviews}', repositoryOverviewsSection)
    .replace('{clarificationContext}', clarificationSection)
    .replace('{featureRequest}', featureRequest);
}

/**
 * Build repository overviews section for the prompt.
 *
 * @param repositoryOverviews - Array of repository overview data
 * @returns Formatted repository overviews string
 */
function buildRepositoryOverviewsSection(repositoryOverviews: Array<DiscoveryRepositoryOverview>): string {
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
 * @param scopeConfig - Optional scope configuration for discovery
 * @returns Formatted scope instructions string
 */
function buildScopeInstructions(scopeConfig?: DiscoveryScopeConfig): string {
  if (!scopeConfig) {
    return '';
  }

  const instructions: Array<string> = [];

  if (scopeConfig.includePatterns && scopeConfig.includePatterns.length > 0) {
    instructions.push(
      `**Include Patterns**: Focus on files matching these patterns: ${scopeConfig.includePatterns.join(', ')}`
    );
  }

  if (scopeConfig.excludePatterns && scopeConfig.excludePatterns.length > 0) {
    instructions.push(
      `**Exclude Patterns**: Do not include files matching these patterns: ${scopeConfig.excludePatterns.join(', ')}`
    );
  }

  if (scopeConfig.maxFiles) {
    instructions.push(
      `**Maximum Files**: Limit your response to at most ${scopeConfig.maxFiles} files, prioritizing the most relevant ones.`
    );
  }

  if (scopeConfig.repositoryIds && scopeConfig.repositoryIds.length > 0) {
    instructions.push(
      `**Repository Scope**: Only analyze repositories with IDs: ${scopeConfig.repositoryIds.join(', ')}`
    );
  }

  if (instructions.length === 0) {
    return '';
  }

  return `## Scope Configuration\n\n${instructions.join('\n')}`;
}
