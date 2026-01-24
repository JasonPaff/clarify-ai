import type { StepConfigurationStep } from '@/db/schema/step-configurations.schema';
import type { FullModelId } from '@/lib/ai/models';

/**
 * Context for where AI settings are being used.
 * Determines UI variant and available features.
 */
export type AISettingsContext =
  | 'dialog-override' // Temporary override in dialogs (e.g., overview generation)
  | 'global-settings' // App settings page
  | 'project-settings' // Project settings page
  | 'workflow-step'; // Inline in workflow (Clarify/Discover/Plan)

/**
 * Keys of AISettingsValues for type-safe iteration and modification tracking.
 */
export type AISettingsKey = keyof AISettingsValues;

/**
 * Record tracking which settings have been modified from their defaults.
 */
export type AISettingsModifications = Record<AISettingsKey, boolean>;

/**
 * Persistence mode for settings changes.
 * - 'immediate': Changes persist immediately (settings pages, workflow steps)
 * - 'local': Changes stay local until explicitly saved (dialogs with temporary overrides)
 */
export type AISettingsPersistenceMode = 'immediate' | 'local';

/**
 * Metadata for a workflow step that uses AI settings.
 */
export interface AISettingsStepInfo {
  /** Description of what the step does */
  description: string;
  /** Display label for the step */
  label: string;
  /** Step identifier */
  step: StepConfigurationStep;
}

/**
 * The complete set of AI model settings parameters.
 * This is the canonical type used throughout the application for all AI settings contexts.
 */
export interface AISettingsValues {
  /** Custom system prompt to override the default prompt for this step */
  customSystemPrompt?: string;
  /** Maximum number of tokens the model can generate (100-16000) */
  maxTokens?: number;
  /** Full model identifier in format "provider:modelId" */
  modelId?: FullModelId | null;
  /** Temperature value for controlling randomness (0-2) */
  temperature?: number;
  /** Token budget for extended thinking mode (1024-128000) */
  thinkingBudget?: number;
  /** Whether extended thinking is enabled for models that support it */
  thinkingEnabled?: boolean;
}

/**
 * Settings values with modification tracking.
 * Used when showing which values differ from defaults (e.g., "Modified" badges).
 */
export interface AISettingsWithModifications {
  /** Whether any field is modified from defaults */
  hasAnyModification: boolean;
  /** Which individual fields are modified */
  modifications: AISettingsModifications;
  /** Current settings values */
  values: AISettingsValues;
}

/**
 * All workflow steps that have configurable AI settings.
 */
export const WORKFLOW_STEPS: ReadonlyArray<AISettingsStepInfo> = [
  {
    description: 'Generates clarifying questions to refine feature requests',
    label: 'Clarify',
    step: 'refine',
  },
  {
    description: 'Discovers relevant files and code patterns',
    label: 'Discover',
    step: 'research',
  },
  {
    description: 'Creates the implementation plan',
    label: 'Plan',
    step: 'plan',
  },
  {
    description: 'Generates AI-powered repository overviews',
    label: 'Overview',
    step: 'overview',
  },
] as const;
