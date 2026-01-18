'use client';

import type { VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';

import { ArrowLeft, ArrowRight, FileText, Lightbulb, Loader2, Search, Sparkles } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import { withParamValidation } from 'next-typesafe-url/app/hoc';
import Link from 'next/link';
import { use, useState } from 'react';

import type { PageProps } from '@/app/(app)/projects/[projectId]/features/[featureId]/route-type';

import { Route } from '@/app/(app)/projects/[projectId]/features/[featureId]/route-type';
import { WorkflowSteps } from '@/components/features/workflow-steps';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';
import { Separator } from '@/components/ui/separator';
import { Tooltip } from '@/components/ui/tooltip';
import { useFeatureRequest } from '@/hooks/queries/use-feature-requests';
import { cn } from '@/lib/utils';

type FeatureWorkflowPageProps = PageProps;
const STEP_ORDER = ['entry', 'refine', 'research', 'plan'] as const;

type FeatureRequestStatus = 'completed' | 'draft' | 'planning' | 'refining' | 'researching';

type StepId = (typeof STEP_ORDER)[number];

const statusLabels: Record<FeatureRequestStatus, string> = {
  completed: 'Completed',
  draft: 'Draft',
  planning: 'Planning',
  refining: 'Refining',
  researching: 'Researching',
};

const statusVariantMap: Record<FeatureRequestStatus, VariantProps<typeof badgeVariants>['variant']> = {
  completed: 'completed',
  draft: 'draft',
  planning: 'planning',
  refining: 'refining',
  researching: 'researching',
};

export default withParamValidation(FeatureWorkflowPage, Route);

function FeatureWorkflowPage({ routeParams }: FeatureWorkflowPageProps) {
  const { featureId, projectId } = use(routeParams);

  const [currentStep, setCurrentStep] = useState<StepId>('entry');

  const { data: featureRequest, error, isLoading } = useFeatureRequest(featureId);

  // Loading state
  if (isLoading) {
    return (
      <div className={'flex items-center justify-center py-12'}>
        <Loader2 className={'size-6 animate-spin text-muted-foreground'} />
      </div>
    );
  }

  // Error or not found state
  if (error || !featureRequest) {
    return (
      <div className={'space-y-6'}>
        <div className={'flex items-center gap-3'}>
          <Tooltip content={'Back to features'} side={'right'}>
            <Link href={`/projects/${projectId}/features`}>
              <IconButton>
                <ArrowLeft className={'size-4'} />
              </IconButton>
            </Link>
          </Tooltip>
          <div>
            <h1 className={'text-xl font-semibold'}>Feature not found</h1>
            <p className={'text-sm text-muted-foreground'}>
              {error?.message || 'The requested feature could not be found.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const featureName = featureRequest.title;

  const currentIndex = STEP_ORDER.indexOf(currentStep);
  const canGoBack = currentIndex > 0;
  const canGoNext = currentIndex < STEP_ORDER.length - 1;

  const handleGoBack = () => {
    if (canGoBack) {
      setCurrentStep(STEP_ORDER[currentIndex - 1] as StepId);
    }
  };

  const handleGoNext = () => {
    if (canGoNext) {
      setCurrentStep(STEP_ORDER[currentIndex + 1] as StepId);
    }
  };

  const stepContent: Record<StepId, { description: string; icon: ReactNode; title: string }> = {
    entry: {
      description:
        'Describe your feature idea in plain language. Be as detailed or brief as you like - the AI will help refine it.',
      icon: <Lightbulb className={'size-6'} />,
      title: 'Describe Your Feature',
    },
    plan: {
      description:
        'Review the generated implementation plan with specific files, code changes, and testing strategies.',
      icon: <FileText className={'size-6'} />,
      title: 'Implementation Plan',
    },
    refine: {
      description: 'Work with AI to clarify requirements, identify edge cases, and expand on your initial idea.',
      icon: <Sparkles className={'size-6'} />,
      title: 'Refine Requirements',
    },
    research: {
      description:
        'AI analyzes your connected repositories to understand the codebase context and identify relevant patterns.',
      icon: <Search className={'size-6'} />,
      title: 'Codebase Research',
    },
  };

  const current = stepContent[currentStep];

  return (
    <div className={'space-y-6'}>
      {/* Header */}
      <div className={'flex items-center gap-3'}>
        <Tooltip content={'Back to features'} side={'right'}>
          <Link href={$path({ route: '/projects/[projectId]/features', routeParams: { projectId } })}>
            <IconButton>
              <ArrowLeft className={'size-4'} />
            </IconButton>
          </Link>
        </Tooltip>
        <div>
          <div className={'flex items-center gap-2'}>
            <h1 className={'text-xl font-semibold'}>{featureName}</h1>
            <Badge variant={statusVariantMap[featureRequest.status as FeatureRequestStatus]}>
              {statusLabels[featureRequest.status as FeatureRequestStatus]}
            </Badge>
          </div>
          <p className={'text-sm text-muted-foreground'}>Feature workflow</p>
        </div>
      </div>

      <Separator />

      {/* Workflow Steps */}
      <div className={'py-2'}>
        <WorkflowSteps currentStep={currentStep} onStepClick={(stepId) => setCurrentStep(stepId as StepId)} />
      </div>

      <Separator />

      {/* Step Content */}
      <Card>
        <CardHeader>
          <div className={'flex items-center gap-3'}>
            <div className={'flex size-12 items-center justify-center rounded-lg bg-accent/10'}>
              <div className={'text-accent'}>{current.icon}</div>
            </div>
            <div>
              <CardTitle>{current.title}</CardTitle>
              <CardDescription>{current.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              'min-h-75 rounded-lg border border-dashed border-border p-8',
              currentStep === 'entry' && featureRequest.description ? 'text-left' : 'text-center'
            )}
          >
            {currentStep === 'entry' ? (
              featureRequest.description ? (
                <div className={'space-y-2'}>
                  <p className={'text-sm font-medium text-foreground'}>Feature Description</p>
                  <p className={'text-sm whitespace-pre-wrap text-muted-foreground'}>{featureRequest.description}</p>
                </div>
              ) : (
                <p className={'text-sm text-muted-foreground'}>No description provided for this feature request.</p>
              )
            ) : (
              <p className={'text-sm text-muted-foreground'}>
                {currentStep.charAt(0).toUpperCase() + currentStep.slice(1)} step content coming soon
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className={'flex items-center justify-between'}>
        <Button disabled={!canGoBack} onClick={handleGoBack} variant={'outline'}>
          <ArrowLeft className={'size-4'} />
          Previous
        </Button>
        <span className={'text-sm text-muted-foreground'}>
          Step {currentIndex + 1} of {STEP_ORDER.length}
        </span>
        <Button disabled={!canGoNext} onClick={handleGoNext}>
          Next
          <ArrowRight className={'size-4'} />
        </Button>
      </div>
    </div>
  );
}
