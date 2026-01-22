'use client';

import type { ComponentPropsWithRef } from 'react';

import { Bot, Loader2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';

import type { StepConfigurationStep } from '@/db/schema/step-configurations.schema';

import { type StepModelDefaults, StepModelSection } from '@/components/features/workflow/step-model-section';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useStepConfigurations, useUpsertStepConfig } from '@/hooks/queries/use-step-configurations';
import { cn } from '@/lib/utils';

interface StepInfo {
  description: string;
  label: string;
  step: StepConfigurationStep;
}

const WORKFLOW_STEPS: Array<StepInfo> = [
  {
    description: 'Generates clarifying questions to refine the feature',
    label: 'Clarify',
    step: 'refine',
  },
  {
    description: 'Discovers relevant files in the codebase',
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

interface DefaultModelSettingsProps extends ComponentPropsWithRef<'div'> {
  projectId: number;
}

export const DefaultModelSettings = ({ className, projectId, ref, ...props }: DefaultModelSettingsProps) => {
  const { data: configurations, isLoading } = useStepConfigurations(projectId);
  const upsertMutation = useUpsertStepConfig();

  const configurationMap = useMemo(() => {
    const map = new Map<StepConfigurationStep, StepModelDefaults | undefined>();

    for (const stepInfo of WORKFLOW_STEPS) {
      map.set(stepInfo.step, undefined);
    }

    if (configurations) {
      for (const config of configurations) {
        const defaults: StepModelDefaults = {
          customSystemPrompt: config.customSystemPrompt ?? undefined,
          maxTokens: config.maxTokens ?? undefined,
          modelId: config.modelId ?? undefined,
          modelProvider: config.modelProvider ?? undefined,
          temperature: config.temperature ?? undefined,
          thinkingBudget: config.thinkingBudget ?? undefined,
          thinkingEnabled: config.thinkingEnabled ?? undefined,
        };
        map.set(config.step, defaults);
      }
    }

    return map;
  }, [configurations]);

  const handleStepUpdate = useCallback(
    (step: StepConfigurationStep) => (updates: StepModelDefaults) => {
      upsertMutation.mutate({
        data: updates,
        projectId,
        step,
      });
    },
    [projectId, upsertMutation]
  );

  return (
    <Card className={cn(className)} ref={ref} {...props}>
      {/* Header */}
      <CardHeader>
        <div className={'flex items-center gap-3'}>
          <div className={'flex size-10 items-center justify-center rounded-lg bg-muted'}>
            <Bot className={'size-5 text-muted-foreground'} />
          </div>
          <div>
            <CardTitle>Default AI Models</CardTitle>
            <CardDescription>Configure the default AI model settings for each workflow step</CardDescription>
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
                defaults={configurationMap.get(stepInfo.step)}
                description={stepInfo.description}
                isDisabled={upsertMutation.isPending}
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
