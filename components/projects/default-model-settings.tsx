'use client';

import type { ComponentPropsWithRef } from 'react';

import { Bot, Loader2 } from 'lucide-react';
import { useMemo } from 'react';

import type { StepConfigurationStep } from '@/db/schema/step-configurations.schema';
import type { FullModelId } from '@/lib/ai/models';

import { ModelSelector } from '@/components/features/clarification/model-selector';
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
];

interface DefaultModelSettingsProps extends ComponentPropsWithRef<'div'> {
  projectId: number;
}

export const DefaultModelSettings = ({ className, projectId, ref, ...props }: DefaultModelSettingsProps) => {
  const { data: configurations, isLoading } = useStepConfigurations(projectId);
  const upsertMutation = useUpsertStepConfig();

  const configurationMap = useMemo(() => {
    const map = new Map<StepConfigurationStep, FullModelId | null>();

    for (const stepInfo of WORKFLOW_STEPS) {
      map.set(stepInfo.step, null);
    }

    if (configurations) {
      for (const config of configurations) {
        if (config.modelProvider && config.modelId) {
          const fullId = `${config.modelProvider}:${config.modelId}` as FullModelId;
          map.set(config.step, fullId);
        }
      }
    }

    return map;
  }, [configurations]);

  const handleModelChange = (step: StepConfigurationStep, fullModelId: FullModelId) => {
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
            <CardDescription>Configure the default AI model for each workflow step</CardDescription>
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
            {WORKFLOW_STEPS.map((stepInfo) => {
              const currentModelId = configurationMap.get(stepInfo.step) ?? null;
              const isStepPending = upsertMutation.isPending;

              return (
                <div className={'flex flex-col gap-2 rounded-lg border border-border p-4'} key={stepInfo.step}>
                  {/* Step Info */}
                  <div className={'flex flex-col gap-0.5'}>
                    <label className={'text-sm font-medium'}>{stepInfo.label}</label>
                    <p className={'text-xs text-muted-foreground'}>{stepInfo.description}</p>
                  </div>

                  {/* Model Selector */}
                  <ModelSelector
                    isDisabled={isStepPending}
                    onValueChange={(value) => handleModelChange(stepInfo.step, value)}
                    value={currentModelId}
                  />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
