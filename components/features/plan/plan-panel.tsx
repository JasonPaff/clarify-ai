'use client';

import { AlertCircle, CheckCircle2, ClipboardList, Loader2, RefreshCw } from 'lucide-react';

import type { FeatureRequestRun } from '@/db/schema/feature-request-runs.schema';
import type { FeatureRequest } from '@/db/schema/feature-requests.schema';
import type { FullModelId } from '@/lib/ai/models';
import type { PlanRepositoryOverview } from '@/types/electron';

import { ExportDialog } from '@/components/features/plan/export-dialog';
import { PlanCostEstimate } from '@/components/features/plan/plan-cost-estimate';
import { PlanProgress } from '@/components/features/plan/plan-progress';
import { PlanResults } from '@/components/features/plan/plan-results';
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ui/ai/reasoning';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { usePlan } from '@/hooks/use-plan';
import { getModelInfo } from '@/lib/ai/models';
import { cn } from '@/lib/utils';
import { parseDiscoveredFiles } from '@/lib/validations/discovery';

/** Configuration for the plan generation model */
export interface PlanModelConfig {
  customPrompt?: string;
  maxTokens?: number;
  modelId: FullModelId | null;
  temperature?: number;
  thinkingBudget?: number;
  thinkingEnabled: boolean;
}

type PlanPanelProps = ClassName & {
  /** Current run for the plan step (if any) */
  currentRun?: FeatureRequestRun;
  /** The feature request to generate a plan for */
  featureRequest: FeatureRequest;
  /** Whether the model configuration is loading */
  isConfigLoading?: boolean;
  /** Model configuration from step settings */
  modelConfig: null | PlanModelConfig;
  /** Repository overviews with context for plan generation */
  repositoryOverviews: Array<PlanRepositoryOverview>;
};

/**
 * Main panel component for the plan generation workflow.
 * Orchestrates AI plan generation including idle state, progress, and results display.
 * Model configuration is managed via StepSettingsPanel.
 */
export const PlanPanel = ({
  className,
  currentRun,
  featureRequest,
  isConfigLoading = false,
  modelConfig,
  repositoryOverviews,
}: PlanPanelProps) => {
  const {
    cancelPlanGeneration,
    error,
    isLoading,
    isReasoningStreaming,
    plan,
    progress,
    reasoningText,
    resetPlan,
    startPlanGeneration,
    status,
  } = usePlan({ currentRun, featureRequest, modelConfig });

  // Parse discovered files from the feature request's research findings
  const discoveredFiles = parseDiscoveredFiles(featureRequest.researchFindings);

  // Get clarification context from the feature request
  const clarificationContext = featureRequest.clarificationAnswers ?? undefined;

  const handleStartGeneration = async () => {
    if (!modelConfig?.modelId) return;

    const isModelSupportsThinking = getModelInfo(modelConfig.modelId)?.supportsThinking ?? false;
    const effectiveThinking = isModelSupportsThinking ? modelConfig.thinkingEnabled : false;

    await startPlanGeneration({
      clarificationContext,
      discoveredFiles,
      enableThinking: effectiveThinking,
      repositoryOverviews,
    });
  };

  const handleRegenerate = async () => {
    resetPlan();
    await handleStartGeneration();
  };

  const handleCancel = () => {
    cancelPlanGeneration();
  };

  // Derived conditions
  const hasModelConfigured = modelConfig?.modelId !== null;
  const isReady = !isConfigLoading && hasModelConfigured;
  const hasDiscoveredFiles = discoveredFiles.length > 0;
  const hasRepositoryOverviews = repositoryOverviews.length > 0;
  const hasRequiredData = hasDiscoveredFiles && hasRepositoryOverviews;
  const hasReasoningContent = reasoningText.length > 0;
  const isIdle = status === 'idle';
  const isGenerating = status === 'generating';
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';

  // Complex condition flags for JSX rendering
  const shouldShowMissingDiscoveredFiles = !isConfigLoading && hasModelConfigured && !hasDiscoveredFiles;
  const shouldShowMissingRepositoryOverviews =
    !isConfigLoading && hasModelConfigured && hasDiscoveredFiles && !hasRepositoryOverviews;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Error Display */}
      {error && (
        <Alert variant={'destructive'}>
          <AlertCircle className={'size-4'} />
          <div>
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </div>
        </Alert>
      )}

      {/* Idle State: Show configuration and start button */}
      {isIdle && !isLoading && (
        <div className={'space-y-3'}>
          {/* Loading Config State */}
          {isConfigLoading && (
            <div className={'flex items-center gap-2 rounded-md border border-border bg-muted/30 p-4'}>
              <Loader2 className={'size-4 animate-spin text-muted-foreground'} />
              <span className={'text-sm text-muted-foreground'}>Loading configuration...</span>
            </div>
          )}

          {/* No Model Configured State */}
          {!isConfigLoading && !hasModelConfigured && (
            <Alert>
              <AlertCircle className={'size-4'} />
              <div>
                <AlertTitle>Model Not Configured</AlertTitle>
                <AlertDescription>
                  Please configure a model in the Plan Settings panel above before generating the implementation plan.
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Missing Discovered Files State */}
          {shouldShowMissingDiscoveredFiles && (
            <Alert variant={'warning'}>
              <AlertCircle className={'size-4'} />
              <div>
                <AlertTitle>No Discovered Files</AlertTitle>
                <AlertDescription>
                  Please complete the Discovery step first. The plan generation requires discovered files to create an
                  implementation plan.
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Missing Repository Overviews State */}
          {shouldShowMissingRepositoryOverviews && (
            <Alert variant={'warning'}>
              <AlertCircle className={'size-4'} />
              <div>
                <AlertTitle>No Repository Overviews</AlertTitle>
                <AlertDescription>
                  Please ensure at least one repository has an overview generated. Repository context is required for
                  plan generation.
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Ready State */}
          {isReady && hasRequiredData && (
            <div className={'flex flex-col gap-3'}>
              {/* Cost Estimate */}
              <PlanCostEstimate
                customPrompt={modelConfig?.customPrompt}
                discoveredFiles={discoveredFiles}
                featureRequest={featureRequest.rawRequest ?? ''}
                modelId={modelConfig?.modelId ?? null}
                repositoryOverviews={repositoryOverviews}
              />

              {/* Action Button */}
              <div className={'flex items-center gap-2'}>
                <Button disabled={isLoading} onClick={handleStartGeneration}>
                  <ClipboardList className={'mr-2 size-4'} />
                  Generate Plan
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generating State: Show progress */}
      {isGenerating && (
        <div className={'space-y-3'}>
          {/* Reasoning/Thinking Display */}
          {hasReasoningContent && (
            <Reasoning isStreaming={isReasoningStreaming}>
              <ReasoningTrigger />
              <ReasoningContent className={'h-36'}>{reasoningText}</ReasoningContent>
            </Reasoning>
          )}

          {/* Progress Display */}
          <PlanProgress
            currentStep={progress.currentStep}
            isLoading={isLoading}
            onCancel={handleCancel}
            percentage={progress.percentage}
            status={status}
          />
        </div>
      )}

      {/* Completed State: Show results */}
      {isCompleted && plan && (
        <div className={'space-y-4'}>
          {/* Success Alert */}
          <Alert variant={'success'}>
            <CheckCircle2 className={'size-4'} />
            <div>
              <AlertTitle>Plan Generated</AlertTitle>
              <AlertDescription>
                The implementation plan has been generated successfully with {plan.steps.length} steps.
              </AlertDescription>
            </div>
          </Alert>

          {/* Plan Results */}
          <PlanResults
            onExport={() => {
              // Export is handled via ExportDialog trigger below
            }}
            onRegenerate={handleRegenerate}
            plan={plan}
          />

          {/* Export Dialog */}
          <div className={'flex items-center gap-2'}>
            <ExportDialog
              featureName={featureRequest.title}
              plan={plan}
              trigger={<Button variant={'outline'}>Export Plan</Button>}
            />
            <Button onClick={handleRegenerate} variant={'outline'}>
              <RefreshCw className={'mr-2 size-4'} />
              Regenerate
            </Button>
          </div>
        </div>
      )}

      {/* Failed State: Show error with retry option */}
      {isFailed && (
        <div className={'space-y-4'}>
          <Alert variant={'destructive'}>
            <AlertCircle className={'size-4'} />
            <div>
              <AlertTitle>Plan Generation Failed</AlertTitle>
              <AlertDescription>
                {error ?? 'An error occurred during plan generation. Please try again.'}
              </AlertDescription>
            </div>
          </Alert>

          {/* Retry Button */}
          <div className={'flex items-center gap-2'}>
            <Button onClick={handleRegenerate} variant={'outline'}>
              <RefreshCw className={'mr-2 size-4'} />
              Try Again
            </Button>
            <Button onClick={resetPlan} variant={'ghost'}>
              Reset
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
