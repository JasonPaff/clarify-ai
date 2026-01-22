'use client';

import type { ComponentPropsWithRef } from 'react';

import { ChevronDown, Settings2 } from 'lucide-react';
import { useMemo } from 'react';

import type { StepConfigurationStep } from '@/db/schema/step-configurations.schema';
import type { FullModelId } from '@/lib/ai/models';

import { ModelSelector } from '@/components/features/clarification/model-selector';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';
import { useStepConfig, useUpsertStepConfig } from '@/hooks/queries/use-step-configurations';
import { getModelInfo } from '@/lib/ai/models';
import { cn } from '@/lib/utils';

import { ParameterSlider } from './parameter-slider';
import { ThinkingBudgetControl } from './thinking-budget-control';

const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 4096;
const DEFAULT_THINKING_BUDGET = 8192;

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

            {/* Custom System Prompt */}
            <div className={'flex flex-col gap-1.5 sm:gap-2'}>
              <div className={'flex items-center justify-between'}>
                <label className={'text-xs font-medium sm:text-sm'} htmlFor={`custom-prompt-${step}`}>
                  Custom System Prompt
                </label>
                {config?.customSystemPrompt && (
                  <button
                    className={'text-xs text-muted-foreground hover:text-foreground'}
                    onClick={() => handleCustomPromptBlur('')}
                    type={'button'}
                  >
                    Reset
                  </button>
                )}
              </div>
              <p className={'text-xs text-muted-foreground'}>
                Override the default system prompt for this step. Leave empty to use the default.
              </p>
              <Textarea
                className={'min-h-24 font-mono text-xs sm:min-h-32'}
                defaultValue={config?.customSystemPrompt ?? ''}
                disabled={isLoading || upsertMutation.isPending}
                id={`custom-prompt-${step}`}
                onBlur={(e) => handleCustomPromptBlur(e.target.value)}
                placeholder={'Enter custom system prompt...'}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
