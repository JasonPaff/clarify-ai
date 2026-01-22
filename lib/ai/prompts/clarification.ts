// Default prompt template for clarification analysis
export const DEFAULT_CLARIFICATION_PROMPT = `You are an expert software architect and requirements analyst. Your task is to analyze a feature request and generate clarifying questions to better understand the requirements.

## Instructions

1. **Analyze the Feature Request**: Read the feature request carefully and identify:
   - What is being requested
   - What context is provided
   - What technical areas might be affected
   - What details are missing or ambiguous
   - Any relevant context from repository overviews and provided files

2. **Assess Detail Level**: Score the request from 1-5:
   - 1: Very vague, lacks almost all necessary details
   - 2: Basic idea present but missing most specifics
   - 3: Moderate detail, some key areas need clarification
   - 4: Good detail, only minor clarifications needed
   - 5: Excellent detail, comprehensive and clear

3. **Generate Questions**: If the score is below 4, generate 2-4 clarifying questions that would help understand:
   - User requirements and acceptance criteria
   - Technical constraints or preferences
   - Edge cases and error handling
   - Priority and scope boundaries

4. **Provide Options**: For each question, suggest 2-4 concrete options the user can choose from, plus allow custom answers.

## Output Format

Call the \`generateClarifyingQuestions\` tool with:
- A summary of your analysis
- The detail score (1-5)
- Your reasoning for the score
- Any ambiguities you identified
   - Areas of the codebase that might be affected
   - The clarifying questions (if score < 4)

## Repository Context

{repositoryOverviews}

## Additional Context Files

{contextFiles}

## Feature Request

{featureRequest}`;

/** Context file data for clarification prompt */
export interface ClarificationContextFile {
  displayName: string;
  excerpt?: string;
  filePath: string;
  fileType: string;
}

/** Repository overview data for clarification prompt */
export interface ClarificationRepositoryOverview {
  overview: string;
  repositoryId: number;
  repositoryName: string;
  repositoryPath: string;
}

// Build the prompt with the feature request and optional context
export function buildClarificationPrompt(
  featureRequest: string,
  repositoryOverviews?: Array<ClarificationRepositoryOverview>,
  contextFiles?: Array<ClarificationContextFile>,
  customPrompt?: string
): string {
  // Use customPrompt only if it's a non-empty string, otherwise use the default
  const template = customPrompt && customPrompt.trim() ? customPrompt : DEFAULT_CLARIFICATION_PROMPT;

  const repositoryOverviewsSection = buildRepositoryOverviewsSection(repositoryOverviews ?? []);
  const contextFilesSection = buildContextFilesSection(contextFiles ?? []);

  return template
    .replace('{repositoryOverviews}', repositoryOverviewsSection)
    .replace('{contextFiles}', contextFilesSection)
    .replace('{featureRequest}', featureRequest);
}

function buildContextFilesSection(contextFiles: Array<ClarificationContextFile>): string {
  if (contextFiles.length === 0) {
    return 'No additional context files provided.';
  }

  const sections = contextFiles.map((file) => {
    const excerpt = file.excerpt?.trim();
    const excerptSection = excerpt ? `\n\nExcerpt (truncated):\n${excerpt}` : '\n\nExcerpt not available.';

    return `### ${file.displayName}
**Path**: ${file.filePath}
**Type**: ${file.fileType}${excerptSection}`;
  });

  return sections.join('\n\n---\n\n');
}

function buildRepositoryOverviewsSection(repositoryOverviews: Array<ClarificationRepositoryOverview>): string {
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
