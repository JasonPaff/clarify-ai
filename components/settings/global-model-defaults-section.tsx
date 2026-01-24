'use client';

import type { ComponentPropsWithRef } from 'react';

import { Bot, Loader2 } from 'lucide-react';

import type { StepConfigurationStep } from '@/db/schema/step-configurations.schema';

import { AISettingsPanel } from '@/components/ai-settings';
import { useGlobalModelDefaults } from '@/components/providers/global-model-defaults-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGlobalAISettings } from '@/hooks/use-global-ai-settings';
import { WORKFLOW_STEPS } from '@/lib/ai/settings';
import { cn } from '@/lib/utils';

type GlobalModelDefaultsSectionProps = ComponentPropsWithRef<'div'>;

interface GlobalStepSettingsPanelProps {
  description: string;
  label: string;
  step: StepConfigurationStep;
}

/**
 * Individual step settings panel that uses the global AI settings hook.
 */
function GlobalStepSettingsPanel({ description, label, step }: GlobalStepSettingsPanelProps) {
  const settings = useGlobalAISettings(step);

  return <AISettingsPanel description={description} label={label} settings={settings} step={step} />;
}

/**
 * Global model defaults section for the app settings page.
 * Allows configuring default AI settings for each workflow step.
 */
export const GlobalModelDefaultsSection = ({ className, ref, ...props }: GlobalModelDefaultsSectionProps) => {
  const { isLoaded } = useGlobalModelDefaults();

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
              <GlobalStepSettingsPanel
                description={stepInfo.description}
                key={stepInfo.step}
                label={stepInfo.label}
                step={stepInfo.step}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
