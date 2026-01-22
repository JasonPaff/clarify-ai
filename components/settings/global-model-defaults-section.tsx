'use client';

import type { ComponentPropsWithRef } from 'react';

import { Bot, Loader2 } from 'lucide-react';
import { useCallback } from 'react';

import type { StepConfigurationStep } from '@/db/schema/step-configurations.schema';
import type { GlobalStepModelDefaults } from '@/lib/ai/global-model-defaults';

import { StepModelSection } from '@/components/features/workflow/step-model-section';
import { useGlobalModelDefaults } from '@/components/providers/global-model-defaults-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  {
    description: 'Generates AI-powered repository overviews',
    label: 'Overview',
    step: 'overview',
  },
];

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
              <StepModelSection
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
