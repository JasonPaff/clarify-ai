import type { StepConfigurationStep } from '@/db/schema/step-configurations.schema';

import { DEFAULT_CLARIFICATION_PROMPT } from './clarification';
import { DEFAULT_DISCOVERY_PROMPT } from './discovery';
import { DEFAULT_PLAN_PROMPT } from './plan';
import { DEFAULT_REPOSITORY_OVERVIEW_PROMPT } from './repository-overview';

/** Complete metadata for a prompt type */
export interface PromptMetadata {
  /** The default prompt template text */
  defaultPrompt: string;
  /** Array of variables used in this prompt */
  variables: Array<PromptVariable>;
}

/** Variable definition for prompt templates */
export interface PromptVariable {
  /** Human-readable description of what the variable contains */
  description: string;
  /** Variable name as it appears in the template (e.g., "{featureRequest}") */
  name: string;
}

/** Prompt metadata keyed by step configuration step */
export const PROMPT_METADATA: Record<StepConfigurationStep, PromptMetadata> = {
  describe: {
    defaultPrompt: '',
    variables: [],
  },
  overview: {
    defaultPrompt: DEFAULT_REPOSITORY_OVERVIEW_PROMPT,
    variables: [
      { description: 'Name of the repository being analyzed', name: '{{repositoryName}}' },
      { description: 'File system path to the repository', name: '{{repositoryPath}}' },
      { description: 'Complete file tree structure of the repository', name: '{{fileTree}}' },
      { description: 'Contents of package.json if present', name: '{{packageJson}}' },
      { description: 'Contents of tsconfig.json if present', name: '{{tsConfig}}' },
      { description: 'Contents of README file if present', name: '{{readme}}' },
      { description: 'Other detected configuration files and metadata', name: '{{otherConfigs}}' },
    ],
  },
  plan: {
    defaultPrompt: DEFAULT_PLAN_PROMPT,
    variables: [
      { description: 'Optional scope configuration instructions', name: '{scopeInstructions}' },
      { description: 'Repository context and overview information', name: '{repositoryOverviews}' },
      { description: 'Answers to clarifying questions from the refine step', name: '{clarificationContext}' },
      { description: 'List of discovered files grouped by action type', name: '{discoveredFiles}' },
      { description: 'The original feature request description', name: '{featureRequest}' },
    ],
  },
  refine: {
    defaultPrompt: DEFAULT_CLARIFICATION_PROMPT,
    variables: [
      { description: 'Repository context and overview information', name: '{repositoryOverviews}' },
      { description: 'Additional context files and content', name: '{contextFiles}' },
      { description: 'The feature request to analyze for clarification', name: '{featureRequest}' },
    ],
  },
  research: {
    defaultPrompt: DEFAULT_DISCOVERY_PROMPT,
    variables: [
      { description: 'Optional scope configuration instructions', name: '{scopeInstructions}' },
      { description: 'Repository context and overview information', name: '{repositoryOverviews}' },
      { description: 'Answers to clarifying questions from the refine step', name: '{clarificationContext}' },
      { description: 'The original feature request description', name: '{featureRequest}' },
    ],
  },
};

/** Get prompt metadata for a specific step */
export function getPromptMetadata(step: StepConfigurationStep): PromptMetadata {
  return PROMPT_METADATA[step];
}
