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
import type {
  ClarificationContextFile,
  ClarificationRepositoryOverview,
  ClarificationStreamChunk,
} from '@/types/electron';

import { useCreateRun, useSetCurrentRun, useUpdateRun } from '@/hooks/queries/use-feature-request-runs';
import { useUpdateFeatureRequest } from '@/hooks/queries/use-feature-requests';
import {
  parseClarificationAnalysis,
  parseClarificationAnswers,
  parseClarificationQuestions,
  parseClarificationStatus,
  parseRunOutputContent,
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
  contextFiles?: Array<ClarificationContextFile>;
  currentRun?: FeatureRequestRun;
  featureRequest: FeatureRequest;
  modelConfig: ClarificationModelConfig | null;
  repositoryOverviews?: Array<ClarificationRepositoryOverview>;
}

interface UseClarificationResult {
  analysis: ClarificationAnalysis | null;
  answers: Array<ClarificationAnswer>;
  cancelClarification: () => void;
  /** Clear the parse error state */
  clearParseError: () => void;
  error: null | string;
  isLoading: boolean;
  isQuestionsComplete: boolean;
  isReasoningStreaming: boolean;
  /** Error from parsing stored JSON data (feature request or run) */
  parseError: null | string;
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
  /** Whether generation was cancelled (for UI feedback) */
  wasCancelled: boolean;
  /** Whether the current state was restored from a run (for UI feedback) */
  wasRestored: boolean;
}

/**
 * Hook that manages the clarification workflow for a feature request.
 * Handles streaming AI responses, question generation, and answer management.
 * Model configuration is now passed in from the parent component via modelConfig.
 */
export function useClarification({
  contextFiles,
  currentRun,
  featureRequest,
  modelConfig,
  repositoryOverviews,
}: UseClarificationOptions): UseClarificationResult {
  const { api, isElectron } = useElectron();
  const updateMutation = useUpdateFeatureRequest();
  const createRunMutation = useCreateRun();
  const updateRunMutation = useUpdateRun();
  const setCurrentRunMutation = useSetCurrentRun();

  // Track the feature request ID for reset detection
  const [trackedId, setTrackedId] = useState(featureRequest.id);

  // Helper to derive status from parsed data
  const deriveStatusFromData = (
    storedStatus: ClarificationStatus,
    analysisData: ClarificationAnalysis | null,
    questionsData: Array<ClarificationQuestion>,
    answersData: Array<ClarificationAnswer>
  ): ClarificationStatus => {
    // If status is completed, skipped, or skipped_by_user, use it
    if (storedStatus === 'completed' || storedStatus === 'skipped' || storedStatus === 'skipped_by_user') {
      return storedStatus;
    }
    // Fallback: if we have answers stored, we're completed
    if (answersData.length > 0 && questionsData.length > 0) {
      return 'completed';
    }
    // Another fallback: if we have questions stored but no answers, we're in questions_ready
    if (questionsData.length > 0) {
      return 'questions_ready';
    }
    // If we have analysis with high detail score, we're skipped
    if (analysisData && analysisData.detailScore >= 4) {
      return 'skipped';
    }
    return storedStatus;
  };

  /**
   * Initialize state from either currentRun (preferred) or featureRequest.
   * Returns initial values and any parse errors encountered.
   */
  const computeInitialState = (
    fr: FeatureRequest,
    run?: FeatureRequestRun
  ): {
    analysis: ClarificationAnalysis | null;
    answers: Array<ClarificationAnswer>;
    parseError: null | string;
    questions: Array<ClarificationQuestion>;
    status: ClarificationStatus;
    wasRestored: boolean;
  } => {
    // If we have a current run, prefer its data (source of truth)
    if (run?.outputContent) {
      const parsed = parseRunOutputContent(run.outputContent);
      const status = deriveStatusFromData('idle', parsed.analysis, parsed.questions, parsed.answers);
      return {
        analysis: parsed.analysis,
        answers: parsed.answers,
        parseError: parsed.error,
        questions: parsed.questions,
        status,
        wasRestored: true,
      };
    }

    // Fall back to feature request columns
    const storedStatus = parseClarificationStatus(fr.clarificationStatus);
    const storedAnalysis = parseClarificationAnalysis(fr.clarificationAnalysis);
    const storedQuestions = parseClarificationQuestions(fr.clarificationQuestions);
    const storedAnswers = parseClarificationAnswers(fr.clarificationAnswers);

    return {
      analysis: storedAnalysis,
      answers: storedAnswers,
      parseError: null,
      questions: storedQuestions,
      status: deriveStatusFromData(storedStatus, storedAnalysis, storedQuestions, storedAnswers),
      wasRestored: false,
    };
  };

  // Compute initial state (prefer currentRun if available)
  const initialState = computeInitialState(featureRequest, currentRun);

  // Parse initial state from feature request or currentRun
  const [status, setStatus] = useState<ClarificationStatus>(() => initialState.status);
  const [analysis, setAnalysis] = useState<ClarificationAnalysis | null>(() => initialState.analysis);
  const [questions, setQuestions] = useState<Array<ClarificationQuestion>>(() => initialState.questions);
  const [answers, setAnswers] = useState<Array<ClarificationAnswer>>(() => initialState.answers);
  const [streamingText, setStreamingText] = useState('');
  const [reasoningText, setReasoningText] = useState('');
  const [isReasoningStreaming, setIsReasoningStreaming] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isQuestionsComplete, setIsQuestionsComplete] = useState(() => initialState.questions.length > 0);
  const [parseError, setParseError] = useState<null | string>(() => initialState.parseError);
  const [wasCancelled, setWasCancelled] = useState(false);
  const [wasRestored, setWasRestored] = useState(() => initialState.wasRestored);

  // Stream handler reference for cleanup
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Ref to store run ID for async callback access
  const runIdRef = useRef<null | number>(null);

  // Reset state when feature request changes (synchronous check during render)
  // This is the recommended React pattern for resetting state on prop changes
  if (featureRequest.id !== trackedId) {
    setTrackedId(featureRequest.id);
    // Recompute initial state with new feature request and current run
    const newState = computeInitialState(featureRequest, currentRun);
    setStatus(newState.status);
    setAnalysis(newState.analysis);
    setQuestions(newState.questions);
    setAnswers(newState.answers);
    setStreamingText('');
    setReasoningText('');
    setIsReasoningStreaming(false);
    setError(null);
    setIsLoading(false);
    setIsQuestionsComplete(true);
    setParseError(newState.parseError);
    setWasRestored(newState.wasRestored);
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
      // Parse the run's outputContent using the helper
      const parsed = parseRunOutputContent(currentRun.outputContent);

      // If there was a parse error, set it and don't proceed with restore
      if (parsed.error) {
        setParseError(parsed.error);
        return;
      }

      // Determine status based on restored data
      const restoredStatus = deriveStatusFromData('idle', parsed.analysis, parsed.questions, parsed.answers);

      // Update local state with restored data
      setAnalysis(parsed.analysis);
      setQuestions(parsed.questions);
      setAnswers(parsed.answers);
      setStatus(restoredStatus);
      setStreamingText('');
      setReasoningText('');
      setIsReasoningStreaming(false);
      setError(null);
      setIsLoading(false);
      setParseError(null);
      setWasRestored(true);
      runIdRef.current = currentRun.id;

      // Update the feature request in the database with restored clarification data
      void updateMutation.mutateAsync({
        data: {
          clarificationAnalysis: parsed.analysis ? stringifyClarificationAnalysis(parsed.analysis) : null,
          clarificationAnswers: parsed.answers.length > 0 ? stringifyClarificationAnswers(parsed.answers) : null,
          clarificationQuestions:
            parsed.questions.length > 0 ? stringifyClarificationQuestions(parsed.questions) : null,
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

      // Store existing Q&A for restoration on error
      const existingQuestions = [...questions];
      const existingAnswers = [...answers];

      // Reset state for new run
      setStatus('analyzing');
      setStreamingText('');
      setReasoningText('');
      setIsReasoningStreaming(false);
      setError(null);
      setIsLoading(true);
      setIsQuestionsComplete(false);
      setAnswers([]);
      setQuestions([]);
      setAnalysis(null);
      setParseError(null);
      setWasCancelled(false);
      setWasRestored(false);

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
            // Restore previous Q&A if they existed
            if (existingQuestions.length > 0) {
              setQuestions(existingQuestions);
              setAnswers(existingAnswers);
              setStatus('questions_ready');
            } else {
              setStatus('idle');
            }
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
        contextFiles,
        customPrompt,
        enableThinking,
        featureRequest: featureRequest.rawRequest ?? '',
        featureRequestId: featureRequest.id,
        maxTokens: modelConfig.maxTokens,
        modelId: modelConfig.modelId,
        repositoryOverviews,
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
        // Restore previous Q&A if they existed
        if (existingQuestions.length > 0) {
          setQuestions(existingQuestions);
          setAnswers(existingAnswers);
          setStatus('questions_ready');
        } else {
          setStatus('idle');
        }
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
      answers,
      api,
      contextFiles,
      createRunMutation,
      featureRequest.id,
      featureRequest.rawRequest,
      isElectron,
      modelConfig,
      questions,
      repositoryOverviews,
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

      const combinedPrompt = additionalContextPrompt + (modelConfig.customPrompt ?? '');

      const inputContent = [featureRequest.rawRequest ?? '', 'Previous Questions and Answers:', previousQAContext]
        .filter((value) => value.length > 0)
        .join('\n\n');

      // Create a new run for the follow-up clarification
      const createdRun = await createRunMutation.mutateAsync({
        featureRequestId: featureRequest.id,
        inputContent,
        modelId: modelConfig.modelId,
        parameters: JSON.stringify({
          enableThinking,
          followUp: true,
          maxTokens: modelConfig.maxTokens,
          temperature: modelConfig.temperature,
          thinkingBudget: modelConfig.thinkingBudget,
        }),
        promptUsed: combinedPrompt,
        startedAt: new Date().toISOString(),
        status: 'running',
        step: 'refine',
      });

      runIdRef.current = createdRun?.id ?? null;

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
                    completedAt: new Date().toISOString(),
                    outputContent,
                    status: 'completed',
                  },
                  id: runIdRef.current,
                });

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

      // Start generation with context from step settings
      const result = await api.ai.clarification.generate({
        contextFiles,
        customPrompt: combinedPrompt,
        enableThinking,
        featureRequest: featureRequest.rawRequest ?? '',
        featureRequestId: featureRequest.id,
        maxTokens: modelConfig.maxTokens,
        modelId: modelConfig.modelId,
        repositoryOverviews,
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
      analysis,
      answers,
      api,
      contextFiles,
      createRunMutation,
      featureRequest.id,
      featureRequest.rawRequest,
      isElectron,
      modelConfig,
      questions,
      repositoryOverviews,
      setCurrentRunMutation,
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
    setIsReasoningStreaming(false);
    // Only mark questions complete if we have questions from a previous tool_result
    setIsQuestionsComplete(questions.length > 0);
    setStatus('idle');
    setWasCancelled(true);

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
  }, [api, isElectron, questions, updateRunMutation]);

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

  // Reset clarification state (clears local state only, preserves database run history)
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
    setParseError(null);
    setWasCancelled(false);
    setWasRestored(false);
    runIdRef.current = null;
  }, []);

  // Clear parse error (allows recovery from corrupted data)
  const clearParseError = useCallback(() => {
    setParseError(null);
  }, []);

  // Restore state from a previous run (public API)
  const restoreFromRun = useCallback(
    async (run: FeatureRequestRun) => {
      // Parse the run's outputContent using the helper
      const parsed = parseRunOutputContent(run.outputContent);

      // If there was a parse error, set it and don't proceed with restore
      if (parsed.error) {
        setParseError(parsed.error);
        return;
      }

      // Determine status based on restored data
      const restoredStatus = deriveStatusFromData('idle', parsed.analysis, parsed.questions, parsed.answers);

      // Update local state with restored data
      setAnalysis(parsed.analysis);
      setQuestions(parsed.questions);
      setAnswers(parsed.answers);
      setStatus(restoredStatus);
      setStreamingText('');
      setReasoningText('');
      setIsReasoningStreaming(false);
      setError(null);
      setIsLoading(false);
      setParseError(null);
      setWasRestored(true);
      runIdRef.current = run.id;

      // Update the feature request in the database with restored clarification data
      await updateMutation.mutateAsync({
        data: {
          clarificationAnalysis: parsed.analysis ? stringifyClarificationAnalysis(parsed.analysis) : null,
          clarificationAnswers: parsed.answers.length > 0 ? stringifyClarificationAnswers(parsed.answers) : null,
          clarificationQuestions:
            parsed.questions.length > 0 ? stringifyClarificationQuestions(parsed.questions) : null,
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
    clearParseError,
    error,
    isLoading,
    isQuestionsComplete,
    isReasoningStreaming,
    parseError,
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
    wasCancelled,
    wasRestored,
  };
}
