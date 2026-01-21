'use client';

import { AlertCircle } from 'lucide-react';
import { MutableRefObject, useEffectEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { FeatureRequest } from '@/db/schema/feature-requests.schema';
import type { FullModelId } from '@/lib/ai/models';
import type { DiscoveryRepositoryOverview } from '@/lib/ai/prompts/discovery';
import type { DiscoveryScopeConfig } from '@/lib/validations/discovery';

import { DiscoveryCostEstimate } from '@/components/features/discovery/discovery-cost-estimate';
import { DiscoveryProgress } from '@/components/features/discovery/discovery-progress';
import { DiscoveryResults } from '@/components/features/discovery/discovery-results';
import { ScopeSelector } from '@/components/features/discovery/scope-selector';
import { AutoSaveStatus } from '@/components/features/workflow/auto-save-status';
import { RepositoryOverviewStatusPanel } from '@/components/features/workflow/repository-overview-status-panel';
import { RunHistoryDropdown } from '@/components/features/workflow/run-history-dropdown';
import { StaleWarningBanner } from '@/components/features/workflow/stale-warning-banner';
import { StepSettingsPanel } from '@/components/features/workflow/step-settings-panel';
import { useWorkflow } from '@/components/providers/workflow-provider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useFeatureRequestRepositories } from '@/hooks/queries/use-feature-request-repositories';
import { useCurrentRun } from '@/hooks/queries/use-feature-request-runs';
import { useRepositories } from '@/hooks/queries/use-repositories';
import { useRepositoryOverviewContents, useRepositoryOverviewStatuses } from '@/hooks/queries/use-repository-overviews';
import { useStepConfig } from '@/hooks/queries/use-step-configurations';
import { useDiscovery } from '@/hooks/use-discovery';
import { useStaleSteps } from '@/hooks/use-stale-steps';

interface DiscoverStepProps {
  /** Ref to register the cancel callback for external cancellation */
  cancelCallbackRef?: MutableRefObject<(() => void) | null>;
  featureRequest: FeatureRequest;
  projectId: number;
}

export const DiscoverStep = ({ cancelCallbackRef, featureRequest, projectId }: DiscoverStepProps) => {
  const { data: config, isLoading: isConfigLoading } = useStepConfig(projectId, 'research');
  const { data: currentRun } = useCurrentRun(featureRequest.id, 'research');
  const { data: repositories } = useRepositories(projectId);
  const { data: featureRequestRepositories } = useFeatureRequestRepositories(featureRequest.id);

  // Workflow context for AI operation tracking
  const { registerAiOperation, unregisterAiOperation } = useWorkflow();

  // Get selected repository IDs from feature request repositories
  // The query returns an array of repository IDs directly
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

  // Track re-run key to force component remount when re-running
  const [rerunKey, setRerunKey] = useState(0);

  // Track last saved timestamp for discovery results
  // SQLite CURRENT_TIMESTAMP stores UTC without 'Z' suffix, so we append it
  // to ensure JavaScript parses it as UTC, not local time
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(
    featureRequest.researchFindings ? new Date(featureRequest.updatedAt + 'Z') : null
  );

  // Track previous isLoading state for AI operation registration
  const previousIsLoadingRef = useRef(false);

  // Scope configuration state
  const [scopeConfig, setScopeConfig] = useState<DiscoveryScopeConfig>({
    excludePatterns: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
    includePatterns: [],
    maxFiles: 500,
  });

  const isDiscoverStale = isStale('research');

  // Build model config from step configuration
  const modelConfig = useMemo(() => {
    if (!config) return null;

    const modelId =
      config.modelProvider && config.modelId ? (`${config.modelProvider}:${config.modelId}` as FullModelId) : null;

    return {
      customPrompt: config.customSystemPrompt ?? undefined,
      maxTokens: config.maxTokens ?? undefined,
      modelId,
      temperature: config.temperature ?? undefined,
      thinkingBudget: config.thinkingBudget ?? undefined,
      thinkingEnabled: config.thinkingEnabled,
    };
  }, [config]);

  // Use the discovery hook for state management
  const {
    addFile,
    cancelDiscovery,
    error,
    files,
    isLoading,
    progress,
    removeFile,
    resetDiscovery,
    startDiscovery,
    status,
    updateFile,
  } = useDiscovery({
    currentRun: currentRun ?? undefined,
    featureRequest,
    modelConfig,
  });

  // Reset state when feature request changes
  if (featureRequest.id !== trackedFeatureId) {
    setTrackedFeatureId(featureRequest.id);
    setLastSavedAt(featureRequest.researchFindings ? new Date(featureRequest.updatedAt + 'Z') : null);
  }

  const updatedLateSavedAt = useEffectEvent(() => {
    setLastSavedAt(new Date());
  });

  // Register/unregister AI operation with workflow context when discovery loading state changes
  // Also update lastSavedAt when discovery completes successfully
  useEffect(() => {
    const wasLoading = previousIsLoadingRef.current;
    previousIsLoadingRef.current = isLoading;

    if (isLoading && !wasLoading) {
      // Discovery started - register the AI operation
      registerAiOperation('research');
    } else if (!isLoading && wasLoading) {
      // Discovery finished (success or failure) - unregister the AI operation
      unregisterAiOperation('research');

      // Update lastSavedAt when discovery completes successfully
      if (status === 'completed' && files.length > 0) {
        updatedLateSavedAt();
      }
    }
  }, [isLoading, registerAiOperation, unregisterAiOperation, status, files.length]);

  // Cleanup AI operation on unmount if still loading
  useEffect(() => {
    return () => {
      if (previousIsLoadingRef.current) {
        unregisterAiOperation('research');
      }
    };
  }, [unregisterAiOperation]);

  // Register the cancel function for external cancellation (e.g., from step navigation)
  useEffect(() => {
    if (cancelCallbackRef) {
      cancelCallbackRef.current = cancelDiscovery;
    }
  }, [cancelCallbackRef, cancelDiscovery]);

  // Build repository options for the results filter
  const repositoryOptions = useMemo(() => {
    if (!repositories) return [];
    return repositories
      .filter((repo) => selectedRepositoryIds.includes(repo.id))
      .map((repo) => ({
        id: repo.id,
        name: repo.name,
      }));
  }, [repositories, selectedRepositoryIds]);

  // Check if all selected repositories have overviews
  const repositoriesMissingOverviews = useMemo(() => {
    if (!overviewStatusMap) return [];
    const missing: Array<{ id: number; name: string }> = [];

    for (const repoId of selectedRepositoryIds) {
      const status = overviewStatusMap.get(repoId);
      if (!status?.hasOverview) {
        const repo = repositories?.find((r) => r.id === repoId);
        if (repo) {
          missing.push({ id: repo.id, name: repo.name });
        }
      }
    }

    return missing;
  }, [overviewStatusMap, selectedRepositoryIds, repositories]);

  const hasRepositoriesMissingOverviews = repositoriesMissingOverviews.length > 0;
  const hasNoRepositoriesSelected = selectedRepositoryIds.length === 0;
  const isDiscoveryComplete = status === 'completed' && files.length > 0;
  const isDiscoveryActive = status === 'scanning' || status === 'analyzing';
  const isDiscoveryIdle = status === 'idle';

  // Determine if we can start discovery
  const canStartDiscovery = !hasNoRepositoriesSelected && !hasRepositoriesMissingOverviews && modelConfig?.modelId;

  const handleRunRestored = useCallback(() => {
    // When a run is restored via RunHistoryDropdown, the currentRun query
    // is automatically invalidated and will refetch the new current run.
    // The discovery hook will detect the change and restore the state.
  }, []);

  const handleStaleRerun = useCallback(async () => {
    // Clear the stale state first
    await clearStale('research');
    // Reset discovery to allow starting fresh
    resetDiscovery();
    // Increment the rerun key to force remount
    setRerunKey((prev) => prev + 1);
  }, [clearStale, resetDiscovery]);

  const handleStaleDismiss = useCallback(async () => {
    // Remove 'research' from staleSteps without re-running
    await clearStale('research');
  }, [clearStale]);

  const handleStartDiscovery = useCallback(async () => {
    if (!repositories || !overviewStatusMap) return;

    // Build repository overviews array for the AI
    const repositoryOverviews: Array<DiscoveryRepositoryOverview> = [];

    for (const repoId of selectedRepositoryIds) {
      const repo = repositories.find((r) => r.id === repoId);
      const status = overviewStatusMap.get(repoId);

      if (repo && status?.hasOverview) {
        repositoryOverviews.push({
          overview: overviewContentsMap?.get(repoId) ?? '',
          repositoryId: repo.id,
          repositoryName: repo.name,
          repositoryPath: repo.path,
        });
      }
    }

    await startDiscovery({
      enableThinking: modelConfig?.thinkingEnabled,
      repositoryOverviews,
      scopeConfig,
    });
  }, [
    repositories,
    overviewStatusMap,
    overviewContentsMap,
    selectedRepositoryIds,
    startDiscovery,
    modelConfig,
    scopeConfig,
  ]);

  const handleCancelDiscovery = useCallback(() => {
    cancelDiscovery();
  }, [cancelDiscovery]);

  const handleScopeChange = useCallback((newConfig: DiscoveryScopeConfig) => {
    setScopeConfig(newConfig);
  }, []);

  const handleUpdateFile = useCallback(
    (path: string, updatedFile: Parameters<typeof updateFile>[1]) => {
      updateFile(path, updatedFile);
    },
    [updateFile]
  );

  const handleRegenerate = useCallback(() => {
    // TODO: Implement repository overview regeneration navigation
    // This should navigate to the repository settings or trigger overview generation
  }, []);

  // Build repository overviews for cost estimate
  const repositoryOverviewsForCostEstimate = useMemo((): Array<DiscoveryRepositoryOverview> => {
    if (!repositories || !overviewStatusMap) return [];

    return selectedRepositoryIds
      .filter((repoId) => overviewStatusMap.get(repoId)?.hasOverview)
      .map((repoId) => {
        const repo = repositories.find((r) => r.id === repoId);
        return {
          overview: '', // Empty for cost estimate - actual content is fetched during discovery
          repositoryId: repoId,
          repositoryName: repo?.name ?? 'Unknown',
          repositoryPath: repo?.path ?? '',
        };
      });
  }, [repositories, overviewStatusMap, selectedRepositoryIds]);

  return (
    <div className={'flex flex-col gap-6'} key={rerunKey}>
      {/* Stale Warning Banner */}
      {isDiscoverStale && (
        <StaleWarningBanner
          onDismiss={handleStaleDismiss}
          onRerun={handleStaleRerun}
          reason={
            'The feature description or clarification results have been modified since discovery was last run. Results may no longer be accurate.'
          }
          stepName={'Discovery'}
        />
      )}

      {/* Section 1: Step Header with Settings, Cost Estimate, and Run History */}
      <div className={'flex items-center justify-between gap-4'}>
        <StepSettingsPanel className={'flex-1'} projectId={projectId} step={'research'} />

        {/* Cost Estimate and Run History */}
        <div className={'flex items-center gap-3'}>
          <DiscoveryCostEstimate
            customPrompt={modelConfig?.customPrompt}
            featureRequest={featureRequest.rawRequest ?? ''}
            isLoading={isConfigLoading}
            modelId={modelConfig?.modelId ?? null}
            repositoryOverviews={repositoryOverviewsForCostEstimate}
            variant={'compact'}
          />
          <RunHistoryDropdown
            featureRequestId={featureRequest.id}
            onRunRestored={handleRunRestored}
            step={'research'}
          />
        </div>
      </div>

      {/* Discovery Error Alert */}
      {error && (
        <Alert variant={'destructive'}>
          <AlertCircle className={'size-4'} />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Section 2: Repository Overview Status */}
      <section className={'flex flex-col gap-3'}>
        <h3 className={'text-sm font-medium text-foreground'}>Repository Context</h3>
        {hasNoRepositoriesSelected ? (
          <div className={'rounded-md border border-border bg-muted/30 p-4 text-center'}>
            <p className={'text-sm text-muted-foreground'}>
              No repositories selected. Please select repositories for this feature request.
            </p>
          </div>
        ) : (
          <RepositoryOverviewStatusPanel
            onRegenerate={handleRegenerate}
            projectId={projectId}
            repositoryIds={selectedRepositoryIds}
          />
        )}

        {/* Missing Overview Warning */}
        {hasRepositoriesMissingOverviews && (
          <div
            className={
              'flex items-start gap-3 rounded-md border border-amber-500/50 bg-amber-500/5 p-3 text-sm text-amber-600 dark:text-amber-400'
            }
          >
            <span className={'font-medium'}>Missing Overviews:</span>
            <span>
              {repositoriesMissingOverviews.length === 1
                ? `"${repositoriesMissingOverviews[0]?.name}" needs an overview before discovery can start.`
                : `${repositoriesMissingOverviews.length} repositories need overviews before discovery can start.`}
            </span>
          </div>
        )}
      </section>

      {/* Section 3: Scope Configuration */}
      {!isDiscoveryActive && !isDiscoveryComplete && (
        <Collapsible>
          <CollapsibleTrigger className={'w-full justify-between rounded-md border border-border bg-muted/30 p-3'}>
            <span className={'text-sm font-medium'}>Scope Configuration</span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className={'mt-2'}>
              <ScopeSelector
                onScopeChange={handleScopeChange}
                repositories={repositories?.map((r) => ({ id: r.id, name: r.name, path: r.path })) ?? []}
                scopeConfig={scopeConfig}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Section 4: Discovery Progress */}
      {isDiscoveryActive && (
        <DiscoveryProgress
          currentStep={progress.currentStep}
          filesDiscovered={files.length}
          isLoading={isLoading}
          onCancel={handleCancelDiscovery}
          percentage={progress.percentage}
          status={status}
        />
      )}

      {/* Section 5: Discovery Results */}
      {isDiscoveryComplete && (
        <section className={'flex flex-col gap-3'}>
          <DiscoveryResults
            discoveredFiles={files}
            onAddFile={addFile}
            onRemoveFile={removeFile}
            onUpdateFile={handleUpdateFile}
            projectId={projectId}
            repositories={repositoryOptions}
          />

          {/* Auto-Save Status */}
          <div className={'flex items-center justify-end'}>
            <AutoSaveStatus isSaving={isLoading} lastSavedAt={lastSavedAt} />
          </div>
        </section>
      )}

      {/* Section 6: Action Buttons */}
      {isDiscoveryIdle && (
        <div className={'flex items-center gap-3'}>
          <Button disabled={!canStartDiscovery || isConfigLoading} onClick={handleStartDiscovery} size={'default'}>
            {isConfigLoading ? 'Loading...' : 'Start Discovery'}
          </Button>
          {!canStartDiscovery && !isConfigLoading && (
            <p className={'text-sm text-muted-foreground'}>
              {hasNoRepositoriesSelected
                ? 'Select at least one repository'
                : hasRepositoriesMissingOverviews
                  ? 'Generate missing repository overviews first'
                  : 'Configure a model in step settings'}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
