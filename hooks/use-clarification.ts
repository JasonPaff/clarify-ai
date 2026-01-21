'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { ClarificationModelConfig } from '@/components/features/clarification/clarification-panel';
import type { FeatureRequestRun } from '@/db/schema/feature-request-runs.schema';
import type { FeatureRequest } from '@/db/schema/feature-requests.schema';
import type {
  ClarificationAnalysis,
  ClarificationAnswer,
  ClarificationQuestion,
  ClarificationStatus,
} from '@/lib/validations/clarification';
import type { ClarificationStreamChunk } from '@/types/electron';

import { useCreateRun, useSetCurrentRun, useUpdateRun } from '@/hooks/queries/use-feature-request-runs';
import { useUpdateFeatureRequest } from '@/hooks/queries/use-feature-requests';
import {
  parseClarificationAnalysis,
  parseClarificationAnswers,
  parseClarificationQuestions,
  parseClarificationStatus,
  stringifyClarificationAnalysis,
  stringifyClarificationAnswers,
  stringifyClarificationQuestions,
} from '@/lib/validations/clarification';

import { useElectron } from './useElectron';

interface StartClarificationOptions {
  enableThinking?: boolean;
  forceQuestions?: boolean;
}

interface UseClarificationOptions {
  currentRun?: FeatureRequestRun;
  featureRequest: FeatureRequest;
  modelConfig: ClarificationModelConfig | null;
}

interface UseClarificationResult {
  analysis: ClarificationAnalysis | null;
  answers: Array<ClarificationAnswer>;
  cancelClarification: () => void;
  error: null | string;
  isLoading: boolean;
  isQuestionsComplete: boolean;
  isReasoningStreaming: boolean;
  questions: Array<ClarificationQuestion>;
  reasoningText: string;
  requestMoreClarification: (enableThinking?: boolean) => Promise<void>;
  resetClarification: () => void;
  restoreFromRun: (run: FeatureRequestRun) => Promise<void>;
  saveAnswers: () => Promise<void>;
  setAnswer: (questionId: string, selectedValue: null | string, customText?: string) => void;
  skipClarification: () => Promise<void>;
  startClarification: (options?: StartClarificationOptions) => Promise<void>;
  status: ClarificationStatus;
  streamingText: string;
}

/**
 * Hook that manages the clarification workflow for a feature request.
 * Handles streaming AI responses, question generation, and answer management.
 * Model configuration is now passed in from the parent component via modelConfig.
 */
export function useClarification({
  currentRun,
  featureRequest,
  modelConfig,
}: UseClarificationOptions): UseClarificationResult {
  const { api, isElectron } = useElectron();
  const updateMutation = useUpdateFeatureRequest();
  const createRunMutation = useCreateRun();
  const updateRunMutation = useUpdateRun();
  const setCurrentRunMutation = useSetCurrentRun();

  // Track the feature request ID for reset detection
  const [trackedId, setTrackedId] = useState(featureRequest.id);

  // Parse initial state from feature request
  const [status, setStatus] = useState<ClarificationStatus>(() =>
    parseClarificationStatus(featureRequest.clarificationStatus)
  );
  const [analysis, setAnalysis] = useState<ClarificationAnalysis | null>(() =>
    parseClarificationAnalysis(featureRequest.clarificationAnalysis)
  );
  const [questions, setQuestions] = useState<Array<ClarificationQuestion>>(() =>
    parseClarificationQuestions(featureRequest.clarificationQuestions)
  );
  const [answers, setAnswers] = useState<Array<ClarificationAnswer>>(() =>
    parseClarificationAnswers(featureRequest.clarificationAnswers)
  );
  const [streamingText, setStreamingText] = useState('');
  const [reasoningText, setReasoningText] = useState('');
  const [isReasoningStreaming, setIsReasoningStreaming] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isQuestionsComplete, setIsQuestionsComplete] = useState(true);

  // Stream handler reference for cleanup
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Ref to store run ID for async callback access
  const runIdRef = useRef<null | number>(null);

  // Reset state when feature request changes (synchronous check during render)
  // This is the recommended React pattern for resetting state on prop changes
  if (featureRequest.id !== trackedId) {
    setTrackedId(featureRequest.id);
    setStatus(parseClarificationStatus(featureRequest.clarificationStatus));
    setAnalysis(parseClarificationAnalysis(featureRequest.clarificationAnalysis));
    setQuestions(parseClarificationQuestions(featureRequest.clarificationQuestions));
    setAnswers(parseClarificationAnswers(featureRequest.clarificationAnswers));
    setStreamingText('');
    setReasoningText('');
    setIsReasoningStreaming(false);
    setError(null);
    setIsLoading(false);
    setIsQuestionsComplete(true);
  }

  // Reset run tracking ref when feature request changes
  useEffect(() => {
    runIdRef.current = null;
  }, [featureRequest.id]);

  // Track the previous current run ID to detect external changes
  const previousCurrentRunIdRef = useRef<null | number>(currentRun?.id ?? null);

  // Effect to restore from current run when it changes externally
  // Uses queueMicrotask to defer state updates and avoid the lint warning
  useEffect(() => {
    const previousId = previousCurrentRunIdRef.current;
    const newId = currentRun?.id ?? null;

    // Update the ref for next comparison
    previousCurrentRunIdRef.current = newId;

    // Skip if no change or if this is the initial mount with no previous run
    if (previousId === newId || previousId === null) {
      return;
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
      let restoredAnalysis: ClarificationAnalysis | null = null;
      let restoredQuestions: Array<ClarificationQuestion> = [];
      let restoredAnswers: Array<ClarificationAnswer> = [];
      let restoredStatus: ClarificationStatus = 'idle';

      if (currentRun.outputContent) {
        try {
          const parsed = JSON.parse(currentRun.outputContent) as {
            analysis?: ClarificationAnalysis;
            answers?: Array<ClarificationAnswer>;
            questions?: Array<ClarificationQuestion>;
          };

          restoredAnalysis = parsed.analysis ?? null;
          restoredQuestions = parsed.questions ?? [];
          restoredAnswers = parsed.answers ?? [];

          // Determine status based on restored data
          if (restoredAnswers.length > 0 && restoredQuestions.length > 0) {
            restoredStatus = 'completed';
          } else if (restoredQuestions.length > 0) {
            restoredStatus = 'questions_ready';
          } else if (restoredAnalysis && restoredAnalysis.detailScore >= 4) {
            restoredStatus = 'skipped';
          }
        } catch {
          setError('Failed to restore run data');
          return;
        }
      }

      // Update local state with restored data
      setAnalysis(restoredAnalysis);
      setQuestions(restoredQuestions);
      setAnswers(restoredAnswers);
      setStatus(restoredStatus);
      setStreamingText('');
      setReasoningText('');
      setIsReasoningStreaming(false);
      setError(null);
      setIsLoading(false);
      runIdRef.current = currentRun.id;

      // Update the feature request in the database with restored clarification data
      void updateMutation.mutateAsync({
        data: {
          clarificationAnalysis: restoredAnalysis ? stringifyClarificationAnalysis(restoredAnalysis) : null,
          clarificationAnswers: restoredAnswers.length > 0 ? stringifyClarificationAnswers(restoredAnswers) : null,
          clarificationQuestions:
            restoredQuestions.length > 0 ? stringifyClarificationQuestions(restoredQuestions) : null,
          clarificationStatus: restoredStatus,
        },
        id: featureRequest.id,
      });
    });
  }, [currentRun, isLoading, featureRequest.id, updateMutation]);

  // Start clarification generation
  const startClarification = useCallback(
    async (options?: StartClarificationOptions) => {
      const { enableThinking, forceQuestions = false } = options ?? {};

      if (!api || !isElectron) {
        setError('Not running in Electron');
        return;
      }

      if (!modelConfig?.modelId) {
        setError('No model configured');
        return;
      }

      // Reset state for new run
      setStatus('analyzing');
      setStreamingText('');
      setReasoningText('');
      setIsReasoningStreaming(false);
      setError(null);
      setIsLoading(true);
      setIsQuestionsComplete(false);
      setQuestions([]);
      setAnalysis(null);

      // Build parameters object for run record
      const parameters = JSON.stringify({
        enableThinking,
        forceQuestions,
        maxTokens: modelConfig.maxTokens,
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
        step: 'refine',
      });

      // Store run ID for async updates
      runIdRef.current = createdRun?.id ?? null;

      // Set up stream listener
      unsubscribeRef.current = api.ai.clarification.onStream((chunk: ClarificationStreamChunk) => {
        switch (chunk.type) {
          case 'error':
            setError(chunk.content ?? 'Unknown error');
            setIsLoading(false);
            setIsReasoningStreaming(false);
            setStatus('idle');
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

          case 'text':
            if (chunk.content) {
              setStreamingText((prev) => prev + chunk.content);
            }
            break;

          case 'tool_call':
            // Tool call started - questions are being generated
            break;

          case 'tool_result':
            // Tool result received - parse and set questions
            // Mark questions as complete since we have received the full set
            setIsQuestionsComplete(true);

            if (chunk.toolResult && typeof chunk.toolResult === 'object') {
              const result = chunk.toolResult as {
                affectedAreas?: Array<string>;
                ambiguities?: Array<string>;
                completedAt?: string;
                detailScore?: number;
                questions?: Array<ClarificationQuestion>;
                reasoning?: string;
                summary?: string;
              };

              // Set analysis
              const newAnalysis: ClarificationAnalysis = {
                affectedAreas: result.affectedAreas,
                ambiguities: result.ambiguities,
                completedAt: result.completedAt,
                detailScore: result.detailScore ?? 3,
                reasoning: result.reasoning,
                summary: result.summary ?? '',
              };
              setAnalysis(newAnalysis);

              // Set questions - always show questions_ready if forceQuestions is true
              if (result.questions && result.questions.length > 0) {
                setQuestions(result.questions);
                setStatus('questions_ready');
              } else if (!forceQuestions && result.detailScore && result.detailScore >= 4) {
                // No questions needed - request is detailed enough (only if not forcing)
                setStatus('skipped');
              } else {
                setStatus('questions_ready');
              }

              // Update run with output content and set as current
              if (runIdRef.current) {
                const outputContent = JSON.stringify({
                  analysis: newAnalysis,
                  questions: result.questions ?? [],
                });

                void updateRunMutation.mutateAsync({
                  data: {
                    completedAt: new Date().toISOString(),
                    outputContent,
                    status: 'completed',
                  },
                  id: runIdRef.current,
                });

                // Set this run as the current run for the refine step
                void setCurrentRunMutation.mutateAsync({
                  featureRequestId: featureRequest.id,
                  runId: runIdRef.current,
                  step: 'refine',
                });
              }
            }
            break;
        }
      });

      // Build the custom prompt with force questions instruction if needed
      let customPrompt = modelConfig.customPrompt ?? '';
      if (forceQuestions) {
        const forceQuestionsPrompt = `
IMPORTANT: The user has explicitly requested clarification questions even though the request may appear detailed enough.
You MUST generate at least 2-3 clarifying questions regardless of the detail score.
Focus on uncovering edge cases, implementation preferences, or potential ambiguities that could affect development.
`;
        customPrompt = forceQuestionsPrompt + customPrompt;
      }

      // Start generation with config from step settings
      const result = await api.ai.clarification.generate({
        customPrompt,
        enableThinking,
        featureRequest: featureRequest.rawRequest ?? '',
        featureRequestId: featureRequest.id,
        maxTokens: modelConfig.maxTokens,
        modelId: modelConfig.modelId,
        temperature: modelConfig.temperature,
        thinkingBudget: modelConfig.thinkingBudget,
      });

      // Clean up listener
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      if (!result.success) {
        setError(result.error ?? 'Generation failed');
        setIsLoading(false);
        setStatus('idle');
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
      updateRunMutation,
    ]
  );

  // Request more clarification with previous Q&A context
  const requestMoreClarification = useCallback(
    async (enableThinking?: boolean) => {
      if (!api || !isElectron) {
        setError('Not running in Electron');
        return;
      }

      if (!modelConfig?.modelId) {
        setError('No model configured');
        return;
      }

      // Build context from previous Q&A
      const previousQAContext = questions
        .map((q) => {
          const answer = answers.find((a) => a.questionId === q.id);
          const answerText = answer?.customText ?? answer?.selectedValue ?? 'Not answered';
          return `Q: ${q.question}\nA: ${answerText}`;
        })
        .join('\n\n');

      // Store existing questions for appending new ones
      const existingQuestions = [...questions];

      // Reset streaming state but preserve status
      setStreamingText('');
      setReasoningText('');
      setIsReasoningStreaming(false);
      setError(null);
      setIsLoading(true);
      setIsQuestionsComplete(false);
      setStatus('analyzing');

      // Set up stream listener
      unsubscribeRef.current = api.ai.clarification.onStream((chunk: ClarificationStreamChunk) => {
        switch (chunk.type) {
          case 'error':
            setError(chunk.content ?? 'Unknown error');
            setIsLoading(false);
            setIsReasoningStreaming(false);
            setIsQuestionsComplete(true);
            setStatus('questions_ready');
            // Restore existing questions on error
            setQuestions(existingQuestions);
            break;

          case 'finish':
            setIsLoading(false);
            setIsReasoningStreaming(false);
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

          case 'text':
            if (chunk.content) {
              setStreamingText((prev) => prev + chunk.content);
            }
            break;

          case 'tool_call':
            // Tool call started - additional questions are being generated
            break;

          case 'tool_result':
            // Tool result received - parse and append new questions
            // Mark questions as complete since we have received the full set
            setIsQuestionsComplete(true);

            if (chunk.toolResult && typeof chunk.toolResult === 'object') {
              const result = chunk.toolResult as {
                affectedAreas?: Array<string>;
                ambiguities?: Array<string>;
                completedAt?: string;
                detailScore?: number;
                questions?: Array<ClarificationQuestion>;
                reasoning?: string;
                summary?: string;
              };

              // Update analysis if provided
              let updatedAnalysis = analysis;
              if (result.summary || result.reasoning) {
                updatedAnalysis = {
                  affectedAreas: result.affectedAreas ?? analysis?.affectedAreas,
                  ambiguities: result.ambiguities ?? analysis?.ambiguities,
                  completedAt: result.completedAt,
                  detailScore: result.detailScore ?? analysis?.detailScore ?? 3,
                  reasoning: result.reasoning ?? analysis?.reasoning,
                  summary: result.summary ?? analysis?.summary ?? '',
                };
                setAnalysis(updatedAnalysis);
              }

              // Append new questions to existing ones
              const allQuestions =
                result.questions && result.questions.length > 0
                  ? [...existingQuestions, ...result.questions]
                  : existingQuestions;
              if (result.questions && result.questions.length > 0) {
                setQuestions(allQuestions);
              }
              setStatus('questions_ready');

              // Update run with combined output content
              if (runIdRef.current) {
                const outputContent = JSON.stringify({
                  analysis: updatedAnalysis,
                  questions: allQuestions,
                });

                void updateRunMutation.mutateAsync({
                  data: {
                    outputContent,
                  },
                  id: runIdRef.current,
                });
              }
            }
            break;
        }
      });

      // Build additional context prompt explaining this is a follow-up request
      const additionalContextPrompt = `
This is a follow-up clarification request. The user has already answered the initial questions and wants more detailed clarification.

Previous Questions and Answers:
${previousQAContext}

Please generate additional clarifying questions that:
1. Go deeper into areas that may still be ambiguous
2. Don't repeat questions that were already asked
3. Build upon the answers provided to uncover more specific requirements
`;

      // Start generation with context from step settings
      const result = await api.ai.clarification.generate({
        customPrompt: additionalContextPrompt + (modelConfig.customPrompt ?? ''),
        enableThinking,
        featureRequest: featureRequest.rawRequest ?? '',
        featureRequestId: featureRequest.id,
        maxTokens: modelConfig.maxTokens,
        modelId: modelConfig.modelId,
        temperature: modelConfig.temperature,
        thinkingBudget: modelConfig.thinkingBudget,
      });

      // Clean up listener
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      if (!result.success) {
        setError(result.error ?? 'Generation failed');
        setIsLoading(false);
        setStatus('questions_ready');
        // Restore existing questions on failure
        setQuestions(existingQuestions);
      }
    },
    [
      analysis,
      answers,
      api,
      featureRequest.id,
      featureRequest.rawRequest,
      isElectron,
      modelConfig,
      questions,
      updateRunMutation,
    ]
  );

  // Cancel ongoing generation
  const cancelClarification = useCallback(async () => {
    if (!api || !isElectron) return;

    await api.ai.clarification.cancel();

    // Clean up listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    setIsLoading(false);
    setStatus('idle');
  }, [api, isElectron]);

  // Set an answer for a question
  const setAnswer = useCallback((questionId: string, selectedValue: null | string, customText?: string) => {
    setAnswers((prev) => {
      const existing = prev.findIndex((a) => a.questionId === questionId);
      const newAnswer: ClarificationAnswer = {
        customText,
        questionId,
        selectedValue,
      };

      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newAnswer;
        return updated;
      }
      return [...prev, newAnswer];
    });
  }, []);

  // Save answers to database
  const saveAnswers = useCallback(async () => {
    await updateMutation.mutateAsync({
      data: {
        clarificationAnalysis: analysis ? stringifyClarificationAnalysis(analysis) : null,
        clarificationAnswers: stringifyClarificationAnswers(answers),
        clarificationQuestions: stringifyClarificationQuestions(questions),
        clarificationStatus: 'completed',
      },
      id: featureRequest.id,
    });
    setStatus('completed');

    // Update run output with final answers included
    if (runIdRef.current) {
      const outputContent = JSON.stringify({
        analysis,
        answers,
        questions,
      });

      void updateRunMutation.mutateAsync({
        data: {
          outputContent,
        },
        id: runIdRef.current,
      });
    }
  }, [analysis, answers, featureRequest.id, questions, updateMutation, updateRunMutation]);

  // Skip clarification by user choice
  const skipClarification = useCallback(async () => {
    await updateMutation.mutateAsync({
      data: {
        clarificationStatus: 'skipped_by_user',
      },
      id: featureRequest.id,
    });
    setStatus('skipped_by_user');
  }, [featureRequest.id, updateMutation]);

  // Reset clarification state
  const resetClarification = useCallback(() => {
    setStatus('idle');
    setAnalysis(null);
    setQuestions([]);
    setAnswers([]);
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
      let restoredAnalysis: ClarificationAnalysis | null = null;
      let restoredQuestions: Array<ClarificationQuestion> = [];
      let restoredAnswers: Array<ClarificationAnswer> = [];
      let restoredStatus: ClarificationStatus = 'idle';

      if (run.outputContent) {
        try {
          const parsed = JSON.parse(run.outputContent) as {
            analysis?: ClarificationAnalysis;
            answers?: Array<ClarificationAnswer>;
            questions?: Array<ClarificationQuestion>;
          };

          restoredAnalysis = parsed.analysis ?? null;
          restoredQuestions = parsed.questions ?? [];
          restoredAnswers = parsed.answers ?? [];

          // Determine status based on restored data
          if (restoredAnswers.length > 0 && restoredQuestions.length > 0) {
            restoredStatus = 'completed';
          } else if (restoredQuestions.length > 0) {
            restoredStatus = 'questions_ready';
          } else if (restoredAnalysis && restoredAnalysis.detailScore >= 4) {
            restoredStatus = 'skipped';
          }
        } catch {
          setError('Failed to restore run data');
          return;
        }
      }

      // Update local state with restored data
      setAnalysis(restoredAnalysis);
      setQuestions(restoredQuestions);
      setAnswers(restoredAnswers);
      setStatus(restoredStatus);
      setStreamingText('');
      setReasoningText('');
      setIsReasoningStreaming(false);
      setError(null);
      setIsLoading(false);
      runIdRef.current = run.id;

      // Update the feature request in the database with restored clarification data
      await updateMutation.mutateAsync({
        data: {
          clarificationAnalysis: restoredAnalysis ? stringifyClarificationAnalysis(restoredAnalysis) : null,
          clarificationAnswers: restoredAnswers.length > 0 ? stringifyClarificationAnswers(restoredAnswers) : null,
          clarificationQuestions:
            restoredQuestions.length > 0 ? stringifyClarificationQuestions(restoredQuestions) : null,
          clarificationStatus: restoredStatus,
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
    analysis,
    answers,
    cancelClarification,
    error,
    isLoading,
    isQuestionsComplete,
    isReasoningStreaming,
    questions,
    reasoningText,
    requestMoreClarification,
    resetClarification,
    restoreFromRun,
    saveAnswers,
    setAnswer,
    skipClarification,
    startClarification,
    status,
    streamingText,
  };
}
