'use client';

import type { ComponentPropsWithRef } from 'react';

import { Bot, ChevronDown, Loader2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import type { StepConfigurationStep } from '@/db/schema/step-configurations.schema';
import type { GlobalStepModelDefaults } from '@/lib/ai/global-model-defaults';
import type { FullModelId } from '@/lib/ai/models';

import { ModelSelector } from '@/components/features/clarification/model-selector';
import { ParameterSlider } from '@/components/features/workflow/parameter-slider';
import { ThinkingBudgetControl } from '@/components/features/workflow/thinking-budget-control';
import { useGlobalModelDefaults } from '@/components/providers/global-model-defaults-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';
import { DEFAULT_MAX_TOKENS, DEFAULT_TEMPERATURE, DEFAULT_THINKING_BUDGET } from '@/lib/ai/global-model-defaults';
import { getModelInfo } from '@/lib/ai/models';
import { cn } from '@/lib/utils';

interface StepInfo {
  description: string;
  label: string;
  step: StepConfigurationStep;
}

const WORKFLOW_STEPS: Array<StepInfo> = [
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
];

interface StepSectionProps {
  defaults: GlobalStepModelDefaults | undefined;
  description: string;
  label: string;
  onUpdate: (updates: GlobalStepModelDefaults) => void;
  step: StepConfigurationStep;
}

const StepSection = ({ defaults, description, label, onUpdate, step }: StepSectionProps) => {
  const [localSystemPrompt, setLocalSystemPrompt] = useState(defaults?.customSystemPrompt ?? '');
  const [localUserPrompt, setLocalUserPrompt] = useState(defaults?.customUserPromptTemplate ?? '');

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

  const handleUserPromptBlur = useCallback(() => {
    if (localUserPrompt !== (defaults?.customUserPromptTemplate ?? '')) {
      onUpdate({ customUserPromptTemplate: localUserPrompt || undefined });
    }
  }, [defaults?.customUserPromptTemplate, localUserPrompt, onUpdate]);

  const formatTemperature = (value: number) => value.toFixed(1);

  const formatMaxTokens = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return String(value);
  };

  return (
    <Collapsible defaultOpen={false}>
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
            <ModelSelector onValueChange={handleModelChange} value={currentModelId} />
          </div>

          {/* Parameter Controls */}
          <div className={'flex flex-col gap-6 md:flex-row md:gap-8'}>
            {/* Temperature Slider */}
            <div className={'flex-1'}>
              <ParameterSlider
                description={'Controls randomness. Lower values are more focused, higher values more creative.'}
                formatValue={formatTemperature}
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
              id={`system-prompt-${step}`}
              onBlur={handleSystemPromptBlur}
              onChange={(e) => setLocalSystemPrompt(e.target.value)}
              placeholder={'Enter custom system prompt...'}
              value={localSystemPrompt}
            />
          </div>

          {/* Custom User Prompt Template */}
          <div className={'flex flex-col gap-2'}>
            <div className={'flex items-center justify-between'}>
              <label className={'text-sm font-medium'} htmlFor={`user-prompt-${step}`}>
                Custom User Prompt Template
              </label>
              {localUserPrompt && (
                <button
                  className={'text-xs text-muted-foreground hover:text-foreground'}
                  onClick={() => {
                    setLocalUserPrompt('');
                    onUpdate({ customUserPromptTemplate: undefined });
                  }}
                  type={'button'}
                >
                  Reset
                </button>
              )}
            </div>
            <p className={'text-xs text-muted-foreground'}>
              Override the default user prompt template for this step. Leave empty to use the default.
            </p>
            <Textarea
              className={'min-h-24 font-mono text-xs'}
              id={`user-prompt-${step}`}
              onBlur={handleUserPromptBlur}
              onChange={(e) => setLocalUserPrompt(e.target.value)}
              placeholder={'Enter custom user prompt template...'}
              value={localUserPrompt}
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

type GlobalModelDefaultsSectionProps = ComponentPropsWithRef<'div'>;

export const GlobalModelDefaultsSection = ({ className, ref, ...props }: GlobalModelDefaultsSectionProps) => {
  const { defaults, isLoaded, setStepDefaults } = useGlobalModelDefaults();

  const handleStepUpdate = useCallback(
    (step: StepConfigurationStep) => (updates: GlobalStepModelDefaults) => {
      void setStepDefaults(step, updates);
    },
    [setStepDefaults]
  );

  const isLoading = !isLoaded;

  return (
    <Card className={cn(className)} ref={ref} {...props}>
      {/* Header */}
      <CardHeader>
        <div className={'flex items-center gap-3'}>
          <div className={'flex size-10 items-center justify-center rounded-lg bg-muted'}>
            <Bot className={'size-5 text-muted-foreground'} />
          </div>
          <div>
            <CardTitle>Global Model Defaults</CardTitle>
            <CardDescription>
              Configure default AI model settings for each workflow step. New projects will inherit these defaults.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent>
        {isLoading ? (
          <div className={'flex items-center justify-center py-8'}>
            <Loader2 className={'size-6 animate-spin text-muted-foreground'} />
          </div>
        ) : (
          <div className={'space-y-4'}>
            {WORKFLOW_STEPS.map((stepInfo) => (
              <StepSection
                defaults={defaults[stepInfo.step]}
                description={stepInfo.description}
                key={stepInfo.step}
                label={stepInfo.label}
                onUpdate={handleStepUpdate(stepInfo.step)}
                step={stepInfo.step}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
