'use client';

import type { ComponentPropsWithRef } from 'react';

import { ChevronDown } from 'lucide-react';

import type { StepConfigurationStep } from '@/db/schema/step-configurations.schema';
import type { UseAISettingsReturn } from '@/hooks/use-ai-settings';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

import {
  AIMaxTokensSlider,
  AIModelSelector,
  AISystemPromptEditor,
  AITemperatureSlider,
  AIThinkingControl,
} from './controls';

interface AISettingsPanelProps extends Omit<ComponentPropsWithRef<'div'>, 'defaultValue'> {
  /** Whether panel starts open */
  defaultOpen?: boolean;
  /** Panel description */
  description: string;
  /** Whether controls are disabled */
  isDisabled?: boolean;
  /** Panel label */
  label: string;
  /** Settings state from useAISettings or adapter hook */
  settings: UseAISettingsReturn;
  /** Step being configured (for prompt metadata) */
  step: StepConfigurationStep;
}

/**
 * Full AI settings panel for settings pages (global and project settings).
 * Renders a collapsible panel with all AI setting controls.
 */
export function AISettingsPanel({
  className,
  defaultOpen = false,
  description,
  isDisabled = false,
  label,
  ref,
  settings,
  step,
  ...props
}: AISettingsPanelProps) {
  const { defaultValues, hasAnyModification, isPersisting, modifications, updateValue, values } = settings;

  const controlsDisabled = isDisabled || isPersisting;

  return (
    <Collapsible className={cn(className)} defaultOpen={defaultOpen} ref={ref} {...props}>
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
        <div className={'flex items-center gap-2'}>
          {hasAnyModification && (
            <span className={'rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent'}>Customized</span>
          )}
          <ChevronDown className={'size-4 text-muted-foreground transition-transform in-data-panel-open:rotate-180'} />
        </div>
      </CollapsibleTrigger>

      {/* Content */}
      <CollapsibleContent className={'mt-2'}>
        <div className={'space-y-6 rounded-lg border border-border bg-card p-4'}>
          {/* Model Selection */}
          <AIModelSelector
            isDisabled={controlsDisabled}
            isModified={modifications.modelId}
            onChange={(value) => updateValue('modelId', value)}
            value={values.modelId}
          />

          {/* Parameter Controls */}
          <div className={'flex flex-col gap-6 md:flex-row md:gap-8'}>
            {/* Temperature Slider */}
            <div className={'flex-1'}>
              <AITemperatureSlider
                defaultValue={defaultValues.temperature}
                isDisabled={controlsDisabled}
                isModified={modifications.temperature}
                onChange={(value) => updateValue('temperature', value)}
                showDefaultHint={false}
                value={values.temperature}
              />
            </div>

            {/* Max Tokens Slider */}
            <div className={'flex-1'}>
              <AIMaxTokensSlider
                defaultValue={defaultValues.maxTokens}
                isDisabled={controlsDisabled}
                isModified={modifications.maxTokens}
                onChange={(value) => updateValue('maxTokens', value)}
                showDefaultHint={false}
                value={values.maxTokens}
              />
            </div>
          </div>

          {/* Thinking Budget Control */}
          <AIThinkingControl
            budget={values.thinkingBudget}
            defaultBudget={defaultValues.thinkingBudget}
            isDisabled={controlsDisabled}
            isEnabled={values.thinkingEnabled}
            modelId={values.modelId}
            onBudgetChange={(budget) => updateValue('thinkingBudget', budget)}
            onEnabledChange={(isEnabled) => {
              updateValue('thinkingEnabled', isEnabled);
              // Set default budget when enabling
              if (isEnabled && !values.thinkingBudget) {
                updateValue('thinkingBudget', defaultValues.thinkingBudget);
              }
            }}
          />

          {/* Custom System Prompt */}
          <AISystemPromptEditor
            isDisabled={controlsDisabled}
            onChange={(value) => updateValue('customSystemPrompt', value)}
            step={step}
            value={values.customSystemPrompt}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
