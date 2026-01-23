'use client';

import type { ComponentPropsWithRef } from 'react';

import { ChevronDown, FolderSearch, Settings2 } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import type { StepConfigurationStep } from '@/db/schema/step-configurations.schema';
import type { FullModelId } from '@/lib/ai/models';

import { ModelSelector } from '@/components/features/clarification/model-selector';
import { DefaultPromptViewer } from '@/components/features/workflow/default-prompt-viewer';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  NumberInputDecrement,
  NumberInputField,
  NumberInputGroup,
  NumberInputIncrement,
  NumberInputRoot,
} from '@/components/ui/number-input';
import { Textarea } from '@/components/ui/textarea';
import { useStepConfig, useUpsertStepConfig } from '@/hooks/queries/use-step-configurations';
import { getModelInfo } from '@/lib/ai/models';
import { getPromptMetadata } from '@/lib/ai/prompts/prompt-metadata';
import { cn } from '@/lib/utils';

import { ParameterSlider } from './parameter-slider';
import { ThinkingBudgetControl } from './thinking-budget-control';

const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 4096;
const DEFAULT_THINKING_BUDGET = 8192;
const DEFAULT_AI_DISCOVERY_MAX_FILES = 50;
const DEFAULT_AI_DISCOVERY_TOKEN_BUDGET = 100000;

interface StepSettingsPanelProps extends ComponentPropsWithRef<'div'> {
  projectId: number;
  step: StepConfigurationStep;
}

export const StepSettingsPanel = ({ className, projectId, ref, step, ...props }: StepSettingsPanelProps) => {
  const { data: config, isLoading } = useStepConfig(projectId, step);
  const upsertMutation = useUpsertStepConfig();

  const currentModelId = useMemo(() => {
    if (config?.modelProvider && config?.modelId) {
      return `${config.modelProvider}:${config.modelId}` as FullModelId;
    }
    return null;
  }, [config?.modelProvider, config?.modelId]);

  const modelInfo = useMemo(() => {
    if (currentModelId) {
      return getModelInfo(currentModelId);
    }
    return undefined;
  }, [currentModelId]);

  const isSupportsThinking = modelInfo?.supportsThinking ?? false;

  const isCustomized = useMemo(() => {
    if (!config) return false;
    return (
      config.modelId !== null ||
      config.temperature !== null ||
      config.maxTokens !== null ||
      config.thinkingEnabled ||
      (config.customSystemPrompt !== null && config.customSystemPrompt !== '')
    );
  }, [config]);

  // Track the server value to detect when it changes externally
  const serverPromptRef = useRef(config?.customSystemPrompt ?? '');
  const [localPrompt, setLocalPrompt] = useState(config?.customSystemPrompt ?? '');

  // Sync local state when server value changes (e.g., after mutation or different config loads)
  const serverPrompt = config?.customSystemPrompt ?? '';
  if (serverPromptRef.current !== serverPrompt) {
    serverPromptRef.current = serverPrompt;
    setLocalPrompt(serverPrompt);
  }

  const promptMetadata = useMemo(() => getPromptMetadata(step), [step]);

  const handleUseAsStartingPoint = (prompt: string) => {
    setLocalPrompt(prompt);
    handleCustomPromptBlur(prompt);
  };

  const handleModelChange = (fullModelId: FullModelId) => {
    const [provider, ...modelParts] = fullModelId.split(':');
    const modelId = modelParts.join(':');

    upsertMutation.mutate({
      data: {
        modelId,
        modelProvider: provider,
      },
      projectId,
      step,
    });
  };

  const handleTemperatureChange = (value: number) => {
    upsertMutation.mutate({
      data: {
        temperature: value,
      },
      projectId,
      step,
    });
  };

  const handleMaxTokensChange = (value: number) => {
    upsertMutation.mutate({
      data: {
        maxTokens: value,
      },
      projectId,
      step,
    });
  };

  const handleThinkingEnabledChange = (isEnabled: boolean) => {
    upsertMutation.mutate({
      data: {
        thinkingBudget: isEnabled ? (config?.thinkingBudget ?? DEFAULT_THINKING_BUDGET) : null,
        thinkingEnabled: isEnabled,
      },
      projectId,
      step,
    });
  };

  const handleThinkingBudgetChange = (budget: number) => {
    upsertMutation.mutate({
      data: {
        thinkingBudget: budget,
      },
      projectId,
      step,
    });
  };

  const handleCustomPromptBlur = (value: string) => {
    upsertMutation.mutate({
      data: {
        customSystemPrompt: value || null,
      },
      projectId,
      step,
    });
  };

  // AI Discovery settings local state (for research step only)
  const serverIgnorePatternsRef = useRef(config?.aiDiscoveryIgnorePatterns ?? '');
  const [localIgnorePatterns, setLocalIgnorePatterns] = useState(config?.aiDiscoveryIgnorePatterns ?? '');

  // Sync ignore patterns local state when server value changes
  const serverIgnorePatterns = config?.aiDiscoveryIgnorePatterns ?? '';
  if (serverIgnorePatternsRef.current !== serverIgnorePatterns) {
    serverIgnorePatternsRef.current = serverIgnorePatterns;
    setLocalIgnorePatterns(serverIgnorePatterns);
  }

  const isResearchStep = step === 'research';

  const handleAiDiscoveryMaxFilesChange = (value: null | number) => {
    upsertMutation.mutate({
      data: {
        aiDiscoveryMaxFiles: value ?? DEFAULT_AI_DISCOVERY_MAX_FILES,
      },
      projectId,
      step,
    });
  };

  const handleAiDiscoveryTokenBudgetChange = (value: null | number) => {
    upsertMutation.mutate({
      data: {
        aiDiscoveryTokenBudget: value,
      },
      projectId,
      step,
    });
  };

  const handleAiDiscoveryIgnorePatternsBlur = (value: string) => {
    upsertMutation.mutate({
      data: {
        aiDiscoveryIgnorePatterns: value || null,
      },
      projectId,
      step,
    });
  };

  const stepLabel = useMemo(() => {
    switch (step) {
      case 'plan':
        return 'Plan';
      case 'refine':
        return 'Clarify';
      case 'research':
        return 'Discover';
      default:
        return step;
    }
  }, [step]);

  const formatTemperature = (value: number) => value.toFixed(1);

  const formatMaxTokens = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return String(value);
  };

  return (
    <div className={cn('w-full', className)} ref={ref} {...props}>
      <Collapsible defaultOpen={false}>
        {/* Trigger */}
        <CollapsibleTrigger
          className={cn(
            'flex w-full items-center justify-between rounded-md border border-border bg-card px-2.5 py-1.5 text-left text-xs sm:px-3 sm:py-2 sm:text-sm',
            'transition-colors hover:bg-muted/50'
          )}
          isHideChevron
        >
          <div className={'flex items-center gap-1.5 sm:gap-2'}>
            <Settings2 className={'size-3.5 text-muted-foreground sm:size-4'} />
            <span className={'font-medium'}>{stepLabel} Settings</span>
            {isCustomized && (
              <span className={'hidden rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent sm:inline'}>
                Customized
              </span>
            )}
          </div>
          <ChevronDown
            className={'size-3.5 text-muted-foreground transition-transform in-data-panel-open:rotate-180 sm:size-4'}
          />
        </CollapsibleTrigger>

        {/* Content */}
        <CollapsibleContent className={'mt-2'}>
          <div className={'space-y-4 rounded-md border border-border bg-card p-3 sm:space-y-6 sm:p-4'}>
            {/* Model Selection */}
            <div className={'flex flex-col gap-1.5 sm:gap-2'}>
              <label className={'text-xs font-medium sm:text-sm'}>Model</label>
              <ModelSelector
                isDisabled={isLoading || upsertMutation.isPending}
                onValueChange={handleModelChange}
                value={currentModelId}
              />
            </div>

            {/* Parameter Controls - Stack on mobile, side-by-side on larger screens */}
            <div className={'flex flex-col gap-4 sm:gap-6 md:flex-row md:gap-8'}>
              {/* Temperature Slider */}
              <div className={'flex-1'}>
                <ParameterSlider
                  description={'Controls randomness. Lower values are more focused, higher values more creative.'}
                  formatValue={formatTemperature}
                  isDisabled={isLoading || upsertMutation.isPending}
                  label={'Temperature'}
                  max={2}
                  min={0}
                  onValueChange={handleTemperatureChange}
                  step={0.1}
                  value={config?.temperature ?? DEFAULT_TEMPERATURE}
                />
              </div>

              {/* Max Tokens Slider */}
              <div className={'flex-1'}>
                <ParameterSlider
                  description={'Maximum number of tokens the model can generate in the response.'}
                  formatValue={formatMaxTokens}
                  isDisabled={isLoading || upsertMutation.isPending}
                  label={'Max Tokens'}
                  max={16000}
                  min={100}
                  onValueChange={handleMaxTokensChange}
                  step={100}
                  value={config?.maxTokens ?? DEFAULT_MAX_TOKENS}
                />
              </div>
            </div>

            {/* Thinking Budget Control */}
            <ThinkingBudgetControl
              budget={config?.thinkingBudget ?? DEFAULT_THINKING_BUDGET}
              isDisabled={isLoading || upsertMutation.isPending}
              isEnabled={config?.thinkingEnabled ?? false}
              isSupportsThinking={isSupportsThinking}
              onBudgetChange={handleThinkingBudgetChange}
              onEnabledChange={handleThinkingEnabledChange}
            />

            {/* AI Discovery Settings - Only shown for research step */}
            {isResearchStep && (
              <Collapsible defaultOpen={false}>
                <CollapsibleTrigger
                  className={cn(
                    'flex w-full items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 text-left text-sm',
                    'transition-colors hover:bg-muted/50'
                  )}
                  isHideChevron
                >
                  <div className={'flex items-center gap-2'}>
                    <FolderSearch className={'size-4 text-muted-foreground'} />
                    <span className={'font-medium'}>AI Discovery Settings</span>
                  </div>
                  <ChevronDown
                    className={
                      'size-4 text-muted-foreground transition-transform in-data-panel-open:rotate-180'
                    }
                  />
                </CollapsibleTrigger>

                <CollapsibleContent className={'mt-2'}>
                  <div className={'space-y-4 rounded-md border border-border bg-muted/10 p-3'}>
                    {/* Max Files and Token Budget - Side by side */}
                    <div className={'flex flex-col gap-4 sm:flex-row sm:gap-6'}>
                      {/* Max Files */}
                      <div className={'flex flex-col gap-1.5'}>
                        <label className={'text-xs font-medium sm:text-sm'}>Max Files</label>
                        <p className={'text-xs text-muted-foreground'}>
                          Maximum number of files to include in discovery results.
                        </p>
                        <NumberInputRoot
                          disabled={isLoading || upsertMutation.isPending}
                          max={200}
                          min={1}
                          onValueChange={handleAiDiscoveryMaxFilesChange}
                          step={5}
                          value={config?.aiDiscoveryMaxFiles ?? DEFAULT_AI_DISCOVERY_MAX_FILES}
                        >
                          <NumberInputGroup>
                            <NumberInputDecrement size={'sm'} />
                            <NumberInputField size={'sm'} />
                            <NumberInputIncrement size={'sm'} />
                          </NumberInputGroup>
                        </NumberInputRoot>
                      </div>

                      {/* Token Budget */}
                      <div className={'flex flex-col gap-1.5'}>
                        <label className={'text-xs font-medium sm:text-sm'}>Token Budget</label>
                        <p className={'text-xs text-muted-foreground'}>
                          Maximum tokens for file content in discovery context.
                        </p>
                        <NumberInputRoot
                          disabled={isLoading || upsertMutation.isPending}
                          max={500000}
                          min={10000}
                          onValueChange={handleAiDiscoveryTokenBudgetChange}
                          step={10000}
                          value={config?.aiDiscoveryTokenBudget ?? DEFAULT_AI_DISCOVERY_TOKEN_BUDGET}
                        >
                          <NumberInputGroup>
                            <NumberInputDecrement size={'sm'} />
                            <NumberInputField size={'sm'} />
                            <NumberInputIncrement size={'sm'} />
                          </NumberInputGroup>
                        </NumberInputRoot>
                      </div>
                    </div>

                    {/* Ignore Patterns */}
                    <div className={'flex flex-col gap-1.5'}>
                      <label className={'text-xs font-medium sm:text-sm'}>Additional Ignore Patterns</label>
                      <p className={'text-xs text-muted-foreground'}>
                        Add extra glob patterns to exclude from discovery (one per line). These are added to
                        the default patterns.
                      </p>
                      <Textarea
                        className={'min-h-20 font-mono text-xs'}
                        disabled={isLoading || upsertMutation.isPending}
                        onBlur={(e) => handleAiDiscoveryIgnorePatternsBlur(e.target.value)}
                        onChange={(e) => setLocalIgnorePatterns(e.target.value)}
                        placeholder={'**/generated/**\n*.min.js\n**/vendor/**'}
                        value={localIgnorePatterns}
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Custom System Prompt */}
            <div className={'flex flex-col gap-1.5 sm:gap-2'}>
              <div className={'flex items-center justify-between'}>
                <label className={'text-xs font-medium sm:text-sm'} htmlFor={`custom-prompt-${step}`}>
                  Custom System Prompt
                </label>
                {localPrompt && (
                  <button
                    className={'text-xs text-muted-foreground hover:text-foreground'}
                    onClick={() => {
                      setLocalPrompt('');
                      handleCustomPromptBlur('');
                    }}
                    type={'button'}
                  >
                    Clear custom prompt (use default)
                  </button>
                )}
              </div>
              <p className={'text-xs text-muted-foreground'}>
                Override the default system prompt for this step. Leave empty to use the default.
              </p>
              <Textarea
                className={'min-h-24 font-mono text-xs sm:min-h-32'}
                disabled={isLoading || upsertMutation.isPending}
                id={`custom-prompt-${step}`}
                onBlur={(e) => handleCustomPromptBlur(e.target.value)}
                onChange={(e) => setLocalPrompt(e.target.value)}
                placeholder={'Enter custom system prompt...'}
                value={localPrompt}
              />

              {/* Default Prompt Viewer */}
              <DefaultPromptViewer
                defaultPrompt={promptMetadata.defaultPrompt}
                isDisabled={isLoading || upsertMutation.isPending}
                onUseAsStartingPoint={handleUseAsStartingPoint}
                variables={promptMetadata.variables}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
