'use client';

import type { ComponentPropsWithRef } from 'react';

import { Loader2, Sparkles } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import type { FileTreePruneConfig } from '@/lib/validations/ai-discovery';
import type { DiscoveryStatus } from '@/lib/validations/discovery';
import type { AiDiscoveryAssistedRepositoryOverview } from '@/types/electron';

import { StreamingErrorFallback } from '@/components/features/workflow/streaming-error-fallback';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAiDiscovery } from '@/hooks/use-ai-discovery';
import { cn } from '@/lib/utils';

import { AiDiscoveryCostWarning } from './ai-discovery-cost-warning';
import { AiDiscoveryProgress } from './ai-discovery-progress';
import { AiDiscoveryResults } from './ai-discovery-results';

/** Model configuration for AI discovery panel */
export interface AiDiscoveryPanelModelConfig {
  customPrompt?: string;
  enableThinking?: boolean;
  maxTokens?: number;
  modelId: string;
  temperature?: number;
  thinkingBudget?: number;
}

interface AiDiscoveryPanelProps extends ComponentPropsWithRef<'div'> {
  /** Clarification context from previous workflow step */
  clarificationContext?: string;
  /** Estimated tokens in the pruned file tree */
  estimatedTokens?: number;
  /** Feature description for AI analysis */
  featureDescription: string;
  /** Feature request ID for adding files to context */
  featureRequestId: number;
  /** Pruned file tree string for AI analysis */
  fileTree: string;
  /** Whether the panel is in a loading state (e.g., building file tree) */
  isLoadingFileTree?: boolean;
  /** Model configuration for AI discovery */
  modelConfig: AiDiscoveryPanelModelConfig | null;
  /** Callback when discovery completes */
  onComplete?: () => void;
  /** Callback to open scope settings */
  onOpenScopeSettings?: () => void;
  /** Prune configuration used to build the file tree */
  pruneConfig?: FileTreePruneConfig;
  /** Repository overviews with context for AI analysis */
  repositoryOverviews: Array<AiDiscoveryAssistedRepositoryOverview>;
  /** Token budget limit for cost warnings */
  tokenBudget?: number;
  /** Optional user hints to guide discovery */
  userHints?: string;
}

/**
 * Main panel component that orchestrates the AI discovery workflow.
 * Includes scope configuration display, progress tracking, and results.
 */
export const AiDiscoveryPanel = ({
  clarificationContext,
  className,
  estimatedTokens = 0,
  featureDescription,
  featureRequestId,
  fileTree,
  isLoadingFileTree = false,
  modelConfig,
  onComplete,
  onOpenScopeSettings,
  pruneConfig,
  ref,
  repositoryOverviews,
  tokenBudget = 100000,
  userHints,
  ...props
}: AiDiscoveryPanelProps) => {
  const {
    cancelAiDiscovery,
    clearResults,
    error,
    files,
    isLoading,
    progress,
    results,
    selectFiles,
    startAiDiscovery,
    status,
    usage,
  } = useAiDiscovery();

  // Track if cost warning was dismissed - store fileTree hash with dismissal
  // When fileTree changes, the dismissed state becomes invalid automatically
  const [dismissedForFileTree, setDismissedForFileTree] = useState<null | string>(null);

  // Track error boundary key for resetting after errors
  const [errorBoundaryKey, setErrorBoundaryKey] = useState(0);

  // Cost warning is dismissed only if dismissed for the current file tree
  const isCostWarningDismissed = dismissedForFileTree === fileTree;

  // Map AI discovery status to the DiscoveryStatus expected by progress component
  const mappedStatus = useMemo((): DiscoveryStatus => {
    switch (status) {
      case 'analyzing':
      case 'streaming':
        return 'analyzing';
      case 'building_tree':
        return 'scanning';
      case 'completed':
        return 'completed';
      case 'failed':
        return 'failed';
      case 'idle':
      default:
        return 'idle';
    }
  }, [status]);

  // Derived conditions for rendering
  const hasModelConfigured = modelConfig?.modelId !== undefined && modelConfig.modelId !== '';
  const isOverBudget = estimatedTokens > tokenBudget;
  const isIdle = status === 'idle';
  const isRunning = isLoading || status === 'analyzing' || status === 'streaming' || status === 'building_tree';
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';
  const hasResults = isCompleted && files.length > 0;
  const hasNoResults = isCompleted && files.length === 0;
  const hasError = Boolean(error);
  const hasRepositories = repositoryOverviews.length > 0;
  const hasFileTree = fileTree.length > 0;
  const isReady = hasModelConfigured && hasRepositories && hasFileTree && !isLoadingFileTree;

  // Can start discovery when ready and not currently running
  const canStartDiscovery = isReady && !isRunning;

  // Show cost warning only when over budget, not dismissed, and not running/completed
  const shouldShowCostWarning = isOverBudget && !isCostWarningDismissed && isIdle;

  // Additional derived conditions for complex JSX renders
  const shouldShowNoModelWarning = !hasModelConfigured && !isLoadingFileTree;
  const shouldShowNoRepositoriesWarning = hasModelConfigured && !hasRepositories && !isLoadingFileTree;
  const shouldShowNoFileTreeWarning = hasModelConfigured && hasRepositories && !hasFileTree && !isLoadingFileTree;
  const shouldShowErrorDisplay = hasError && isFailed;
  const shouldShowStartButton = isIdle && isReady && !shouldShowCostWarning;
  const shouldShowInfoFooter = isReady && isIdle && !shouldShowCostWarning;
  const hasSummary = isCompleted && Boolean(results?.summary);

  const handleStartDiscovery = useCallback(async () => {
    if (!modelConfig?.modelId) return;

    await startAiDiscovery({
      clarificationContext,
      featureDescription,
      featureRequestId,
      fileTree,
      modelConfig: {
        customPrompt: modelConfig.customPrompt,
        enableThinking: modelConfig.enableThinking,
        maxTokens: modelConfig.maxTokens,
        modelId: modelConfig.modelId,
        temperature: modelConfig.temperature,
        thinkingBudget: modelConfig.thinkingBudget,
      },
      pruneConfig,
      repositoryOverviews,
      userHints,
    });
  }, [
    clarificationContext,
    featureDescription,
    featureRequestId,
    fileTree,
    modelConfig,
    pruneConfig,
    repositoryOverviews,
    startAiDiscovery,
    userHints,
  ]);

  const handleCancelDiscovery = useCallback(async () => {
    await cancelAiDiscovery();
  }, [cancelAiDiscovery]);

  const handleResetDiscovery = useCallback(() => {
    clearResults();
  }, [clearResults]);

  const handleProceedAnyway = useCallback(() => {
    setDismissedForFileTree(fileTree);
  }, [fileTree]);

  const handleAdjustScope = useCallback(() => {
    onOpenScopeSettings?.();
  }, [onOpenScopeSettings]);

  const handleAddToContext = useCallback(
    async (selectedPaths: Array<string>) => {
      // Find the full file entries for selected paths
      const selectedFiles = files.filter((file) => selectedPaths.includes(file.path));
      if (selectedFiles.length === 0) return;

      await selectFiles(selectedFiles, featureRequestId);
      onComplete?.();
    },
    [featureRequestId, files, onComplete, selectFiles]
  );

  const handleErrorBoundaryReset = useCallback(() => {
    // Reset hook state to idle and increment key to remount error boundary
    clearResults();
    setErrorBoundaryKey((prev) => prev + 1);
  }, [clearResults]);

  // Build token usage for progress display
  const tokenUsage = useMemo(() => {
    if (!usage) return undefined;
    return {
      completionTokens: usage.outputTokens,
      promptTokens: usage.inputTokens,
      totalTokens: usage.totalTokens,
    };
  }, [usage]);

  return (
    <div className={cn('space-y-4', className)} ref={ref} {...props}>
      {/* Header Section */}
      <div className={'flex items-center gap-2'}>
        <Sparkles className={'size-5 text-accent'} />
        <div>
          <h3 className={'font-medium'}>AI File Discovery</h3>
          <p className={'text-sm text-muted-foreground'}>
            Use AI to analyze your codebase and discover relevant files for implementation.
          </p>
        </div>
      </div>

      {/* Loading File Tree State */}
      {isLoadingFileTree && (
        <div className={'flex items-center gap-2 rounded-md border border-border bg-muted/30 p-4'}>
          <Loader2 className={'size-4 animate-spin text-muted-foreground'} />
          <span className={'text-sm text-muted-foreground'}>Building file tree...</span>
        </div>
      )}

      {/* No Model Configured Warning */}
      {shouldShowNoModelWarning && (
        <Alert>
          <Sparkles className={'size-4'} />
          <AlertTitle>Model Not Configured</AlertTitle>
          <AlertDescription>
            Please configure a model in the Discovery Settings panel before starting AI discovery.
          </AlertDescription>
        </Alert>
      )}

      {/* No Repositories Warning */}
      {shouldShowNoRepositoriesWarning && (
        <Alert variant={'warning'}>
          <Sparkles className={'size-4'} />
          <AlertTitle>No Repositories Available</AlertTitle>
          <AlertDescription>
            Link at least one repository to your project to enable AI file discovery.
          </AlertDescription>
        </Alert>
      )}

      {/* No File Tree Warning */}
      {shouldShowNoFileTreeWarning && (
        <Alert variant={'warning'}>
          <Sparkles className={'size-4'} />
          <AlertTitle>File Tree Empty</AlertTitle>
          <AlertDescription>
            The file tree is empty. Try adjusting your scope settings to include more files.
          </AlertDescription>
        </Alert>
      )}

      {/* Cost Warning */}
      {shouldShowCostWarning && (
        <AiDiscoveryCostWarning
          budgetLimit={tokenBudget}
          estimatedTokens={estimatedTokens}
          onAdjustScope={handleAdjustScope}
          onProceedAnyway={handleProceedAnyway}
        />
      )}

      {/* Error Display */}
      {shouldShowErrorDisplay && (
        <Alert variant={'destructive'}>
          <Sparkles className={'size-4'} />
          <AlertTitle>Discovery Failed</AlertTitle>
          <AlertDescription className={'space-y-2'}>
            <p>{error}</p>
            <Button onClick={handleResetDiscovery} size={'sm'} variant={'outline'}>
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* AI Operations Section - Wrapped in Error Boundary */}
      <ErrorBoundary
        fallbackRender={(props) => <StreamingErrorFallback {...props} stepName={'AI Discovery'} />}
        key={errorBoundaryKey}
        onReset={handleErrorBoundaryReset}
      >
        {/* Progress Display - Show when running */}
        {isRunning && (
          <AiDiscoveryProgress
            currentStep={progress.currentStep}
            errorMessage={error ?? undefined}
            filesDiscovered={files.length}
            isLoading={isLoading}
            modelName={modelConfig?.modelId}
            onCancel={handleCancelDiscovery}
            percentage={progress.percentage}
            status={mappedStatus}
            tokenUsage={tokenUsage}
          />
        )}

        {/* Results Display - Show when completed with results */}
        {hasResults && (
          <AiDiscoveryResults discoveredFiles={files} onAddToContext={handleAddToContext} />
        )}

        {/* Completed with No Results */}
        {hasNoResults && (
          <Alert>
            <Sparkles className={'size-4'} />
            <AlertTitle>No Files Discovered</AlertTitle>
            <AlertDescription className={'space-y-2'}>
              <p>AI analysis did not identify any relevant files for this feature request.</p>
              <div className={'flex gap-2'}>
                <Button onClick={handleResetDiscovery} size={'sm'} variant={'outline'}>
                  Try Again
                </Button>
                {onOpenScopeSettings && (
                  <Button onClick={handleAdjustScope} size={'sm'} variant={'outline'}>
                    Adjust Scope
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Summary from Results */}
        {hasSummary && (
          <div className={'rounded-md border border-border bg-muted/30 p-3'}>
            <p className={'text-sm font-medium text-foreground'}>Discovery Summary</p>
            <p className={'mt-1 text-sm text-muted-foreground'}>{results?.summary}</p>
          </div>
        )}
      </ErrorBoundary>

      {/* Action Buttons - Show when idle and ready */}
      {shouldShowStartButton && (
        <div className={'flex items-center gap-2'}>
          <Button disabled={!canStartDiscovery} onClick={handleStartDiscovery}>
            <Sparkles className={'mr-2 size-4'} />
            Start AI Discovery
          </Button>
        </div>
      )}

      {/* Completed State Actions */}
      {isCompleted && (
        <div className={'flex items-center gap-2'}>
          <Button onClick={handleResetDiscovery} variant={'outline'}>
            Run Again
          </Button>
        </div>
      )}

      {/* Repository and Token Info */}
      {shouldShowInfoFooter && (
        <div className={'text-xs text-muted-foreground'}>
          {repositoryOverviews.length} {repositoryOverviews.length === 1 ? 'repository' : 'repositories'} /{' '}
          {estimatedTokens.toLocaleString()} estimated tokens
        </div>
      )}
    </div>
  );
};
