'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { FeatureRequestRun } from '@/db/schema/feature-request-runs.schema';
import type { FeatureRequest } from '@/db/schema/feature-requests.schema';
import type { DiscoveredFileEntry } from '@/lib/validations/discovery';
import type { ImplementationPlan, PlanStatus } from '@/lib/validations/plan';
import type { PlanGenerateRequest, PlanRepositoryOverview, PlanScopeConfig, PlanStreamChunk } from '@/types/electron';

import { useCreateRun, useSetCurrentRun, useUpdateRun } from '@/hooks/queries/use-feature-request-runs';
import { useUpdateFeatureRequest } from '@/hooks/queries/use-feature-requests';
import { parseImplementationPlan, parsePlanStatus, stringifyImplementationPlan } from '@/lib/validations/plan';

import { useElectron } from './useElectron';

/** Configuration for the plan generation model */
export interface PlanModelConfig {
  customPrompt?: string;
  maxTokens?: number;
  modelId: null | string;
  temperature?: number;
  thinkingBudget?: number;
  thinkingEnabled: boolean;
}

/** Progress information during plan generation */
interface PlanProgress {
  currentStep?: string;
  percentage?: number;
}

/** Options for starting plan generation */
interface StartPlanOptions {
  clarificationContext?: string;
  discoveredFiles: Array<DiscoveredFileEntry>;
  enableThinking?: boolean;
  repositoryOverviews: Array<PlanRepositoryOverview>;
  scopeConfig?: PlanScopeConfig;
}

/** Options for the usePlan hook */
interface UsePlanOptions {
  currentRun?: FeatureRequestRun;
  featureRequest: FeatureRequest;
  modelConfig: null | PlanModelConfig;
}

/** Result returned by the usePlan hook */
interface UsePlanResult {
  cancelPlanGeneration: () => void;
  error: null | string;
  isLoading: boolean;
  isReasoningStreaming: boolean;
  plan: ImplementationPlan | null;
  progress: PlanProgress;
  reasoningText: string;
  resetPlan: () => void;
  restoreFromRun: (run: FeatureRequestRun) => Promise<void>;
  savePlanResults: () => Promise<void>;
  startPlanGeneration: (options: StartPlanOptions) => Promise<void>;
  status: PlanStatus;
  streamingText: string;
}

/**
 * Hook that manages the plan workflow for a feature request.
 * Handles streaming AI responses, implementation plan generation, and result management.
 * Model configuration is passed in from the parent component via modelConfig.
 */
export function usePlan({ currentRun, featureRequest, modelConfig }: UsePlanOptions): UsePlanResult {
  const { api, isElectron } = useElectron();
  const updateMutation = useUpdateFeatureRequest();
  const createRunMutation = useCreateRun();
  const updateRunMutation = useUpdateRun();
  const setCurrentRunMutation = useSetCurrentRun();

  // Track the feature request ID for reset detection
  const [trackedId, setTrackedId] = useState(featureRequest.id);

  // Parse initial state from feature request
  const [status, setStatus] = useState<PlanStatus>(() =>
    parsePlanStatus(featureRequest.status === 'planning' ? 'generating' : undefined)
  );
  const [plan, setPlan] = useState<ImplementationPlan | null>(() =>
    parseImplementationPlan(featureRequest.implementationPlan)
  );
  const [progress, setProgress] = useState<PlanProgress>({});
  const [streamingText, setStreamingText] = useState('');
  const [reasoningText, setReasoningText] = useState('');
  const [isReasoningStreaming, setIsReasoningStreaming] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Stream handler reference for cleanup
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Ref to store run ID for async callback access
  const runIdRef = useRef<null | number>(null);

  // Reset state when feature request changes (synchronous check during render)
  // This is the recommended React pattern for resetting state on prop changes
  if (featureRequest.id !== trackedId) {
    setTrackedId(featureRequest.id);
    setStatus(parsePlanStatus(featureRequest.status === 'planning' ? 'generating' : undefined));
    setPlan(parseImplementationPlan(featureRequest.implementationPlan));
    setProgress({});
    setStreamingText('');
    setReasoningText('');
    setIsReasoningStreaming(false);
    setError(null);
    setIsLoading(false);
  }

  // Reset run tracking ref when feature request changes
  useEffect(() => {
    runIdRef.current = null;
  }, [featureRequest.id]);

  // Track the previous current run ID to detect external changes
  const previousCurrentRunIdRef = useRef<null | number>(currentRun?.id ?? null);
  const hasMountedRef = useRef(false);

  // Effect to restore from current run when it changes externally
  // Uses queueMicrotask to defer state updates and avoid the lint warning
  useEffect(() => {
    const previousId = previousCurrentRunIdRef.current;
    const newId = currentRun?.id ?? null;

    // Update the ref for next comparison
    previousCurrentRunIdRef.current = newId;

    // Skip if no change
    if (previousId === newId) {
      return;
    }

    // Skip initial mount with no previous run, but allow null -> id transitions after mount
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      if (previousId === null) {
        return;
      }
    }

    // Skip if no current run
    if (!currentRun) {
      return;
    }

    // Skip if we're currently loading (don't interrupt an active generation)
    if (isLoading) {
      return;
    }

    // Skip if the run ID matches our internal tracking (we created this run)
    if (currentRun.id === runIdRef.current) {
      return;
    }

    // Use queueMicrotask to defer the state updates to after the current render
    queueMicrotask(() => {
      // Parse the run's outputContent
      let restoredPlan: ImplementationPlan | null = null;
      let restoredStatus: PlanStatus = 'idle';

      if (currentRun.outputContent) {
        try {
          const parsed = JSON.parse(currentRun.outputContent) as {
            plan?: ImplementationPlan;
          };

          restoredPlan = parsed.plan ?? null;

          // Determine status based on restored data
          if (restoredPlan) {
            restoredStatus = 'completed';
          }
        } catch {
          setError('Failed to restore run data');
          return;
        }
      }

      // Update local state with restored data
      setPlan(restoredPlan);
      setStatus(restoredStatus);
      setProgress({});
      setStreamingText('');
      setReasoningText('');
      setIsReasoningStreaming(false);
      setError(null);
      setIsLoading(false);
      runIdRef.current = currentRun.id;

      // Update the feature request in the database with restored plan data
      void updateMutation.mutateAsync({
        data: {
          implementationPlan: restoredPlan ? stringifyImplementationPlan(restoredPlan) : null,
        },
        id: featureRequest.id,
      });
    });
  }, [currentRun, isLoading, featureRequest.id, updateMutation]);

  // Start plan generation
  const startPlanGeneration = useCallback(
    async (options: StartPlanOptions) => {
      const { clarificationContext, discoveredFiles, enableThinking, repositoryOverviews, scopeConfig } = options;

      if (!api || !isElectron) {
        setError('Not running in Electron');
        return;
      }

      if (!modelConfig?.modelId) {
        setError('No model configured');
        return;
      }

      if (!discoveredFiles || discoveredFiles.length === 0) {
        setError('At least one discovered file is required');
        return;
      }

      if (!repositoryOverviews || repositoryOverviews.length === 0) {
        setError('At least one repository overview is required');
        return;
      }

      // Reset state for new run
      setStatus('generating');
      setProgress({ currentStep: 'Initializing...', percentage: 0 });
      setStreamingText('');
      setReasoningText('');
      setIsReasoningStreaming(false);
      setError(null);
      setIsLoading(true);
      setPlan(null);

      // Build parameters object for run record
      const parameters = JSON.stringify({
        enableThinking,
        maxTokens: modelConfig.maxTokens,
        scopeConfig,
        temperature: modelConfig.temperature,
        thinkingBudget: modelConfig.thinkingBudget,
      });

      // Create a new run record
      const createdRun = await createRunMutation.mutateAsync({
        featureRequestId: featureRequest.id,
        inputContent: featureRequest.rawRequest ?? '',
        modelId: modelConfig.modelId,
        parameters,
        promptUsed: modelConfig.customPrompt ?? null,
        startedAt: new Date().toISOString(),
        status: 'running',
        step: 'plan',
      });

      // Store run ID for async updates
      runIdRef.current = createdRun?.id ?? null;

      // Set up stream listener
      unsubscribeRef.current = api.ai.plan.onStream((chunk: PlanStreamChunk) => {
        switch (chunk.type) {
          case 'error':
            setError(chunk.content ?? 'Unknown error');
            setIsLoading(false);
            setIsReasoningStreaming(false);
            setStatus('failed');
            // Update run with error status
            if (runIdRef.current) {
              void updateRunMutation.mutateAsync({
                data: {
                  completedAt: new Date().toISOString(),
                  errorMessage: chunk.content ?? 'Unknown error',
                  status: 'failed',
                },
                id: runIdRef.current,
              });
            }
            break;

          case 'finish':
            setIsLoading(false);
            setIsReasoningStreaming(false);
            break;

          case 'plan':
            // Plan chunk received - set the implementation plan
            if (chunk.plan) {
              const planWithModel: ImplementationPlan = {
                ...chunk.plan,
                modelUsed: modelConfig.modelId ?? undefined,
              };

              setPlan(planWithModel);
              setStatus('completed');

              // Persist plan to feature request immediately
              void updateMutation.mutateAsync({
                data: {
                  implementationPlan: stringifyImplementationPlan(planWithModel),
                },
                id: featureRequest.id,
              });

              // Update run with output content and set as current
              if (runIdRef.current) {
                const outputContent = JSON.stringify({
                  plan: planWithModel,
                });

                void updateRunMutation.mutateAsync({
                  data: {
                    completedAt: new Date().toISOString(),
                    outputContent,
                    status: 'completed',
                  },
                  id: runIdRef.current,
                });

                // Set this run as the current run for the plan step
                void setCurrentRunMutation.mutateAsync({
                  featureRequestId: featureRequest.id,
                  runId: runIdRef.current,
                  step: 'plan',
                });
              }
            }
            break;

          case 'progress':
            if (chunk.progress) {
              setProgress({
                currentStep: chunk.progress.currentStep,
                percentage: chunk.progress.percentage,
              });
            }
            break;

          case 'reasoning':
            if (chunk.content) {
              setReasoningText((prev) => prev + chunk.content);
            }
            break;

          case 'reasoning_end':
            setIsReasoningStreaming(false);
            break;

          case 'reasoning_start':
            setIsReasoningStreaming(true);
            break;

          case 'result':
          case 'tool_result':
            // Tool result received - the plan chunk handler will handle the actual plan data
            // Update progress to show we're processing results
            setProgress({ currentStep: 'Processing implementation plan...', percentage: 90 });
            break;

          case 'text':
            if (chunk.content) {
              setStreamingText((prev) => prev + chunk.content);
            }
            break;

          case 'tool_call':
            // Tool call started - plan is being generated
            setProgress({ currentStep: 'Generating implementation plan structure...', percentage: 75 });
            break;
        }
      });

      // Build the generate request
      const generateRequest: PlanGenerateRequest = {
        clarificationContext,
        customPrompt: modelConfig.customPrompt,
        discoveredFiles,
        enableThinking,
        featureRequestDescription: featureRequest.rawRequest ?? '',
        featureRequestId: featureRequest.id,
        maxTokens: modelConfig.maxTokens,
        modelId: modelConfig.modelId,
        repositoryOverviews,
        scopeConfig,
        temperature: modelConfig.temperature,
        thinkingBudget: modelConfig.thinkingBudget,
      };

      // Start generation
      const result = await api.ai.plan.generate(generateRequest);

      // Clean up listener
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      if (!result.success) {
        setError(result.error ?? 'Generation failed');
        setIsLoading(false);
        setStatus('failed');
        // Update run with error status
        if (runIdRef.current) {
          void updateRunMutation.mutateAsync({
            data: {
              completedAt: new Date().toISOString(),
              errorMessage: result.error ?? 'Generation failed',
              status: 'failed',
            },
            id: runIdRef.current,
          });
        }
      }
    },
    [
      api,
      createRunMutation,
      featureRequest.id,
      featureRequest.rawRequest,
      isElectron,
      modelConfig,
      setCurrentRunMutation,
      updateMutation,
      updateRunMutation,
    ]
  );

  // Cancel ongoing generation
  const cancelPlanGeneration = useCallback(async () => {
    if (!api || !isElectron) return;

    await api.ai.plan.cancel();

    // Clean up listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    setIsLoading(false);
    setIsReasoningStreaming(false);
    setStatus('idle');
    setProgress({});

    if (runIdRef.current) {
      void updateRunMutation.mutateAsync({
        data: {
          completedAt: new Date().toISOString(),
          errorMessage: 'Generation cancelled',
          status: 'failed',
        },
        id: runIdRef.current,
      });
    }
  }, [api, isElectron, updateRunMutation]);

  // Save plan results to database
  const savePlanResults = useCallback(async () => {
    if (!plan) return;

    await updateMutation.mutateAsync({
      data: {
        implementationPlan: stringifyImplementationPlan(plan),
      },
      id: featureRequest.id,
    });

    // Update run output with final plan
    if (runIdRef.current) {
      const outputContent = JSON.stringify({
        plan,
      });

      void updateRunMutation.mutateAsync({
        data: {
          outputContent,
        },
        id: runIdRef.current,
      });
    }
  }, [plan, featureRequest.id, updateMutation, updateRunMutation]);

  // Reset plan state
  const resetPlan = useCallback(() => {
    setStatus('idle');
    setPlan(null);
    setProgress({});
    setStreamingText('');
    setReasoningText('');
    setIsReasoningStreaming(false);
    setError(null);
    setIsLoading(false);
    runIdRef.current = null;
  }, []);

  // Restore state from a previous run (public API)
  const restoreFromRun = useCallback(
    async (run: FeatureRequestRun) => {
      // Parse the run's outputContent
      let restoredPlan: ImplementationPlan | null = null;
      let restoredStatus: PlanStatus = 'idle';

      if (run.outputContent) {
        try {
          const parsed = JSON.parse(run.outputContent) as {
            plan?: ImplementationPlan;
          };

          restoredPlan = parsed.plan ?? null;

          // Determine status based on restored data
          if (restoredPlan) {
            restoredStatus = 'completed';
          }
        } catch {
          setError('Failed to restore run data');
          return;
        }
      }

      // Update local state with restored data
      setPlan(restoredPlan);
      setStatus(restoredStatus);
      setProgress({});
      setStreamingText('');
      setReasoningText('');
      setIsReasoningStreaming(false);
      setError(null);
      setIsLoading(false);
      runIdRef.current = run.id;

      // Update the feature request in the database with restored plan data
      await updateMutation.mutateAsync({
        data: {
          implementationPlan: restoredPlan ? stringifyImplementationPlan(restoredPlan) : null,
        },
        id: featureRequest.id,
      });
    },
    [featureRequest.id, updateMutation]
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return {
    cancelPlanGeneration,
    error,
    isLoading,
    isReasoningStreaming,
    plan,
    progress,
    reasoningText,
    resetPlan,
    restoreFromRun,
    savePlanResults,
    startPlanGeneration,
    status,
    streamingText,
  };
}
