'use client';

import type { ComponentPropsWithRef } from 'react';

import { ChevronDown, Settings2 } from 'lucide-react';

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

interface AISettingsInlineProps extends ComponentPropsWithRef<'div'> {
  /** Whether controls are disabled */
  isDisabled?: boolean;
  /** Settings state from useAISettings or adapter hook */
  settings: UseAISettingsReturn;
  /** The workflow step being configured */
  step: StepConfigurationStep;
  /** Step display name */
  stepLabel: string;
}

/**
 * Compact inline AI settings panel for workflow steps.
 * Shows a collapsible with settings icon header and "Customized" badge.
 */
export function AISettingsInline({
  className,
  isDisabled = false,
  ref,
  settings,
  step,
  stepLabel,
  ...props
}: AISettingsInlineProps) {
  const { defaultValues, hasAnyModification, isPersisting, modifications, updateValue, values } = settings;

  const controlsDisabled = isDisabled || isPersisting;

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
            {hasAnyModification && (
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
          <div
            className={'space-y-4 rounded-md border border-border bg-card p-3 sm:space-y-6 sm:p-4'}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Model Selection */}
            <AIModelSelector
              isDisabled={controlsDisabled}
              isModified={modifications.modelId}
              onChange={(value) => updateValue('modelId', value)}
              value={values.modelId}
            />

            {/* Parameter Controls - Stack on mobile, side-by-side on larger screens */}
            <div className={'flex flex-col gap-4 sm:gap-6 md:flex-row md:gap-8'}>
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
    </div>
  );
}
