'use client';

import type { RefObject } from 'react';

import { Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import type { FeatureRequest } from '@/db/schema/feature-requests.schema';
import type { ClarificationContextFile, ClarificationRepositoryOverview } from '@/types/electron';

import { AISettingsInline } from '@/components/ai-settings';
import { ClarificationPanel } from '@/components/features/clarification/clarification-panel';
import { ClarificationCostEstimate } from '@/components/features/clarification/cost-estimate';
import { AutoSaveStatus } from '@/components/features/workflow/auto-save-status';
import { FileSearchDialog } from '@/components/features/workflow/file-search-dialog';
import { RunHistoryDropdown } from '@/components/features/workflow/run-history-dropdown';
import { SaveErrorAlert } from '@/components/features/workflow/save-error-alert';
import { StaleWarningBanner } from '@/components/features/workflow/stale-warning-banner';
import { StreamingErrorFallback } from '@/components/features/workflow/streaming-error-fallback';
import { ClarifyStepSkeleton } from '@/components/skeletons/clarify-step-skeleton';
import { Button } from '@/components/ui/button';
import { useContextFiles } from '@/hooks/queries/use-feature-request-context-files';
import { useFeatureRequestRepositories } from '@/hooks/queries/use-feature-request-repositories';
import { useCurrentRun } from '@/hooks/queries/use-feature-request-runs';
import { useUpdateFeatureRequest } from '@/hooks/queries/use-feature-requests';
import { useRepositories } from '@/hooks/queries/use-repositories';
import { useRepositoryOverviewContents, useRepositoryOverviewStatuses } from '@/hooks/queries/use-repository-overviews';
import { useProjectAISettings } from '@/hooks/use-project-ai-settings';
import { useStaleSteps } from '@/hooks/use-stale-steps';
import { useElectronFs } from '@/hooks/useElectron';

interface ClarifyStepProps {
  /** Ref to register the cancel callback for external cancellation */
  cancelCallbackRef?: RefObject<(() => void) | null>;
  featureRequest: FeatureRequest;
  // projectId is accepted for API consistency with other step components
  // but not currently used by ClarificationPanel
  projectId?: number;
}

export const ClarifyStep = ({ cancelCallbackRef, featureRequest }: ClarifyStepProps) => {
  const [trackedFeatureId, setTrackedFeatureId] = useState(featureRequest.id);
  // SQLite CURRENT_TIMESTAMP stores UTC without 'Z' suffix, so we append it
  // to ensure JavaScript parses it as UTC, not local time
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(
    featureRequest.clarificationStatus === 'completed' ? new Date(featureRequest.updatedAt + 'Z') : null
  );
  // Track re-run key to force ClarificationPanel remount when re-running
  const [rerunKey, setRerunKey] = useState(0);
  // Track error boundary key for resetting after errors
  const [errorBoundaryKey, setErrorBoundaryKey] = useState(0);

  const settings = useProjectAISettings(featureRequest.projectId, 'refine');
  const { data: currentRun } = useCurrentRun(featureRequest.id, 'refine');
  const isConfigLoading = settings.isPersisting;
  const { data: contextFiles = [] } = useContextFiles(featureRequest.id);
  const { data: repositories } = useRepositories(featureRequest.projectId);
  const { data: featureRequestRepositories } = useFeatureRequestRepositories(featureRequest.id);
  const { data: overviewStatusMap } = useRepositoryOverviewStatuses(featureRequestRepositories ?? []);
  const { data: overviewContentsMap } = useRepositoryOverviewContents(featureRequestRepositories ?? []);
  const { isElectron, readFile } = useElectronFs();
  const updateMutation = useUpdateFeatureRequest();

  // Use the centralized stale steps hook
  const { clearStale, isStale } = useStaleSteps({
    featureRequestId: featureRequest.id,
    staleStepsJson: featureRequest.staleSteps,
  });

  // Reset state when featureRequest changes
  if (featureRequest.id !== trackedFeatureId) {
    setTrackedFeatureId(featureRequest.id);
    setLastSavedAt(
      featureRequest.clarificationStatus === 'completed' ? new Date(featureRequest.updatedAt + 'Z') : null
    );
  }

  // Update lastSavedAt when clarification status changes to completed
  const isClarificationCompleted = featureRequest.clarificationStatus === 'completed';
  const isSaving = updateMutation.isPending;
  const saveError = updateMutation.error;

  const isRefineStale = isStale('refine');

  const selectedRepositoryIds = useMemo(() => {
    return featureRequestRepositories ?? [];
  }, [featureRequestRepositories]);

  const repositoryOverviews = useMemo((): Array<ClarificationRepositoryOverview> => {
    if (!repositories || !overviewStatusMap) return [];

    return selectedRepositoryIds
      .filter((repoId) => overviewStatusMap.get(repoId)?.hasOverview)
      .map((repoId) => {
        const repo = repositories.find((item) => item.id === repoId);
        return {
          overview: overviewContentsMap?.get(repoId) ?? '',
          repositoryId: repoId,
          repositoryName: repo?.name ?? 'Unknown',
          repositoryPath: repo?.path ?? '',
        };
      });
  }, [overviewContentsMap, overviewStatusMap, repositories, selectedRepositoryIds]);

  // Repositories formatted for FileSearchDialog
  const linkedRepositories = useMemo(() => {
    if (!repositories) return [];

    return selectedRepositoryIds
      .map((repoId) => {
        const repo = repositories.find((item) => item.id === repoId);
        if (!repo) return null;
        return {
          id: repo.id,
          name: repo.name,
          path: repo.path,
        };
      })
      .filter((repo): repo is { id: number; name: string; path: string } => repo !== null);
  }, [repositories, selectedRepositoryIds]);

  const hasLinkedRepositories = linkedRepositories.length > 0;

  const includedContextFiles = useMemo(() => {
    return contextFiles.filter((file) => file.includedInContext && file.fileType !== 'image');
  }, [contextFiles]);

  const [contextFileContents, setContextFileContents] = useState<Array<ClarificationContextFile>>([]);

  useEffect(() => {
    let isActive = true;

    const loadContextFiles = async () => {
      if (!isElectron) return;

      if (includedContextFiles.length === 0) {
        setContextFileContents([]);
        return;
      }

      const results = await Promise.all(
        includedContextFiles.map(async (file) => {
          const result = await readFile(file.filePath);
          const excerpt = result.success ? (result.content ?? undefined) : undefined;

          return {
            displayName: file.displayName,
            excerpt,
            filePath: file.filePath,
            fileType: file.fileType,
          };
        })
      );

      if (isActive) {
        setContextFileContents(results);
      }
    };

    void loadContextFiles();

    return () => {
      isActive = false;
    };
  }, [includedContextFiles, isElectron, readFile]);

  // Derive modelConfig from the new settings hook for backward compatibility with ClarificationPanel
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

  const handleRunRestored = useCallback(() => {
    // When a run is restored via RunHistoryDropdown, the currentRun query
    // is automatically invalidated and will refetch the new current run.
    // ClarificationPanel will receive the updated currentRun prop and
    // trigger restoration of the state via restoreFromRun.
    // No additional action needed here as query cache handles the update.
  }, []);

  const handleStaleRerun = useCallback(async () => {
    // Clear the stale state first
    await clearStale('refine');
    // Increment the rerun key to force ClarificationPanel remount
    // This will reset it to idle state so user can click "Analyze Request"
    setRerunKey((prev) => prev + 1);
  }, [clearStale]);

  const handleStaleDismiss = useCallback(async () => {
    // Remove 'refine' from staleSteps without re-running
    await clearStale('refine');
  }, [clearStale]);

  const handleClarificationComplete = useCallback(() => {
    // Update lastSavedAt when clarification answers are saved
    setLastSavedAt(new Date());
  }, []);

  // Handler to register cancel function from ClarificationPanel
  const handleCancelRegister = useCallback(
    (cancelFn: () => void) => {
      if (cancelCallbackRef) {
        cancelCallbackRef.current = cancelFn;
      }
    },
    [cancelCallbackRef]
  );

  const handleSaveRetry = useCallback(() => {
    // Reset mutation state to allow retry
    updateMutation.reset();
  }, [updateMutation]);

  const handleErrorBoundaryReset = useCallback(() => {
    // Increment key to remount the component after error recovery
    setErrorBoundaryKey((prev) => prev + 1);
  }, []);

  // Handler for when files are added via FileSearchDialog
  // Note: Cache invalidation is handled by useBulkAddContextFiles mutation onSuccess
  const handleFilesAdded = useCallback(() => {
    // The useBulkAddContextFiles mutation already invalidates the context files query
    // This callback is provided for any additional side effects if needed in the future
  }, []);

  // Show skeleton during initial configuration loading
  if (isConfigLoading) {
    return <ClarifyStepSkeleton />;
  }

  return (
    <div className={'flex flex-col gap-6'}>
      {/* Stale Warning Banner */}
      {isRefineStale && (
        <StaleWarningBanner
          onDismiss={handleStaleDismiss}
          onRerun={handleStaleRerun}
          reason={
            'The feature description has been modified since clarification was last run. Results may no longer be accurate.'
          }
          stepName={'Clarification'}
        />
      )}

      {/* Section 1: Step Header with Settings, Cost Estimate, and Run History */}
      <div className={'flex flex-col gap-3'}>
        <AISettingsInline settings={settings} step={'refine'} stepLabel={'Clarify'} />

        {/* Cost Estimate, Context Files, and Run History */}
        <div className={'flex flex-wrap items-center justify-end gap-3'}>
          <ClarificationCostEstimate
            customPrompt={modelConfig?.customPrompt}
            featureRequestContent={featureRequest.rawRequest ?? ''}
            isLoading={isConfigLoading}
            modelId={modelConfig?.modelId ?? null}
            variant={'compact'}
          />

          {/* Find Context Files Button */}
          {hasLinkedRepositories && (
            <FileSearchDialog
              featureRequestId={featureRequest.id}
              onFilesAdded={handleFilesAdded}
              repositories={linkedRepositories}
            >
              <Button size={'sm'} variant={'outline'}>
                <Search aria-hidden={'true'} className={'mr-2 size-4'} />
                Find Context Files
              </Button>
            </FileSearchDialog>
          )}

          <RunHistoryDropdown featureRequestId={featureRequest.id} onRunRestored={handleRunRestored} step={'refine'} />
        </div>
      </div>

      {/* Save Error Alert */}
      <SaveErrorAlert error={saveError} onRetry={handleSaveRetry} />

      {/* Section 2: Clarification Content */}
      <section className={'flex flex-col gap-3'}>
        <ErrorBoundary
          fallbackRender={(props) => <StreamingErrorFallback {...props} stepName={'Clarification'} />}
          key={errorBoundaryKey}
          onReset={handleErrorBoundaryReset}
        >
          <ClarificationPanel
            contextFileCount={includedContextFiles.length}
            contextFiles={contextFileContents}
            currentRun={currentRun ?? undefined}
            featureRequest={featureRequest}
            isConfigLoading={isConfigLoading}
            key={rerunKey}
            linkedRepositoriesCount={selectedRepositoryIds.length}
            modelConfig={modelConfig}
            onCancelRegister={handleCancelRegister}
            onComplete={handleClarificationComplete}
            repositoryOverviews={repositoryOverviews}
          />
        </ErrorBoundary>

        {/* Auto-Save Status */}
        {isClarificationCompleted && (
          <div className={'flex items-center justify-end'}>
            <AutoSaveStatus isSaving={isSaving} lastSavedAt={lastSavedAt} />
          </div>
        )}
      </section>
    </div>
  );
};
