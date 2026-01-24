'use client';

import type { MutableRefObject } from 'react';

import { ClipboardList } from 'lucide-react';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import type { FeatureRequest } from '@/db/schema/feature-requests.schema';
import type { PlanRepositoryOverview } from '@/types/electron';

import { AISettingsInline } from '@/components/ai-settings';
import { PlanCostEstimate } from '@/components/features/plan/plan-cost-estimate';
import { PlanPanel } from '@/components/features/plan/plan-panel';
import { AutoSaveStatus } from '@/components/features/workflow/auto-save-status';
import { RunHistoryDropdown } from '@/components/features/workflow/run-history-dropdown';
import { SaveErrorAlert } from '@/components/features/workflow/save-error-alert';
import { StaleWarningBanner } from '@/components/features/workflow/stale-warning-banner';
import { StreamingErrorFallback } from '@/components/features/workflow/streaming-error-fallback';
import { WorkflowEmptyState } from '@/components/features/workflow/workflow-empty-state';
import { useWorkflow } from '@/components/providers/workflow-provider';
import { PlanStepSkeleton } from '@/components/skeletons/plan-step-skeleton';
import { useFeatureRequestRepositories } from '@/hooks/queries/use-feature-request-repositories';
import { useCurrentRun } from '@/hooks/queries/use-feature-request-runs';
import { useRepositories } from '@/hooks/queries/use-repositories';
import { useRepositoryOverviewContents, useRepositoryOverviewStatuses } from '@/hooks/queries/use-repository-overviews';
import { useProjectAISettings } from '@/hooks/use-project-ai-settings';
import { useStaleSteps } from '@/hooks/use-stale-steps';
import { parseDiscoveredFiles } from '@/lib/validations/discovery';

interface PlanStepProps {
  /** Ref to register the cancel callback for external cancellation */
  cancelCallbackRef?: MutableRefObject<(() => void) | null>;
  featureRequest: FeatureRequest;
  projectId: number;
}

export const PlanStep = ({ cancelCallbackRef, featureRequest, projectId }: PlanStepProps) => {
  const settings = useProjectAISettings(projectId, 'plan');
  const { data: currentRun } = useCurrentRun(featureRequest.id, 'plan');
  const isConfigLoading = settings.isPersisting;
  const { data: repositories } = useRepositories(projectId);
  const { data: featureRequestRepositories } = useFeatureRequestRepositories(featureRequest.id);

  // Workflow context for AI operation tracking
  const { registerAiOperation, unregisterAiOperation } = useWorkflow();

  // Get selected repository IDs from feature request repositories
  const selectedRepositoryIds = useMemo(() => {
    return featureRequestRepositories ?? [];
  }, [featureRequestRepositories]);

  // Get overview statuses for selected repositories
  const { data: overviewStatusMap } = useRepositoryOverviewStatuses(selectedRepositoryIds);

  // Get overview content for selected repositories
  const { data: overviewContentsMap } = useRepositoryOverviewContents(selectedRepositoryIds);

  // Use the centralized stale steps hook
  const { clearStale, isStale } = useStaleSteps({
    featureRequestId: featureRequest.id,
    staleStepsJson: featureRequest.staleSteps,
  });

  // Track feature request ID for state reset detection
  const [trackedFeatureId, setTrackedFeatureId] = useState(featureRequest.id);

  // Track re-run key to force PlanPanel remount when re-running
  const [rerunKey, setRerunKey] = useState(0);
  // Track error boundary key for resetting after errors
  const [errorBoundaryKey, setErrorBoundaryKey] = useState(0);

  // Track last saved timestamp for plan results
  // SQLite CURRENT_TIMESTAMP stores UTC without 'Z' suffix, so we append it
  // to ensure JavaScript parses it as UTC, not local time
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(
    featureRequest.implementationPlan ? new Date(featureRequest.updatedAt + 'Z') : null
  );

  // Track loading state for AI operation registration
  const [isGenerating, setIsGenerating] = useState(false);

  // Track plan error state for SaveErrorAlert
  const [planError, setPlanError] = useState<Error | null>(null);

  // Track previous isGenerating state for AI operation registration
  const previousIsGeneratingRef = useRef(false);

  const isPlanStale = isStale('plan');

  // Reset state when feature request changes
  if (featureRequest.id !== trackedFeatureId) {
    setTrackedFeatureId(featureRequest.id);
    setLastSavedAt(featureRequest.implementationPlan ? new Date(featureRequest.updatedAt + 'Z') : null);
    setPlanError(null);
  }

  // Register/unregister AI operation with workflow context when generation state changes
  // Also update lastSavedAt when generation completes successfully
  useEffect(() => {
    const wasGenerating = previousIsGeneratingRef.current;
    previousIsGeneratingRef.current = isGenerating;

    if (isGenerating && !wasGenerating) {
      // Plan generation started - register the AI operation
      registerAiOperation('plan');
    } else if (!isGenerating && wasGenerating) {
      // Plan generation finished (success or failure) - unregister the AI operation
      unregisterAiOperation('plan');
    }
  }, [isGenerating, registerAiOperation, unregisterAiOperation]);

  // Cleanup AI operation on unmount if still generating
  useEffect(() => {
    return () => {
      if (previousIsGeneratingRef.current) {
        unregisterAiOperation('plan');
      }
    };
  }, [unregisterAiOperation]);

  // Derive modelConfig from the new settings hook for backward compatibility
  const modelConfig = useMemo(() => {
    return {
      customPrompt: settings.values.customSystemPrompt,
      maxTokens: settings.values.maxTokens,
      modelId: settings.values.modelId ?? null,
      temperature: settings.values.temperature,
      thinkingBudget: settings.values.thinkingBudget,
      thinkingEnabled: settings.values.thinkingEnabled ?? false,
    };
  }, [settings.values]);

  // Build repository overviews for plan generation
  const repositoryOverviews = useMemo((): Array<PlanRepositoryOverview> => {
    if (!repositories || !overviewStatusMap || !overviewContentsMap) return [];

    return selectedRepositoryIds
      .filter((repoId) => overviewStatusMap.get(repoId)?.hasOverview)
      .map((repoId) => {
        const repo = repositories.find((r) => r.id === repoId);
        return {
          overview: overviewContentsMap.get(repoId) ?? '',
          repositoryId: repoId,
          repositoryName: repo?.name ?? 'Unknown',
          repositoryPath: repo?.path ?? '',
        };
      });
  }, [repositories, overviewStatusMap, overviewContentsMap, selectedRepositoryIds]);

  // Parse discovered files from research findings for cost estimate
  const discoveredFiles = useMemo(() => {
    return parseDiscoveredFiles(featureRequest.researchFindings);
  }, [featureRequest.researchFindings]);

  // Derived conditions for empty state
  const hasExistingPlan = !!featureRequest.implementationPlan;
  const hasCurrentRun = !!currentRun;
  const hasDiscoveredFiles = discoveredFiles.length > 0;
  const hasRepositoryOverviews = repositoryOverviews.length > 0;

  // Show empty state when plan step is accessed without prerequisites completed
  // This provides guidance before showing the more detailed PlanPanel
  const shouldShowEmptyState = !hasExistingPlan && !hasCurrentRun && !hasDiscoveredFiles;

  // Determine the appropriate empty state message based on missing prerequisites
  const emptyStateDescription = useMemo(() => {
    if (!hasDiscoveredFiles && !hasRepositoryOverviews) {
      return 'Complete the Discovery step to identify relevant files before generating an implementation plan. The Discovery step analyzes your repositories to find files related to your feature request.';
    }
    if (!hasDiscoveredFiles) {
      return 'Complete the Discovery step first to identify relevant files in your codebase. These discovered files provide the context needed to create an accurate implementation plan.';
    }
    return 'Configure your model settings and click "Generate Plan" to create an implementation plan for this feature request.';
  }, [hasDiscoveredFiles, hasRepositoryOverviews]);

  const handleRunRestored = useCallback(() => {
    // When a run is restored via RunHistoryDropdown, the currentRun query
    // is automatically invalidated and will refetch the new current run.
    // PlanPanel will receive the updated currentRun prop and
    // trigger restoration of the state via usePlan hook.
    // No additional action needed here as query cache handles the update.
  }, []);

  const handleStaleRerun = useCallback(async () => {
    // Clear the stale state first
    await clearStale('plan');
    // Increment the rerun key to force PlanPanel remount
    // This will reset it to idle state so user can click "Generate Plan"
    setRerunKey((prev) => prev + 1);
  }, [clearStale]);

  const handleStaleDismiss = useCallback(async () => {
    // Remove 'plan' from staleSteps without re-running
    await clearStale('plan');
  }, [clearStale]);

  // Callback for when plan generation starts
  const handleGenerationStart = useCallback(() => {
    setIsGenerating(true);
    setPlanError(null);
  }, []);

  // Callback for when plan generation completes successfully
  const handleGenerationComplete = useCallback(() => {
    setIsGenerating(false);
    setLastSavedAt(new Date());
    setPlanError(null);
  }, []);

  // Callback for when plan generation fails
  const handleGenerationError = useCallback((error: string) => {
    setIsGenerating(false);
    setPlanError(new Error(error));
  }, []);

  // Callback for retrying after error
  const handleRetry = useCallback(() => {
    setPlanError(null);
  }, []);

  // Handler to register cancel function from PlanPanel
  const handleCancelRegister = useCallback(
    (cancelFn: () => void) => {
      if (cancelCallbackRef) {
        cancelCallbackRef.current = cancelFn;
      }
    },
    [cancelCallbackRef]
  );

  const handleErrorBoundaryReset = useCallback(() => {
    // Increment key to remount the component after error recovery
    setErrorBoundaryKey((prev) => prev + 1);
  }, []);

  // Show skeleton during initial configuration loading
  if (isConfigLoading) {
    return <PlanStepSkeleton />;
  }

  return (
    <div className={'flex flex-col gap-6'} key={rerunKey}>
      {/* Stale Warning Banner */}
      {isPlanStale && (
        <StaleWarningBanner
          onDismiss={handleStaleDismiss}
          onRerun={handleStaleRerun}
          reason={
            'The feature description, clarification results, or discovery results have been modified since the plan was last generated. Results may no longer be accurate.'
          }
          stepName={'Plan'}
        />
      )}

      {/* Section 1: Step Header with Settings, Cost Estimate, and Run History */}
      <div className={'flex flex-col gap-3'}>
        <AISettingsInline settings={settings} step={'plan'} stepLabel={'Plan'} />

        {/* Cost Estimate and Run History */}
        <div className={'flex flex-wrap items-center justify-end gap-3'}>
          <PlanCostEstimate
            customPrompt={modelConfig?.customPrompt}
            discoveredFiles={discoveredFiles}
            featureRequest={featureRequest.rawRequest ?? ''}
            isLoading={isConfigLoading}
            modelId={modelConfig?.modelId ?? null}
            repositoryOverviews={repositoryOverviews}
            variant={'compact'}
          />
          <RunHistoryDropdown featureRequestId={featureRequest.id} onRunRestored={handleRunRestored} step={'plan'} />
        </div>
      </div>

      {/* Save Error Alert */}
      <SaveErrorAlert error={planError} onRetry={handleRetry} />

      {/* Section 2: Plan Content */}
      <section className={'flex flex-col gap-3'}>
        {shouldShowEmptyState ? (
          <WorkflowEmptyState
            customDescription={emptyStateDescription}
            customIcon={<ClipboardList className={'size-6'} />}
            customTitle={'No Implementation Plan'}
            variant={'noResults'}
          />
        ) : (
          <Fragment>
            <ErrorBoundary
              fallbackRender={(props) => <StreamingErrorFallback {...props} stepName={'Plan Generation'} />}
              key={errorBoundaryKey}
              onReset={handleErrorBoundaryReset}
            >
              <PlanPanel
                currentRun={currentRun ?? undefined}
                featureRequest={featureRequest}
                isConfigLoading={isConfigLoading}
                modelConfig={modelConfig}
                onCancelRegister={handleCancelRegister}
                onGenerationComplete={handleGenerationComplete}
                onGenerationError={handleGenerationError}
                onGenerationStart={handleGenerationStart}
                repositoryOverviews={repositoryOverviews}
              />
            </ErrorBoundary>

            {/* Auto-Save Status */}
            <div className={'flex items-center justify-end'}>
              <AutoSaveStatus isSaving={isGenerating} lastSavedAt={lastSavedAt} />
            </div>
          </Fragment>
        )}
      </section>
    </div>
  );
};
