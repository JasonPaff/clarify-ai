'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { FeatureRequestRun } from '@/db/schema/feature-request-runs.schema';
import type { FeatureRequest } from '@/db/schema/feature-requests.schema';
import type {
  DiscoveredFileEntry,
  DiscoveryResults,
  DiscoveryScopeConfig,
  DiscoveryStatus,
} from '@/lib/validations/discovery';
import type { DiscoveryGenerateRequest, DiscoveryRepositoryOverview, DiscoveryStreamChunk } from '@/types/electron';

import { useCreateRun, useSetCurrentRun, useUpdateRun } from '@/hooks/queries/use-feature-request-runs';
import { useUpdateFeatureRequest } from '@/hooks/queries/use-feature-requests';
import {
  parseDiscoveredFiles,
  parseDiscoveryResults,
  parseDiscoveryStatus,
  stringifyDiscoveryResults,
} from '@/lib/validations/discovery';

import { useElectron } from './useElectron';

export interface DiscoveryModelConfig {
  customPrompt?: string;
  maxTokens?: number;
  modelId: null | string;
  temperature?: number;
  thinkingBudget?: number;
  thinkingEnabled: boolean;
}

interface DiscoveryProgress {
  currentStep?: string;
  percentage?: number;
}

/** Discovery tool result structure (matches the IPC handler output) */
interface DiscoveryToolResultData {
  additionalNotes?: string;
  completedAt: string;
  confidence: number;
  files: Array<DiscoveredFileEntry>;
  filesDiscovered: number;
  missingFiles: Array<string>;
  reasoning: string;
  suggestedNewFiles: Array<{ path: string; purpose: string }>;
  summary: string;
}

interface StartDiscoveryOptions {
  clarificationContext?: string;
  enableThinking?: boolean;
  repositoryOverviews: Array<DiscoveryRepositoryOverview>;
  scopeConfig?: DiscoveryScopeConfig;
}

interface UseDiscoveryOptions {
  currentRun?: FeatureRequestRun;
  featureRequest: FeatureRequest;
  modelConfig: DiscoveryModelConfig | null;
}

interface UseDiscoveryResult {
  addFile: (file: DiscoveredFileEntry) => void;
  cancelDiscovery: () => void;
  error: null | string;
  files: Array<DiscoveredFileEntry>;
  isLoading: boolean;
  isReasoningStreaming: boolean;
  progress: DiscoveryProgress;
  reasoningText: string;
  removeFile: (filePath: string) => void;
  resetDiscovery: () => void;
  restoreFromRun: (run: FeatureRequestRun) => Promise<void>;
  results: DiscoveryResults | null;
  saveDiscoveryResults: () => Promise<void>;
  startDiscovery: (options: StartDiscoveryOptions) => Promise<void>;
  status: DiscoveryStatus;
  streamingText: string;
  updateFile: (filePath: string, updates: Partial<DiscoveredFileEntry>) => void;
}

/**
 * Hook that manages the discovery workflow for a feature request.
 * Handles streaming AI responses, file discovery, and result management.
 * Model configuration is passed in from the parent component via modelConfig.
 */
export function useDiscovery({ currentRun, featureRequest, modelConfig }: UseDiscoveryOptions): UseDiscoveryResult {
  const { api, isElectron } = useElectron();
  const updateMutation = useUpdateFeatureRequest();
  const createRunMutation = useCreateRun();
  const updateRunMutation = useUpdateRun();
  const setCurrentRunMutation = useSetCurrentRun();

  // Track the feature request ID for reset detection
  const [trackedId, setTrackedId] = useState(featureRequest.id);

  // Parse initial state from feature request
  const [status, setStatus] = useState<DiscoveryStatus>(() =>
    parseDiscoveryStatus(featureRequest.status === 'researching' ? 'scanning' : undefined)
  );
  const [files, setFiles] = useState<Array<DiscoveredFileEntry>>(() =>
    parseDiscoveredFiles(featureRequest.researchFindings)
  );
  const [results, setResults] = useState<DiscoveryResults | null>(() =>
    parseDiscoveryResults(featureRequest.researchFindings)
  );
  const [progress, setProgress] = useState<DiscoveryProgress>({});
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
    setStatus(parseDiscoveryStatus(featureRequest.status === 'researching' ? 'scanning' : undefined));
    setFiles(parseDiscoveredFiles(featureRequest.researchFindings));
    setResults(parseDiscoveryResults(featureRequest.researchFindings));
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
      let restoredFiles: Array<DiscoveredFileEntry> = [];
      let restoredResults: DiscoveryResults | null = null;
      let restoredStatus: DiscoveryStatus = 'idle';

      if (currentRun.outputContent) {
        try {
          const parsed = JSON.parse(currentRun.outputContent) as {
            files?: Array<DiscoveredFileEntry>;
            results?: DiscoveryResults;
          };

          restoredFiles = parsed.files ?? parsed.results?.files ?? [];
          restoredResults = parsed.results ?? null;

          // Determine status based on restored data
          if (restoredFiles.length > 0) {
            restoredStatus = 'completed';
          }
        } catch {
          setError('Failed to restore run data');
          return;
        }
      }

      // Update local state with restored data
      setFiles(restoredFiles);
      setResults(restoredResults);
      setStatus(restoredStatus);
      setProgress({});
      setStreamingText('');
      setReasoningText('');
      setIsReasoningStreaming(false);
      setError(null);
      setIsLoading(false);
      runIdRef.current = currentRun.id;

      // Update the feature request in the database with restored discovery data
      void updateMutation.mutateAsync({
        data: {
          researchFindings: restoredResults ? stringifyDiscoveryResults(restoredResults) : null,
        },
        id: featureRequest.id,
      });
    });
  }, [currentRun, isLoading, featureRequest.id, updateMutation]);

  // Start discovery generation
  const startDiscovery = useCallback(
    async (options: StartDiscoveryOptions) => {
      const { clarificationContext, enableThinking, repositoryOverviews, scopeConfig } = options;

      if (!api || !isElectron) {
        setError('Not running in Electron');
        return;
      }

      if (!modelConfig?.modelId) {
        setError('No model configured');
        return;
      }

      if (!repositoryOverviews || repositoryOverviews.length === 0) {
        setError('At least one repository overview is required');
        return;
      }

      // Reset state for new run
      setStatus('scanning');
      setProgress({ currentStep: 'Initializing...', percentage: 0 });
      setStreamingText('');
      setReasoningText('');
      setIsReasoningStreaming(false);
      setError(null);
      setIsLoading(true);
      setFiles([]);
      setResults(null);

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
        step: 'research',
      });

      // Store run ID for async updates
      runIdRef.current = createdRun?.id ?? null;

      // Set up stream listener
      unsubscribeRef.current = api.ai.discovery.onStream((chunk: DiscoveryStreamChunk) => {
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

          case 'progress':
            if (chunk.progress) {
              setProgress({
                currentStep: chunk.progress.currentStep,
                percentage: chunk.progress.percentage,
              });
              // Update status based on progress
              if (chunk.progress.percentage && chunk.progress.percentage > 30) {
                setStatus('analyzing');
              }
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
            // Tool result received - parse and set discovered files
            if (chunk.toolResult && typeof chunk.toolResult === 'object') {
              const toolResult = chunk.toolResult as DiscoveryToolResultData;

              // Build discovery results
              const discoveryResults: DiscoveryResults = {
                files: toolResult.files ?? [],
                modelUsed: modelConfig.modelId ?? undefined,
                summary: toolResult.summary,
                timestamp: toolResult.completedAt ?? new Date().toISOString(),
                totalFiles: toolResult.filesDiscovered ?? toolResult.files?.length ?? 0,
              };

              setFiles(toolResult.files ?? []);
              setResults(discoveryResults);
              setStatus('completed');

              // Persist results to feature request immediately
              void updateMutation.mutateAsync({
                data: {
                  researchFindings: stringifyDiscoveryResults(discoveryResults),
                },
                id: featureRequest.id,
              });

              // Update run with output content and set as current
              if (runIdRef.current) {
                const outputContent = JSON.stringify({
                  files: toolResult.files,
                  results: discoveryResults,
                });

                void updateRunMutation.mutateAsync({
                  data: {
                    completedAt: new Date().toISOString(),
                    outputContent,
                    status: 'completed',
                  },
                  id: runIdRef.current,
                });

                // Set this run as the current run for the discover step
                void setCurrentRunMutation.mutateAsync({
                  featureRequestId: featureRequest.id,
                  runId: runIdRef.current,
                  step: 'research',
                });
              }
            }
            break;

          case 'text':
            if (chunk.content) {
              setStreamingText((prev) => prev + chunk.content);
            }
            break;

          case 'tool_call':
            // Tool call started - files are being discovered
            setProgress({ currentStep: 'Compiling discovered files...', percentage: 75 });
            break;
        }
      });

      // Build the generate request
      const generateRequest: DiscoveryGenerateRequest = {
        clarificationContext,
        customPrompt: modelConfig.customPrompt,
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
      const result = await api.ai.discovery.generate(generateRequest);

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
  const cancelDiscovery = useCallback(async () => {
    if (!api || !isElectron) return;

    await api.ai.discovery.cancel();

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

  // Save discovery results to database
  const saveDiscoveryResults = useCallback(async () => {
    if (!results) return;

    await updateMutation.mutateAsync({
      data: {
        researchFindings: stringifyDiscoveryResults(results),
      },
      id: featureRequest.id,
    });

    // Update run output with final file list
    if (runIdRef.current) {
      const outputContent = JSON.stringify({
        files,
        results,
      });

      void updateRunMutation.mutateAsync({
        data: {
          outputContent,
        },
        id: runIdRef.current,
      });
    }
  }, [files, results, featureRequest.id, updateMutation, updateRunMutation]);

  // Reset discovery state
  const resetDiscovery = useCallback(() => {
    setStatus('idle');
    setFiles([]);
    setResults(null);
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
      let restoredFiles: Array<DiscoveredFileEntry> = [];
      let restoredResults: DiscoveryResults | null = null;
      let restoredStatus: DiscoveryStatus = 'idle';

      if (run.outputContent) {
        try {
          const parsed = JSON.parse(run.outputContent) as {
            files?: Array<DiscoveredFileEntry>;
            results?: DiscoveryResults;
          };

          restoredFiles = parsed.files ?? parsed.results?.files ?? [];
          restoredResults = parsed.results ?? null;

          // Determine status based on restored data
          if (restoredFiles.length > 0) {
            restoredStatus = 'completed';
          }
        } catch {
          setError('Failed to restore run data');
          return;
        }
      }

      // Update local state with restored data
      setFiles(restoredFiles);
      setResults(restoredResults);
      setStatus(restoredStatus);
      setProgress({});
      setStreamingText('');
      setReasoningText('');
      setIsReasoningStreaming(false);
      setError(null);
      setIsLoading(false);
      runIdRef.current = run.id;

      // Update the feature request in the database with restored discovery data
      await updateMutation.mutateAsync({
        data: {
          researchFindings: restoredResults ? stringifyDiscoveryResults(restoredResults) : null,
        },
        id: featureRequest.id,
      });
    },
    [featureRequest.id, updateMutation]
  );

  // File editing operations
  const updateFile = useCallback((filePath: string, updates: Partial<DiscoveredFileEntry>) => {
    setFiles((prev) => prev.map((file) => (file.path === filePath ? { ...file, ...updates, isEdited: true } : file)));
    // Also update results if present
    setResults((prev) =>
      prev
        ? {
            ...prev,
            files: prev.files.map((file) => (file.path === filePath ? { ...file, ...updates, isEdited: true } : file)),
          }
        : null
    );
  }, []);

  const removeFile = useCallback((filePath: string) => {
    setFiles((prev) => prev.filter((file) => file.path !== filePath));
    // Also update results if present
    setResults((prev) =>
      prev
        ? {
            ...prev,
            files: prev.files.filter((file) => file.path !== filePath),
            totalFiles: prev.totalFiles - 1,
          }
        : null
    );
  }, []);

  const addFile = useCallback((file: DiscoveredFileEntry) => {
    const newFile: DiscoveredFileEntry = {
      ...file,
      isManuallyAdded: true,
    };
    setFiles((prev) => [...prev, newFile]);
    // Also update results if present
    setResults((prev) =>
      prev
        ? {
            ...prev,
            files: [...prev.files, newFile],
            totalFiles: prev.totalFiles + 1,
          }
        : null
    );
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return {
    addFile,
    cancelDiscovery,
    error,
    files,
    isLoading,
    isReasoningStreaming,
    progress,
    reasoningText,
    removeFile,
    resetDiscovery,
    restoreFromRun,
    results,
    saveDiscoveryResults,
    startDiscovery,
    status,
    streamingText,
    updateFile,
  };
}
