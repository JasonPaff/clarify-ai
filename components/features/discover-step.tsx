'use client';

import type { RefObject } from 'react';

import { AlertCircle, Sparkles, Zap } from 'lucide-react';
import { useEffectEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import type { FeatureRequest } from '@/db/schema/feature-requests.schema';
import type { FullModelId } from '@/lib/ai/models';
import type { DiscoveryRepositoryOverview } from '@/lib/ai/prompts/discovery';
import type { DiscoveryScopeConfig } from '@/lib/validations/discovery';
import type { AiDiscoveryAssistedRepositoryOverview } from '@/types/electron';

import { AiDiscoveryPanel } from '@/components/features/discovery/ai-discovery-panel';
import { DiscoveryCostEstimate } from '@/components/features/discovery/discovery-cost-estimate';
import { DiscoveryProgress } from '@/components/features/discovery/discovery-progress';
import { DiscoveryResults } from '@/components/features/discovery/discovery-results';
import { ScopeSelector } from '@/components/features/discovery/scope-selector';
import { AutoSaveStatus } from '@/components/features/workflow/auto-save-status';
import { RepositoryOverviewStatusPanel } from '@/components/features/workflow/repository-overview-status-panel';
import { RunHistoryDropdown } from '@/components/features/workflow/run-history-dropdown';
import { StaleWarningBanner } from '@/components/features/workflow/stale-warning-banner';
import { StepSettingsPanel } from '@/components/features/workflow/step-settings-panel';
import { StreamingErrorFallback } from '@/components/features/workflow/streaming-error-fallback';
import { useWorkflow } from '@/components/providers/workflow-provider';
import { DiscoverySkeleton } from '@/components/skeletons/discovery-skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TabsIndicator, TabsList, TabsPanel, TabsRoot, TabsTrigger } from '@/components/ui/tabs';
import { useFeatureRequestRepositories } from '@/hooks/queries/use-feature-request-repositories';
import { useCurrentRun } from '@/hooks/queries/use-feature-request-runs';
import { useRepositories } from '@/hooks/queries/use-repositories';
import { useRepositoryOverviewContents, useRepositoryOverviewStatuses } from '@/hooks/queries/use-repository-overviews';
import { useStepConfig } from '@/hooks/queries/use-step-configurations';
import { useDiscovery } from '@/hooks/use-discovery';
import { useStaleSteps } from '@/hooks/use-stale-steps';
import { useElectronFs } from '@/hooks/useElectron';
import { buildClarificationContext } from '@/lib/ai/clarification-context';

interface DiscoverStepProps {
  /** Ref to register the cancel callback for external cancellation */
  cancelCallbackRef?: RefObject<(() => void) | null>;
  featureRequest: FeatureRequest;
  projectId: number;
}

/** Discovery mode type */
type DiscoveryMode = 'ai' | 'fast';

export const DiscoverStep = ({ cancelCallbackRef, featureRequest, projectId }: DiscoverStepProps) => {
  const { data: config, isLoading: isConfigLoading } = useStepConfig(projectId, 'research');
  const { data: currentRun } = useCurrentRun(featureRequest.id, 'research');
  const { data: repositories } = useRepositories(projectId);
  const { data: featureRequestRepositories } = useFeatureRequestRepositories(featureRequest.id);
  const { collectRepositoryData } = useElectronFs();

  // Workflow context for AI operation tracking
  const { registerAiOperation, unregisterAiOperation } = useWorkflow();

  // Discovery mode state - persists during session
  const [discoveryMode, setDiscoveryMode] = useState<DiscoveryMode>('fast');

  // AI Discovery file tree state
  const [aiFileTree, setAiFileTree] = useState<string>('');
  const [aiEstimatedTokens, setAiEstimatedTokens] = useState<number>(0);
  const [isLoadingFileTree, setIsLoadingFileTree] = useState(false);

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
  // Track error boundary key for resetting after errors
  const [errorBoundaryKey, setErrorBoundaryKey] = useState(0);

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

  const clarificationContext = useMemo(() => {
    return buildClarificationContext(featureRequest.clarificationQuestions, featureRequest.clarificationAnswers);
  }, [featureRequest.clarificationAnswers, featureRequest.clarificationQuestions]);

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
  const isDiscoveryComplete = status === 'completed';
  const isDiscoveryActive = status === 'scanning' || status === 'analyzing';
  const isDiscoveryIdle = status === 'idle';

  // Determine if we can start discovery
  const canStartDiscovery = !hasNoRepositoriesSelected && !hasRepositoriesMissingOverviews && modelConfig?.modelId;

  // Build repository overviews for AI Discovery panel
  const aiRepositoryOverviews = useMemo((): Array<AiDiscoveryAssistedRepositoryOverview> => {
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

  // Build AI Discovery model config
  const aiModelConfig = useMemo(() => {
    if (!modelConfig?.modelId) return null;
    return {
      customPrompt: modelConfig.customPrompt,
      enableThinking: modelConfig.thinkingEnabled,
      maxTokens: modelConfig.maxTokens,
      modelId: modelConfig.modelId,
      temperature: modelConfig.temperature,
      thinkingBudget: modelConfig.thinkingBudget,
    };
  }, [modelConfig]);

  // Build file tree when switching to AI Discovery mode or when repositories change
  useEffect(() => {
    if (discoveryMode !== 'ai') return;
    if (!repositories || selectedRepositoryIds.length === 0) {
      setAiFileTree('');
      setAiEstimatedTokens(0);
      return;
    }

    let isCancelled = false;

    const buildFileTree = async () => {
      setIsLoadingFileTree(true);

      try {
        // Collect file trees from all selected repositories
        const fileTrees: Array<string> = [];
        let totalTokens = 0;

        for (const repoId of selectedRepositoryIds) {
          if (isCancelled) return;

          const repo = repositories.find((r) => r.id === repoId);
          if (!repo) continue;

          const result = await collectRepositoryData(repo.path);
          if (result.success && result.data) {
            fileTrees.push(`# Repository: ${repo.name}\n${result.data.fileTree}`);
            // Estimate tokens (roughly 4 characters per token)
            totalTokens += Math.ceil(result.data.fileTree.length / 4);
          }
        }

        if (!isCancelled) {
          setAiFileTree(fileTrees.join('\n\n'));
          setAiEstimatedTokens(totalTokens);
        }
      } catch {
        // Silently handle errors - the panel will show appropriate warnings
        if (!isCancelled) {
          setAiFileTree('');
          setAiEstimatedTokens(0);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingFileTree(false);
        }
      }
    };

    void buildFileTree();

    return () => {
      isCancelled = true;
    };
  }, [discoveryMode, repositories, selectedRepositoryIds, collectRepositoryData]);

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
      clarificationContext: clarificationContext ?? undefined,
      enableThinking: modelConfig?.thinkingEnabled,
      repositoryOverviews,
      scopeConfig,
    });
  }, [
    clarificationContext,
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

  const handleErrorBoundaryReset = useCallback(() => {
    // Increment key to remount the component after error recovery
    setErrorBoundaryKey((prev) => prev + 1);
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

  // Show skeleton during initial configuration loading
  if (isConfigLoading) {
    return <DiscoverySkeleton />;
  }

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
      <div className={'flex flex-col gap-3'}>
        <StepSettingsPanel projectId={projectId} step={'research'} />

        {/* Cost Estimate and Run History */}
        <div className={'flex flex-wrap items-center justify-end gap-3'}>
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
            className={`flex items-start gap-3 rounded-md border border-amber-500/50
               bg-amber-500/5 p-3 text-sm text-amber-600 dark:text-amber-400`}
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

      {/* Section 3: Discovery Mode Tabs */}
      <TabsRoot
        defaultValue={'fast'}
        onValueChange={(value) => setDiscoveryMode(value as DiscoveryMode)}
        value={discoveryMode}
      >
        <TabsList>
          <TabsTrigger value={'fast'}>
            <Zap className={'mr-2 size-4'} />
            Fast Discovery
          </TabsTrigger>
          <TabsTrigger value={'ai'}>
            <Sparkles className={'mr-2 size-4'} />
            AI Discovery
          </TabsTrigger>
          <TabsIndicator />
        </TabsList>

        {/* Fast Discovery Panel */}
        <TabsPanel value={'fast'}>
          <div className={'flex flex-col gap-6'}>
            {/* Scope Configuration */}
            {!isDiscoveryActive && !isDiscoveryComplete && (
              <Collapsible>
                <CollapsibleTrigger
                  className={'w-full justify-between rounded-md border border-border bg-muted/30 p-3'}
                >
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

            {/* Discovery Progress */}
            {isDiscoveryActive && (
              <ErrorBoundary
                fallbackRender={(props) => <StreamingErrorFallback {...props} stepName={'Discovery Progress'} />}
                key={`progress-${errorBoundaryKey}`}
                onReset={handleErrorBoundaryReset}
              >
                <DiscoveryProgress
                  currentStep={progress.currentStep}
                  filesDiscovered={files.length}
                  isLoading={isLoading}
                  onCancel={handleCancelDiscovery}
                  percentage={progress.percentage}
                  status={status}
                />
              </ErrorBoundary>
            )}

            {/* Discovery Results */}
            {isDiscoveryComplete && (
              <section className={'flex flex-col gap-3'}>
                <ErrorBoundary
                  fallbackRender={(props) => <StreamingErrorFallback {...props} stepName={'Discovery Results'} />}
                  key={`results-${errorBoundaryKey}`}
                  onReset={handleErrorBoundaryReset}
                >
                  <DiscoveryResults
                    discoveredFiles={files}
                    onAddFile={addFile}
                    onRemoveFile={removeFile}
                    onUpdateFile={handleUpdateFile}
                    projectId={projectId}
                    repositories={repositoryOptions}
                  />
                </ErrorBoundary>

                {/* Auto-Save Status */}
                <div className={'flex items-center justify-end'}>
                  <AutoSaveStatus isSaving={isLoading} lastSavedAt={lastSavedAt} />
                </div>
              </section>
            )}

            {/* Action Buttons */}
            {isDiscoveryIdle && (
              <div className={'flex items-center gap-3'}>
                <Button
                  disabled={!canStartDiscovery || isConfigLoading}
                  onClick={handleStartDiscovery}
                  size={'default'}
                >
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
        </TabsPanel>

        {/* AI Discovery Panel */}
        <TabsPanel value={'ai'}>
          <AiDiscoveryPanel
            clarificationContext={clarificationContext ?? undefined}
            estimatedTokens={aiEstimatedTokens}
            featureDescription={featureRequest.rawRequest ?? ''}
            featureRequestId={featureRequest.id}
            fileTree={aiFileTree}
            isLoadingFileTree={isLoadingFileTree}
            modelConfig={aiModelConfig}
            repositoryOverviews={aiRepositoryOverviews}
          />
        </TabsPanel>
      </TabsRoot>
    </div>
  );
};
