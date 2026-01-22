'use client';

import type { ComponentPropsWithRef } from 'react';

import { ChevronDown } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import type { StepConfigurationStep } from '@/db/schema/step-configurations.schema';
import type { FullModelId } from '@/lib/ai/models';

import { ModelSelector } from '@/components/features/clarification/model-selector';
import { ParameterSlider } from '@/components/features/workflow/parameter-slider';
import { ThinkingBudgetControl } from '@/components/features/workflow/thinking-budget-control';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';
import { DEFAULT_MAX_TOKENS, DEFAULT_TEMPERATURE, DEFAULT_THINKING_BUDGET } from '@/lib/ai/global-model-defaults';
import { getModelInfo } from '@/lib/ai/models';
import { cn } from '@/lib/utils';

/**
 * Model defaults for a single workflow step.
 * Used by both global settings and project-level settings.
 */
export interface StepModelDefaults {
  customSystemPrompt?: string;
  maxTokens?: number;
  modelId?: string;
  modelProvider?: string;
  temperature?: number;
  thinkingBudget?: number;
  thinkingEnabled?: boolean;
}

interface StepModelSectionProps extends Omit<ComponentPropsWithRef<'div'>, 'onUpdate'> {
  /** Current defaults for this step */
  defaults: StepModelDefaults | undefined;
  /** Description of the workflow step */
  description: string;
  /** Whether controls are disabled */
  isDisabled?: boolean;
  /** Display label for the step */
  label: string;
  /** Callback when any value changes */
  onUpdate: (updates: StepModelDefaults) => void;
  /** The workflow step being configured */
  step: StepConfigurationStep;
}

export const StepModelSection = ({
  className,
  defaults,
  description,
  isDisabled = false,
  label,
  onUpdate,
  ref,
  step,
  ...props
}: StepModelSectionProps) => {
  const [localSystemPrompt, setLocalSystemPrompt] = useState(defaults?.customSystemPrompt ?? '');

  const currentModelId = useMemo(() => {
    if (defaults?.modelProvider && defaults?.modelId) {
      return `${defaults.modelProvider}:${defaults.modelId}` as FullModelId;
    }
    return null;
  }, [defaults?.modelProvider, defaults?.modelId]);

  const modelInfo = useMemo(() => {
    if (currentModelId) {
      return getModelInfo(currentModelId);
    }
    return undefined;
  }, [currentModelId]);

  const isSupportsThinking = modelInfo?.supportsThinking ?? false;

  const handleModelChange = useCallback(
    (fullModelId: FullModelId) => {
      const [provider, ...modelParts] = fullModelId.split(':');
      const modelId = modelParts.join(':');
      onUpdate({
        modelId,
        modelProvider: provider,
      });
    },
    [onUpdate]
  );

  const handleTemperatureChange = useCallback(
    (value: number) => {
      onUpdate({ temperature: value });
    },
    [onUpdate]
  );

  const handleMaxTokensChange = useCallback(
    (value: number) => {
      onUpdate({ maxTokens: value });
    },
    [onUpdate]
  );

  const handleThinkingEnabledChange = useCallback(
    (isEnabled: boolean) => {
      onUpdate({
        thinkingBudget: isEnabled ? (defaults?.thinkingBudget ?? DEFAULT_THINKING_BUDGET) : undefined,
        thinkingEnabled: isEnabled,
      });
    },
    [defaults?.thinkingBudget, onUpdate]
  );

  const handleThinkingBudgetChange = useCallback(
    (budget: number) => {
      onUpdate({ thinkingBudget: budget });
    },
    [onUpdate]
  );

  const handleSystemPromptBlur = useCallback(() => {
    if (localSystemPrompt !== (defaults?.customSystemPrompt ?? '')) {
      onUpdate({ customSystemPrompt: localSystemPrompt || undefined });
    }
  }, [defaults?.customSystemPrompt, localSystemPrompt, onUpdate]);

  const formatTemperature = (value: number) => value.toFixed(1);

  const formatMaxTokens = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return String(value);
  };

  return (
    <Collapsible className={className} defaultOpen={false} ref={ref} {...props}>
      {/* Trigger */}
      <CollapsibleTrigger
        className={cn(
          'flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left',
          'transition-colors hover:bg-muted/50'
        )}
        isHideChevron
      >
        <div className={'flex flex-col gap-0.5'}>
          <span className={'text-sm font-medium'}>{label}</span>
          <span className={'text-xs text-muted-foreground'}>{description}</span>
        </div>
        <ChevronDown className={'size-4 text-muted-foreground transition-transform in-data-panel-open:rotate-180'} />
      </CollapsibleTrigger>

      {/* Content */}
      <CollapsibleContent className={'mt-2'}>
        <div className={'space-y-6 rounded-lg border border-border bg-card p-4'}>
          {/* Model Selection */}
          <div className={'flex flex-col gap-2'}>
            <label className={'text-sm font-medium'}>Model</label>
            <ModelSelector isDisabled={isDisabled} onValueChange={handleModelChange} value={currentModelId} />
          </div>

          {/* Parameter Controls */}
          <div className={'flex flex-col gap-6 md:flex-row md:gap-8'}>
            {/* Temperature Slider */}
            <div className={'flex-1'}>
              <ParameterSlider
                description={'Controls randomness. Lower values are more focused, higher values more creative.'}
                formatValue={formatTemperature}
                isDisabled={isDisabled}
                label={'Temperature'}
                max={2}
                min={0}
                onValueChange={handleTemperatureChange}
                step={0.1}
                value={defaults?.temperature ?? DEFAULT_TEMPERATURE}
              />
            </div>

            {/* Max Tokens Slider */}
            <div className={'flex-1'}>
              <ParameterSlider
                description={'Maximum number of tokens the model can generate in the response.'}
                formatValue={formatMaxTokens}
                isDisabled={isDisabled}
                label={'Max Tokens'}
                max={16000}
                min={100}
                onValueChange={handleMaxTokensChange}
                step={100}
                value={defaults?.maxTokens ?? DEFAULT_MAX_TOKENS}
              />
            </div>
          </div>

          {/* Thinking Budget Control */}
          <ThinkingBudgetControl
            budget={defaults?.thinkingBudget ?? DEFAULT_THINKING_BUDGET}
            isDisabled={isDisabled}
            isEnabled={defaults?.thinkingEnabled ?? false}
            isSupportsThinking={isSupportsThinking}
            onBudgetChange={handleThinkingBudgetChange}
            onEnabledChange={handleThinkingEnabledChange}
          />

          {/* Custom System Prompt */}
          <div className={'flex flex-col gap-2'}>
            <div className={'flex items-center justify-between'}>
              <label className={'text-sm font-medium'} htmlFor={`system-prompt-${step}`}>
                Custom System Prompt
              </label>
              {localSystemPrompt && (
                <button
                  className={'text-xs text-muted-foreground hover:text-foreground'}
                  disabled={isDisabled}
                  onClick={() => {
                    setLocalSystemPrompt('');
                    onUpdate({ customSystemPrompt: undefined });
                  }}
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
              className={'min-h-24 font-mono text-xs'}
              disabled={isDisabled}
              id={`system-prompt-${step}`}
              onBlur={handleSystemPromptBlur}
              onChange={(e) => setLocalSystemPrompt(e.target.value)}
              placeholder={'Enter custom system prompt...'}
              value={localSystemPrompt}
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
