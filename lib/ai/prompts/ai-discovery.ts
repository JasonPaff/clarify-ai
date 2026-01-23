/**
 * AI-Assisted File Discovery Prompt Template
 *
 * This module provides the prompt template and builder function for AI-assisted
 * file discovery. The AI analyzes repository structure, file trees, and feature
 * requests to identify relevant files with contextual justifications.
 */

// ============================================================================
// Types
// ============================================================================

/** Configuration options for the AI discovery prompt */
export interface AiDiscoveryPromptOptions {
  /** Optional clarification context from previous step */
  clarificationContext?: string;
  /** Custom prompt template to use instead of the default */
  customPrompt?: string;
  /** The feature request description */
  featureRequest: string;
  /** Pruned file tree structure from the repository */
  fileTree: string;
  /** Maximum number of files to return (default: 50) */
  maxFiles?: number;
  /** Array of repository overview data */
  repositoryOverviews: Array<AiDiscoveryRepositoryOverview>;
  /** Optional user hints to guide the discovery */
  userHints?: string;
}

/** Repository overview data for AI discovery prompt */
export interface AiDiscoveryRepositoryOverview {
  overview: string;
  repositoryId: number;
  repositoryName: string;
  repositoryPath: string;
}

// ============================================================================
// Default Prompt Template
// ============================================================================

/**
 * Default prompt template for AI-assisted file discovery.
 * Instructs the AI to analyze the file tree and repository context to identify
 * relevant files with 1-2 sentence justifications for each.
 */
export const DEFAULT_AI_DISCOVERY_PROMPT = `You are an expert codebase analyst who identifies files relevant to implementing a feature request. You analyze project structure, repository context, and file organization to return a curated list of files essential for implementation.

## Instructions

1. **Analyze the File Tree**: Examine the repository structure provided to understand:
   - How the codebase is organized (feature-based, layer-based, etc.)
   - Naming conventions and patterns used
   - Key directories for components, utilities, configuration, and tests

2. **Review Repository Context**: Use the repository overviews to understand:
   - The technology stack and frameworks in use
   - Architectural patterns and conventions
   - Existing feature implementations you can reference

3. **Identify Relevant Files**: Based on the feature request, identify files that:
   - **Need modification**: Existing files that must change to implement the feature
   - **Serve as templates**: Files with patterns to follow for new implementations
   - **Provide integration points**: Files where the new feature connects to existing code
   - **Require review**: Files that may be affected indirectly or need compatibility checks

4. **Provide Justifications**: For EACH file you identify, provide a 1-2 sentence justification explaining:
   - Why this specific file is relevant to the feature
   - What role it plays in the implementation (modify, reference, integrate, etc.)
   - The justification must be concrete and specific, not generic

## Output Requirements

Call the \`discoverFiles\` tool with your findings. For each file, include:
- **path**: The full file path as shown in the file tree
- **action**: One of 'modify' (needs changes), 'create' (new file), 'review' (check compatibility), or 'delete' (remove)
- **risk**: Assessment of modification risk - 'low', 'medium', or 'high'
- **justification**: A clear 1-2 sentence explanation of why this file matters for the feature
- **confidence**: Your confidence score (0-100) that this file is relevant

Also provide:
- **summary**: A brief overview of your analysis and the key files identified
- **reasoning**: Your thought process for how you selected these files
- **totalFilesAnalyzed**: The approximate number of files you reviewed from the tree

## Quality Standards

- Be thorough but precise - include all necessary files without adding irrelevant ones
- Prioritize files by their importance to the core implementation
- Ensure justifications are specific and actionable, not vague or generic
- Consider both direct implementation files and supporting infrastructure
- Limit your response to at most {maxFiles} files, focusing on the most critical ones
- If the feature request mentions specific files or directories, prioritize those

{userHints}

## Repository Context

{repositoryOverviews}

{clarificationContext}

## File Tree

The following is the pruned file tree of the repository. Use this to identify relevant files:

\`\`\`
{fileTree}
\`\`\`

## Feature Request

{featureRequest}`;

// ============================================================================
// Builder Function
// ============================================================================

/**
 * Build the AI discovery prompt by replacing template variables with actual data.
 *
 * @param options - Configuration options for building the prompt
 * @returns The prompt with all template variables replaced
 *
 * @example
 * ```typescript
 * const prompt = buildAiDiscoveryPrompt({
 *   featureRequest: "Add dark mode toggle to settings",
 *   fileTree: "src/\n  components/\n  settings/",
 *   repositoryOverviews: [{ repositoryName: "app", ... }],
 *   maxFiles: 30,
 * });
 * ```
 */
export function buildAiDiscoveryPrompt(options: AiDiscoveryPromptOptions): string {
  const {
    clarificationContext,
    customPrompt,
    featureRequest,
    fileTree,
    maxFiles = 50,
    repositoryOverviews,
    userHints,
  } = options;

  // Use customPrompt only if it's a non-empty string, otherwise use the default
  const template = customPrompt && customPrompt.trim() ? customPrompt : DEFAULT_AI_DISCOVERY_PROMPT;

  // Build the repository overviews section
  const repositoryOverviewsSection = buildRepositoryOverviewsSection(repositoryOverviews);

  // Build the clarification context section
  const clarificationSection = clarificationContext
    ? `## Clarification Context\n\nThe following clarifications have been gathered about this feature request:\n\n${clarificationContext}`
    : '';

  // Build the user hints section
  const userHintsSection = userHints
    ? `## User Hints\n\nThe user has provided the following guidance for file discovery:\n\n${userHints}`
    : '';

  // Replace template variables with actual data
  return template
    .replace('{maxFiles}', String(maxFiles))
    .replace('{userHints}', userHintsSection)
    .replace('{repositoryOverviews}', repositoryOverviewsSection)
    .replace('{clarificationContext}', clarificationSection)
    .replace('{fileTree}', fileTree)
    .replace('{featureRequest}', featureRequest);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build repository overviews section for the prompt.
 *
 * @param repositoryOverviews - Array of repository overview data
 * @returns Formatted repository overviews string
 */
function buildRepositoryOverviewsSection(repositoryOverviews: Array<AiDiscoveryRepositoryOverview>): string {
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
