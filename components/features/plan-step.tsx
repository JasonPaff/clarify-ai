'use client';

import { useCallback, useMemo, useState } from 'react';

import type { FeatureRequest } from '@/db/schema/feature-requests.schema';
import type { FullModelId } from '@/lib/ai/models';
import type { PlanRepositoryOverview } from '@/types/electron';

import { PlanCostEstimate } from '@/components/features/plan/plan-cost-estimate';
import { PlanPanel } from '@/components/features/plan/plan-panel';
import { RunHistoryDropdown } from '@/components/features/workflow/run-history-dropdown';
import { StaleWarningBanner } from '@/components/features/workflow/stale-warning-banner';
import { StepSettingsPanel } from '@/components/features/workflow/step-settings-panel';
import { useFeatureRequestRepositories } from '@/hooks/queries/use-feature-request-repositories';
import { useCurrentRun } from '@/hooks/queries/use-feature-request-runs';
import { useRepositories } from '@/hooks/queries/use-repositories';
import { useRepositoryOverviewContents, useRepositoryOverviewStatuses } from '@/hooks/queries/use-repository-overviews';
import { useStepConfig } from '@/hooks/queries/use-step-configurations';
import { useStaleSteps } from '@/hooks/use-stale-steps';
import { parseDiscoveredFiles } from '@/lib/validations/discovery';

interface PlanStepProps {
  featureRequest: FeatureRequest;
  projectId: number;
}

export const PlanStep = ({ featureRequest, projectId }: PlanStepProps) => {
  const { data: config, isLoading: isConfigLoading } = useStepConfig(projectId, 'plan');
  const { data: currentRun } = useCurrentRun(featureRequest.id, 'plan');
  const { data: repositories } = useRepositories(projectId);
  const { data: featureRequestRepositories } = useFeatureRequestRepositories(featureRequest.id);

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

  // Track re-run key to force PlanPanel remount when re-running
  const [rerunKey, setRerunKey] = useState(0);

  const isPlanStale = isStale('plan');

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
      <div className={'flex items-center justify-between gap-4'}>
        <StepSettingsPanel className={'flex-1'} projectId={projectId} step={'plan'} />

        {/* Cost Estimate and Run History */}
        <div className={'flex items-center gap-3'}>
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

      {/* Section 2: Plan Content */}
      <section className={'flex flex-col gap-3'}>
        <PlanPanel
          currentRun={currentRun ?? undefined}
          featureRequest={featureRequest}
          isConfigLoading={isConfigLoading}
          modelConfig={modelConfig}
          repositoryOverviews={repositoryOverviews}
        />
      </section>
    </div>
  );
};
