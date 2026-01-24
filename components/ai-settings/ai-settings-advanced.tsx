'use client';

import type { ComponentPropsWithRef } from 'react';

import { ChevronDown, Settings2 } from 'lucide-react';

import type { StepConfigurationStep } from '@/db/schema/step-configurations.schema';
import type { UseAISettingsReturn } from '@/hooks/use-ai-settings';

import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

import {
  AIMaxTokensSlider,
  AISystemPromptEditor,
  AITemperatureSlider,
  AIThinkingControl,
} from './controls';

interface AISettingsAdvancedProps extends ComponentPropsWithRef<'div'> {
  /** Whether controls are disabled */
  isDisabled?: boolean;
  /** Settings state from useLocalAISettings */
  settings: UseAISettingsReturn;
  /** The workflow step (for prompt metadata) */
  step: StepConfigurationStep;
}

/**
 * Advanced AI settings section for dialogs.
 * Used for temporary overrides that don't persist.
 * Includes "Reset to Project Defaults" button and all controls including system prompt.
 */
export function AISettingsAdvanced({
  className,
  isDisabled = false,
  ref,
  settings,
  step,
  ...props
}: AISettingsAdvancedProps) {
  const { defaultValues, hasAnyModification, modifications, resetToDefaults, updateValue, values } = settings;

  return (
    <Collapsible className={cn(className)} ref={ref} {...props}>
      <CollapsibleTrigger
        className={cn(
          'flex w-full items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-left text-sm',
          'transition-colors hover:bg-muted/50'
        )}
        isHideChevron
      >
        <div className={'flex items-center gap-2'}>
          <Settings2 className={'size-4 text-muted-foreground'} />
          <span className={'font-medium'}>Advanced Settings</span>
          {hasAnyModification && (
            <span className={'rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent'}>Modified</span>
          )}
        </div>
        <ChevronDown className={'size-4 text-muted-foreground transition-transform in-data-panel-open:rotate-180'} />
      </CollapsibleTrigger>

      <CollapsibleContent className={'mt-2'}>
        <div className={'space-y-4 rounded-md border border-border bg-card p-4'}>
          {/* Temperature and Max Tokens sliders */}
          <div className={'flex flex-col gap-4 md:flex-row md:gap-8'}>
            {/* Temperature Slider */}
            <div className={'flex-1'}>
              <AITemperatureSlider
                defaultValue={defaultValues.temperature}
                isDisabled={isDisabled}
                isModified={modifications.temperature}
                onChange={(value) => updateValue('temperature', value)}
                showDefaultHint={true}
                value={values.temperature}
              />
            </div>

            {/* Max Tokens Slider */}
            <div className={'flex-1'}>
              <AIMaxTokensSlider
                defaultValue={defaultValues.maxTokens}
                isDisabled={isDisabled}
                isModified={modifications.maxTokens}
                onChange={(value) => updateValue('maxTokens', value)}
                showDefaultHint={true}
                value={values.maxTokens}
              />
            </div>
          </div>

          {/* Thinking Budget Control */}
          <AIThinkingControl
            budget={values.thinkingBudget}
            defaultBudget={defaultValues.thinkingBudget}
            isDisabled={isDisabled}
            isEnabled={values.thinkingEnabled}
            modelId={values.modelId}
            onBudgetChange={(budget) => updateValue('thinkingBudget', budget)}
            onEnabledChange={(isEnabled) => {
              updateValue('thinkingEnabled', isEnabled);
              if (isEnabled && !values.thinkingBudget) {
                updateValue('thinkingBudget', defaultValues.thinkingBudget);
              }
            }}
          />

          {/* Custom System Prompt */}
          <AISystemPromptEditor
            isDisabled={isDisabled}
            onChange={(value) => updateValue('customSystemPrompt', value)}
            step={step}
            value={values.customSystemPrompt}
          />

          {/* Reset to Defaults Button */}
          {hasAnyModification && (
            <Button className={'mt-2'} onClick={resetToDefaults} size={'sm'} variant={'ghost'}>
              Reset to Project Defaults
            </Button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
