import type { StepConfigurationStep } from '@/db/schema/step-configurations.schema';

/**
 * Global model defaults for all workflow steps.
 * Stored in electron-store and applied to new projects on creation.
 */
export type GlobalModelDefaults = Partial<Record<StepConfigurationStep, GlobalStepModelDefaults>>;

/**
 * Context value for the GlobalModelDefaults provider.
 */
export interface GlobalModelDefaultsContextValue {
  /** Current global defaults */
  defaults: GlobalModelDefaults;
  /** Whether the defaults have been loaded from storage */
  isLoaded: boolean;
  /** Update all defaults at once */
  setDefaults: (defaults: GlobalModelDefaults) => Promise<void>;
  /** Update defaults for a specific step */
  setStepDefaults: (step: StepConfigurationStep, defaults: GlobalStepModelDefaults) => Promise<void>;
}

/**
 * Model defaults for a single workflow step.
 * All fields are optional - only configured values are stored.
 */
export interface GlobalStepModelDefaults {
  customSystemPrompt?: string;
  customUserPromptTemplate?: string;
  maxTokens?: number;
  modelId?: string;
  modelProvider?: string;
  temperature?: number;
  thinkingBudget?: number;
  thinkingEnabled?: boolean;
}
