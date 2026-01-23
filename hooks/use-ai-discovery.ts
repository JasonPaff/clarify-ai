'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  AiDiscoveryFileEntries,
  AiDiscoveryFileEntry,
  AiDiscoveryResult,
  AiDiscoveryStatus,
  FileTreePruneConfig,
} from '@/lib/validations/ai-discovery';
import type {
  AiDiscoveryAssistedGenerateRequest,
  AiDiscoveryAssistedRepositoryOverview,
  AiDiscoveryAssistedStreamChunk,
  AiDiscoveryAssistedToolResultData,
} from '@/types/electron';

import { useBulkAddContextFiles } from './queries/use-feature-request-context-files';
import { useElectronAiDiscovery } from './useElectron';

// ============================================================================
// Types
// ============================================================================

/** Model configuration for AI discovery */
export interface AiDiscoveryModelConfig {
  customPrompt?: string;
  enableThinking?: boolean;
  maxTokens?: number;
  modelId: string;
  temperature?: number;
  thinkingBudget?: number;
}

/** Progress information during AI discovery */
export interface AiDiscoveryProgress {
  currentStep?: string;
  percentage?: number;
}

/** Token usage information from AI response */
export interface AiDiscoveryUsage {
  inputTokens: number;
  outputTokens: number;
  reasoningTokens?: number;
  totalTokens: number;
}

/** Options for starting AI discovery */
export interface StartAiDiscoveryOptions {
  /** Optional clarification context from previous step */
  clarificationContext?: string;
  /** Feature description to analyze */
  featureDescription: string;
  /** Feature request ID for context */
  featureRequestId: number;
  /** Pruned file tree string */
  fileTree: string;
  /** Model configuration */
  modelConfig: AiDiscoveryModelConfig;
  /** Prune configuration used to build the file tree */
  pruneConfig?: FileTreePruneConfig;
  /** Repository overviews with context */
  repositoryOverviews: Array<AiDiscoveryAssistedRepositoryOverview>;
  /** Optional user hints to guide discovery */
  userHints?: string;
}

/** Return type for the useAiDiscovery hook */
export interface UseAiDiscoveryResult {
  /** Cancel ongoing AI discovery */
  cancelAiDiscovery: () => Promise<void>;
  /** Clear all state and reset to idle */
  clearResults: () => void;
  /** Current error message, if any */
  error: null | string;
  /** Discovered files from AI analysis */
  files: AiDiscoveryFileEntries;
  /** Whether discovery is currently running */
  isLoading: boolean;
  /** Whether reasoning/thinking is currently streaming */
  isReasoningStreaming: boolean;
  /** Current progress information */
  progress: AiDiscoveryProgress;
  /** Streamed reasoning/thinking text */
  reasoningText: string;
  /** Full discovery results */
  results: AiDiscoveryResult | null;
  /** Select files and add them as context files */
  selectFiles: (files: Array<AiDiscoveryFileEntry>, featureRequestId: number) => Promise<void>;
  /** Start AI discovery with the given configuration */
  startAiDiscovery: (options: StartAiDiscoveryOptions) => Promise<void>;
  /** Current status of the discovery workflow */
  status: AiDiscoveryStatus;
  /** Streamed text output from AI */
  streamingText: string;
  /** Token usage from the last discovery */
  usage: AiDiscoveryUsage | null;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook that manages the AI-assisted file discovery workflow.
 * Handles streaming AI responses, file discovery, and integration with context files.
 *
 * This is a higher-level hook that builds on useElectronAiDiscovery to provide:
 * - State management for discovery workflow
 * - Stream processing with real-time updates
 * - Integration with useBulkAddContextFiles mutation
 * - Cleanup on unmount
 */
export function useAiDiscovery(): UseAiDiscoveryResult {
  const { cancel, generate, isElectron, subscribeToStream } = useElectronAiDiscovery();
  const bulkAddContextFilesMutation = useBulkAddContextFiles();

  // State for discovery workflow
  const [status, setStatus] = useState<AiDiscoveryStatus>('idle');
  const [files, setFiles] = useState<AiDiscoveryFileEntries>([]);
  const [results, setResults] = useState<AiDiscoveryResult | null>(null);
  const [progress, setProgress] = useState<AiDiscoveryProgress>({});
  const [streamingText, setStreamingText] = useState('');
  const [reasoningText, setReasoningText] = useState('');
  const [isReasoningStreaming, setIsReasoningStreaming] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [usage, setUsage] = useState<AiDiscoveryUsage | null>(null);

  // Stream handler reference for cleanup
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Start AI discovery
  const startAiDiscovery = useCallback(
    async (options: StartAiDiscoveryOptions) => {
      const {
        clarificationContext,
        featureDescription,
        featureRequestId,
        fileTree,
        modelConfig,
        pruneConfig,
        repositoryOverviews,
        userHints,
      } = options;

      if (!isElectron) {
        setError('Not running in Electron');
        return;
      }

      if (!modelConfig.modelId) {
        setError('No model configured');
        return;
      }

      if (!featureDescription) {
        setError('Feature description is required');
        return;
      }

      if (!fileTree) {
        setError('File tree is required');
        return;
      }

      if (!repositoryOverviews || repositoryOverviews.length === 0) {
        setError('At least one repository overview is required');
        return;
      }

      // Reset state for new run
      setStatus('building_tree');
      setProgress({ currentStep: 'Initializing...', percentage: 0 });
      setStreamingText('');
      setReasoningText('');
      setIsReasoningStreaming(false);
      setError(null);
      setIsLoading(true);
      setFiles([]);
      setResults(null);
      setUsage(null);

      // Set up stream listener before generating
      unsubscribeRef.current = subscribeToStream((chunk: AiDiscoveryAssistedStreamChunk) => {
        switch (chunk.type) {
          case 'error':
            setError(chunk.content ?? 'Unknown error');
            setIsLoading(false);
            setIsReasoningStreaming(false);
            setStatus('failed');
            break;

          case 'finish':
            setIsLoading(false);
            setIsReasoningStreaming(false);
            if (chunk.usage) {
              setUsage({
                inputTokens: chunk.usage.inputTokens,
                outputTokens: chunk.usage.outputTokens,
                reasoningTokens: chunk.usage.reasoningTokens,
                totalTokens: chunk.usage.totalTokens,
              });
            }
            break;

          case 'progress':
            if (chunk.progress) {
              setProgress({
                currentStep: chunk.progress.currentStep,
                percentage: chunk.progress.percentage,
              });
              // Update status based on progress
              if (chunk.progress.percentage && chunk.progress.percentage > 20) {
                setStatus('analyzing');
              }
              if (chunk.progress.percentage && chunk.progress.percentage > 60) {
                setStatus('streaming');
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
              const toolResult = chunk.toolResult as AiDiscoveryAssistedToolResultData;

              // Build discovery results
              const discoveryResults: AiDiscoveryResult = {
                completedAt: toolResult.completedAt ?? new Date().toISOString(),
                files: toolResult.files ?? [],
                modelUsed: toolResult.modelUsed,
                reasoning: toolResult.reasoning,
                summary: toolResult.summary,
                timestamp: toolResult.timestamp ?? new Date().toISOString(),
                totalFilesAnalyzed: toolResult.totalFilesAnalyzed ?? 0,
                totalFilesDiscovered: toolResult.totalFilesDiscovered ?? toolResult.files?.length ?? 0,
              };

              setFiles(toolResult.files ?? []);
              setResults(discoveryResults);
              setStatus('completed');
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
      const generateRequest: AiDiscoveryAssistedGenerateRequest = {
        clarificationContext,
        customPrompt: modelConfig.customPrompt,
        enableThinking: modelConfig.enableThinking,
        featureDescription,
        featureRequestId,
        fileTree,
        maxTokens: modelConfig.maxTokens,
        modelId: modelConfig.modelId,
        pruneConfig,
        repositoryOverviews,
        temperature: modelConfig.temperature,
        thinkingBudget: modelConfig.thinkingBudget,
        userHints,
      };

      // Start generation
      const result = await generate(generateRequest);

      // Clean up listener after generation completes
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      if (!result.success) {
        setError(result.error ?? 'Generation failed');
        setIsLoading(false);
        setStatus('failed');
      }
    },
    [generate, isElectron, subscribeToStream]
  );

  // Cancel ongoing generation
  const cancelAiDiscovery = useCallback(async () => {
    await cancel();

    // Clean up listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    setIsLoading(false);
    setIsReasoningStreaming(false);
    setStatus('idle');
    setProgress({});
  }, [cancel]);

  // Clear all results and reset to initial state
  const clearResults = useCallback(() => {
    setStatus('idle');
    setFiles([]);
    setResults(null);
    setProgress({});
    setStreamingText('');
    setReasoningText('');
    setIsReasoningStreaming(false);
    setError(null);
    setIsLoading(false);
    setUsage(null);
  }, []);

  // Select files and add them as context files
  const selectFiles = useCallback(
    async (selectedFiles: Array<AiDiscoveryFileEntry>, featureRequestId: number) => {
      if (selectedFiles.length === 0) return;

      // Build context file data from selected files
      // Files from discovery are treated as 'repository' type
      const contextFileData = selectedFiles.map((file) => {
        // Extract display name from file path (last segment)
        const pathParts = file.path.split(/[/\\]/);
        const displayName = pathParts[pathParts.length - 1] ?? file.path;

        return {
          displayName,
          featureRequestId,
          filePath: file.path,
          fileType: 'repository' as const,
          includedInContext: true,
          // Size is unknown for discovered files, use 0 as placeholder
          sizeBytes: 0,
        };
      });

      // Use the bulk add mutation to create context files
      await bulkAddContextFilesMutation.mutateAsync(contextFileData);
    },
    [bulkAddContextFilesMutation]
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
    cancelAiDiscovery,
    clearResults,
    error,
    files,
    isLoading,
    isReasoningStreaming,
    progress,
    reasoningText,
    results,
    selectFiles,
    startAiDiscovery,
    status,
    streamingText,
    usage,
  };
}
