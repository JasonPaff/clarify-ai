'use client';

import type { MutableRefObject } from 'react';

import { useCallback, useMemo, useState } from 'react';

import type { FeatureRequest } from '@/db/schema/feature-requests.schema';
import type { FullModelId } from '@/lib/ai/models';

import { ClarificationPanel } from '@/components/features/clarification/clarification-panel';
import { ClarificationCostEstimate } from '@/components/features/clarification/cost-estimate';
import { AutoSaveStatus } from '@/components/features/workflow/auto-save-status';
import { RunHistoryDropdown } from '@/components/features/workflow/run-history-dropdown';
import { SaveErrorAlert } from '@/components/features/workflow/save-error-alert';
import { StaleWarningBanner } from '@/components/features/workflow/stale-warning-banner';
import { StepSettingsPanel } from '@/components/features/workflow/step-settings-panel';
import { useCurrentRun } from '@/hooks/queries/use-feature-request-runs';
import { useUpdateFeatureRequest } from '@/hooks/queries/use-feature-requests';
import { useStepConfig } from '@/hooks/queries/use-step-configurations';
import { useStaleSteps } from '@/hooks/use-stale-steps';

interface ClarifyStepProps {
  /** Ref to register the cancel callback for external cancellation */
  cancelCallbackRef?: MutableRefObject<(() => void) | null>;
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

  const { data: config, isLoading: isConfigLoading } = useStepConfig(featureRequest.projectId, 'refine');
  const { data: currentRun } = useCurrentRun(featureRequest.id, 'refine');
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
      <div className={'flex items-center justify-between gap-4'}>
        <StepSettingsPanel className={'flex-1'} projectId={featureRequest.projectId} step={'refine'} />

        {/* Cost Estimate and Run History */}
        <div className={'flex items-center gap-3'}>
          <ClarificationCostEstimate
            customPrompt={modelConfig?.customPrompt}
            featureRequestContent={featureRequest.rawRequest ?? ''}
            isLoading={isConfigLoading}
            modelId={modelConfig?.modelId ?? null}
            variant={'compact'}
          />
          <RunHistoryDropdown featureRequestId={featureRequest.id} onRunRestored={handleRunRestored} step={'refine'} />
        </div>
      </div>

      {/* Save Error Alert */}
      <SaveErrorAlert error={saveError} onRetry={handleSaveRetry} />

      {/* Section 2: Clarification Content */}
      <section className={'flex flex-col gap-3'}>
        <ClarificationPanel
          currentRun={currentRun ?? undefined}
          featureRequest={featureRequest}
          isConfigLoading={isConfigLoading}
          key={rerunKey}
          modelConfig={modelConfig}
          onCancelRegister={handleCancelRegister}
          onComplete={handleClarificationComplete}
        />

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
