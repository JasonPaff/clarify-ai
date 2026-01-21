'use client';

import type { VariantProps } from 'class-variance-authority';

import { ArrowLeft, FileText, Lightbulb, Loader2, Search, Sparkles } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import { withParamValidation } from 'next-typesafe-url/app/hoc';
import Link from 'next/link';
import { ReactNode, useEffectEvent } from 'react';
import { use, useCallback, useEffect, useRef, useState } from 'react';

import type { PageProps } from '@/app/(app)/projects/[projectId]/features/[featureId]/route-type';
import type { ValidationWarning } from '@/lib/workflow/step-validation';

import { Route } from '@/app/(app)/projects/[projectId]/features/[featureId]/route-type';
import { ClarifyStep } from '@/components/features/clarify-step';
import { DescribeStep } from '@/components/features/describe-step';
import { DiscoverStep } from '@/components/features/discover-step';
import { PlanStep } from '@/components/features/plan-step';
import { WorkflowSteps } from '@/components/features/workflow-steps';
import { StepTransitionWarningDialog } from '@/components/features/workflow/step-transition-warning-dialog';
import { useWorkflow } from '@/components/providers/workflow-provider';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';
import { Separator } from '@/components/ui/separator';
import { Tooltip } from '@/components/ui/tooltip';
import { useContextFiles } from '@/hooks/queries/use-feature-request-context-files';
import { useFeatureRequestRepositories } from '@/hooks/queries/use-feature-request-repositories';
import { useFeatureRequest } from '@/hooks/queries/use-feature-requests';
import { useLeaveWarning } from '@/hooks/use-leave-warning';
import { useStaleSteps } from '@/hooks/use-stale-steps';
import { getStepWarnings, hasCautionWarnings } from '@/lib/workflow/step-validation';

type FeatureWorkflowPageProps = PageProps;
const STEP_ORDER = ['describe', 'refine', 'research', 'plan'] as const;

type FeatureRequestStatus = 'clarifying' | 'completed' | 'describing' | 'draft' | 'failed' | 'planning' | 'researching';

type StepId = (typeof STEP_ORDER)[number];

/**
 * Human-readable labels for each step, used in warning dialog.
 */
const STEP_LABELS: Record<StepId, string> = {
  describe: 'Describe',
  plan: 'Plan',
  refine: 'Clarify',
  research: 'Discover',
} as const;

/**
 * State for managing pending navigation with validation warnings.
 */
interface PendingNavigation {
  targetStep: StepId;
  warnings: Array<ValidationWarning>;
}

const statusLabels: Record<FeatureRequestStatus, string> = {
  clarifying: 'Clarifying',
  completed: 'Completed',
  describing: 'Describing',
  draft: 'Draft',
  failed: 'Failed',
  planning: 'Planning',
  researching: 'Researching',
};

const statusVariantMap: Record<FeatureRequestStatus, VariantProps<typeof badgeVariants>['variant']> = {
  clarifying: 'clarifying',
  completed: 'completed',
  describing: 'describing',
  draft: 'draft',
  failed: 'failed',
  planning: 'planning',
  researching: 'researching',
};

export default withParamValidation(FeatureWorkflowPage, Route);

function FeatureWorkflowPage({ routeParams }: FeatureWorkflowPageProps) {
  const { featureId, projectId } = use(routeParams);

  const [currentStep, setCurrentStep] = useState<StepId>('describe');
  const [pendingNavigation, setPendingNavigation] = useState<null | PendingNavigation>(null);
  const lastFeatureIdRef = useRef<null | number>(null);

  const { data: featureRequest, error, isLoading } = useFeatureRequest(featureId);
  const { data: linkedRepositories } = useFeatureRequestRepositories(featureId);
  const { data: contextFiles } = useContextFiles(featureId);

  // Access workflow context for AI operation blocking (used in Step 11)
  const { getActiveOperationStep, isAnyAiOperationRunning } = useWorkflow();

  // Cancel callback ref that step components can register with
  const cancelCallbackRef = useRef<(() => void) | null>(null);

  // Get the active operation step name for the cancel dialog
  const activeOperationStepName = getActiveOperationStep();

  // Cancel handler that invokes the registered cancel callback
  const handleCancelAiOperation = useCallback(() => {
    cancelCallbackRef.current?.();
  }, []);

  // Set up beforeunload handler to prevent window closure during AI operations
  // The hook internally manages the beforeunload event listener based on isActive
  useLeaveWarning({
    isActive: isAnyAiOperationRunning,
    onCancel: handleCancelAiOperation,
    stepName: activeOperationStepName ?? 'current',
  });

  const { staleStepNames } = useStaleSteps({
    featureRequestId: featureId,
    staleStepsJson: featureRequest?.staleSteps ?? null,
  });

  const updateCurrentStep = useEffectEvent((status: FeatureRequestStatus) => {
    setCurrentStep(getStepFromStatus(status));
  });

  useEffect(() => {
    if (!featureRequest) return;
    if (lastFeatureIdRef.current !== featureRequest.id) {
      lastFeatureIdRef.current = featureRequest.id;
      updateCurrentStep(featureRequest.status as FeatureRequestStatus);
    }
  }, [featureRequest]);

  /**
   * Attempts to navigate to a target step with validation.
   * If caution-severity warnings exist, shows the warning dialog instead.
   */
  const attemptStepTransition = useCallback(
    (targetStep: StepId) => {
      if (!featureRequest) return;

      // Get warnings for the target step
      const warnings = getStepWarnings(targetStep, {
        contextFiles: contextFiles ?? undefined,
        featureRequest,
        linkedRepositoryIds: linkedRepositories ?? undefined,
      });

      // If there are caution-severity warnings, show dialog instead of navigating
      if (hasCautionWarnings(warnings)) {
        setPendingNavigation({ targetStep, warnings });
        return;
      }

      // No caution warnings - navigate directly
      setCurrentStep(targetStep);
    },
    [contextFiles, featureRequest, linkedRepositories]
  );

  /**
   * Confirms the pending navigation and navigates to the target step.
   */
  const handleConfirmTransition = useCallback(() => {
    if (pendingNavigation) {
      setCurrentStep(pendingNavigation.targetStep);
      setPendingNavigation(null);
    }
  }, [pendingNavigation]);

  /**
   * Cancels the pending navigation and clears the warning state.
   */
  const handleCancelTransition = useCallback(() => {
    setPendingNavigation(null);
  }, []);

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
      const targetStep = STEP_ORDER[currentIndex - 1] as StepId;
      // Going back typically doesn't need validation warnings
      setCurrentStep(targetStep);
    }
  };

  const handleGoNext = () => {
    if (canGoNext) {
      const targetStep = STEP_ORDER[currentIndex + 1] as StepId;
      // Check for validation warnings when moving forward
      attemptStepTransition(targetStep);
    }
  };

  const handleStepClick = (stepId: string) => {
    const targetStep = stepId as StepId;
    const targetIndex = STEP_ORDER.indexOf(targetStep);

    // Only validate when moving forward
    if (targetIndex > currentIndex) {
      attemptStepTransition(targetStep);
    } else {
      setCurrentStep(targetStep);
    }
  };

  const stepContent: Record<StepId, { description: string; icon: ReactNode; title: string }> = {
    describe: {
      description:
        'Describe your feature idea, select target repositories, and configure context files to include in the planning process.',
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
      title: 'Clarify Requirements',
    },
    research: {
      description: 'AI discovers relevant files and patterns across your connected repositories.',
      icon: <Search className={'size-6'} />,
      title: 'Discover Relevant Files',
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

      {/* Two-Column Grid Layout: Content Left, Stepper Right */}
      <div
        className={'grid'}
        style={{
          gap: 'var(--stepper-gap)',
          gridTemplateColumns: '1fr var(--stepper-width)',
        }}
      >
        {/* Step Content - Left Column */}
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
            {currentStep === 'describe' ? (
              <DescribeStep featureRequest={featureRequest} projectId={projectId} />
            ) : currentStep === 'refine' ? (
              <ClarifyStep
                cancelCallbackRef={cancelCallbackRef}
                featureRequest={featureRequest}
                projectId={projectId}
              />
            ) : currentStep === 'research' ? (
              <DiscoverStep
                cancelCallbackRef={cancelCallbackRef}
                featureRequest={featureRequest}
                projectId={projectId}
              />
            ) : currentStep === 'plan' ? (
              <PlanStep cancelCallbackRef={cancelCallbackRef} featureRequest={featureRequest} projectId={projectId} />
            ) : null}
          </CardContent>
        </Card>

        {/* Workflow Steps - Right Column */}
        <div className={'sticky top-0 self-start'}>
          <WorkflowSteps
            activeOperationStepName={activeOperationStepName}
            canGoBack={canGoBack}
            canGoNext={canGoNext}
            currentIndex={currentIndex}
            currentStep={currentStep}
            isAiOperationRunning={isAnyAiOperationRunning}
            onCancelAiOperation={handleCancelAiOperation}
            onGoBack={handleGoBack}
            onGoNext={handleGoNext}
            onStepClick={handleStepClick}
            staleSteps={staleStepNames}
            totalSteps={STEP_ORDER.length}
          />
        </div>
      </div>

      {/* Step Transition Warning Dialog */}
      <StepTransitionWarningDialog
        onCancel={handleCancelTransition}
        onConfirm={handleConfirmTransition}
        open={pendingNavigation !== null}
        targetStep={pendingNavigation ? STEP_LABELS[pendingNavigation.targetStep] : ''}
        warnings={pendingNavigation?.warnings ?? []}
      />
    </div>
  );
}

function getStepFromStatus(status: FeatureRequestStatus): StepId {
  switch (status) {
    case 'clarifying':
      return 'refine';
    case 'completed':
      return 'plan';
    case 'planning':
      return 'plan';
    case 'researching':
      return 'research';
    case 'describing':
    case 'draft':
    case 'failed':
    default:
      return 'describe';
  }
}
