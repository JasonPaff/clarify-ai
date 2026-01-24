'use client';

import type { ComponentPropsWithRef } from 'react';

import { Bot, Loader2 } from 'lucide-react';

import type { StepConfigurationStep } from '@/db/schema/step-configurations.schema';

import { AISettingsPanel } from '@/components/ai-settings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useStepConfigurations } from '@/hooks/queries/use-step-configurations';
import { useProjectAISettings } from '@/hooks/use-project-ai-settings';
import { WORKFLOW_STEPS } from '@/lib/ai/settings';
import { cn } from '@/lib/utils';

interface DefaultModelSettingsProps extends ComponentPropsWithRef<'div'> {
  projectId: number;
}

interface ProjectStepSettingsPanelProps {
  description: string;
  label: string;
  projectId: number;
  step: StepConfigurationStep;
}

/**
 * Individual step settings panel that uses the project AI settings hook.
 */
function ProjectStepSettingsPanel({ description, label, projectId, step }: ProjectStepSettingsPanelProps) {
  const settings = useProjectAISettings(projectId, step);

  return (
    <AISettingsPanel
      description={description}
      isDisabled={settings.isPersisting}
      label={label}
      settings={settings}
      step={step}
    />
  );
}

/**
 * Default AI model settings section for the project settings page.
 * Allows configuring project-specific AI settings for each workflow step.
 */
export const DefaultModelSettings = ({ className, projectId, ref, ...props }: DefaultModelSettingsProps) => {
  const { isLoading } = useStepConfigurations(projectId);

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
              <ProjectStepSettingsPanel
                description={stepInfo.description}
                key={stepInfo.step}
                label={stepInfo.label}
                projectId={projectId}
                step={stepInfo.step}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
