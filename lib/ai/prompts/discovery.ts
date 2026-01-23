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

## Available Tools

You have access to the following tools to explore the codebase. All tools require a \`repositoryId\` parameter - find the repository ID in the "Repository Context" section below.

1. **searchFiles** - Find files by glob pattern
   - Use for: Finding files by naming convention (e.g., \`**/*.schema.ts\`, \`src/components/*.tsx\`)
   - Parameters: \`repositoryId\` (required), \`pattern\` (glob pattern)
   - Example: \`searchFiles({ repositoryId: 1, pattern: "**/*.schema.ts" })\`

2. **searchContent** - Search file contents with text/regex patterns
   - Use for: Finding code patterns, function calls, class definitions, variable usage
   - Parameters: \`repositoryId\` (required), \`pattern\` (text or regex), \`fileExtensions\` (optional), \`contextLines\` (optional)
   - Example: \`searchContent({ repositoryId: 1, pattern: "useQuery", fileExtensions: ["ts", "tsx"] })\`

3. **readFile** - Read a specific file's contents
   - Use for: Examining file context before including in discovery results
   - Parameters: \`repositoryId\` (required), \`filePath\` (relative to repo root), \`startLine\`/\`endLine\` (optional)
   - Example: \`readFile({ repositoryId: 1, filePath: "src/hooks/useAuth.ts" })\`

4. **getProjectStructure** - Get directory tree structure
   - Use for: Understanding codebase organization, exploring unfamiliar areas
   - Parameters: \`repositoryId\` (required), \`directory\` (optional subdirectory), \`maxDepth\` (1-6, default 3)
   - Example: \`getProjectStructure({ repositoryId: 1, directory: "src/components", maxDepth: 2 })\`

5. **findRelatedFiles** - Find import/export relationships
   - Use for: Understanding dependencies, impact analysis, finding integration points
   - Parameters: \`repositoryId\` (required), \`filePath\` (required), \`direction\` ('imports' or 'importedBy')
   - Example: \`findRelatedFiles({ repositoryId: 1, filePath: "src/lib/utils.ts", direction: "importedBy" })\`

## Recommended Discovery Strategy

1. **Start with structure**: Use \`getProjectStructure\` to understand the codebase layout and identify key directories
2. **Find by convention**: Use \`searchFiles\` to find files matching naming patterns relevant to the feature
3. **Search for patterns**: Use \`searchContent\` to find specific code patterns, existing implementations, or related functionality
4. **Examine context**: Use \`readFile\` to examine promising files before including them in discovery
5. **Analyze dependencies**: Use \`findRelatedFiles\` to discover files that depend on or are depended upon by key files
6. **Compile results**: Call \`discoverFiles\` with your final curated list of files

## Instructions

1. **Analyze Project Structure**: Use the tools to examine the codebase architecture, understand how features are organized, and identify naming conventions.

2. **Conduct Systematic File Discovery**: Use multiple discovery strategies:
   - Pattern-based searches using \`searchFiles\` for file naming conventions
   - Content searches using \`searchContent\` for code patterns and implementations
   - Structure exploration using \`getProjectStructure\` for directory organization
   - Dependency analysis using \`findRelatedFiles\` for integration points

3. **Validate and Prioritize Files**: For each discovered file:
   - Use \`readFile\` to examine contents and understand functionality
   - Identify key exports, components, and integration points
   - Determine the level of modification needed (core implementation vs. supporting changes)
   - Categorize files by implementation priority

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
