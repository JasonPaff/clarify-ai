'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { FeatureRequest } from '@/db/schema/feature-requests.schema';
import type { FullModelId } from '@/lib/ai/models';
import type {
  ClarificationAnalysis,
  ClarificationAnswer,
  ClarificationQuestion,
  ClarificationStatus,
} from '@/lib/validations/clarification';
import type { ClarificationStreamChunk, ClarificationUsageData } from '@/types/electron';

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

interface UseClarificationOptions {
  featureRequest: FeatureRequest;
}

interface UseClarificationResult {
  analysis: ClarificationAnalysis | null;
  answers: Array<ClarificationAnswer>;
  cancelClarification: () => void;
  error: null | string;
  isLoading: boolean;
  questions: Array<ClarificationQuestion>;
  resetClarification: () => void;
  saveAnswers: () => Promise<void>;
  setAnswer: (questionId: string, selectedValue: null | string, customText?: string) => void;
  startClarification: (modelId: FullModelId, customPrompt?: string) => Promise<void>;
  status: ClarificationStatus;
  streamingText: string;
  usageData: ClarificationUsageData | null;
}

/**
 * Hook that manages the clarification workflow for a feature request.
 * Handles streaming AI responses, question generation, and answer management.
 */
export function useClarification({ featureRequest }: UseClarificationOptions): UseClarificationResult {
  const { api, isElectron } = useElectron();
  const updateMutation = useUpdateFeatureRequest();

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
  const [error, setError] = useState<null | string>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [usageData, setUsageData] = useState<ClarificationUsageData | null>(null);

  // Reset state when feature request changes (synchronous check during render)
  // This is the recommended React pattern for resetting state on prop changes
  if (featureRequest.id !== trackedId) {
    setTrackedId(featureRequest.id);
    setStatus(parseClarificationStatus(featureRequest.clarificationStatus));
    setAnalysis(parseClarificationAnalysis(featureRequest.clarificationAnalysis));
    setQuestions(parseClarificationQuestions(featureRequest.clarificationQuestions));
    setAnswers(parseClarificationAnswers(featureRequest.clarificationAnswers));
    setStreamingText('');
    setError(null);
    setIsLoading(false);
    setUsageData(null);
  }

  // Stream handler reference for cleanup
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Start clarification generation
  const startClarification = useCallback(
    async (modelId: FullModelId, customPrompt?: string) => {
      if (!api || !isElectron) {
        setError('Not running in Electron');
        return;
      }

      // Reset state for new run
      setStatus('analyzing');
      setStreamingText('');
      setError(null);
      setIsLoading(true);
      setQuestions([]);
      setAnalysis(null);
      setUsageData(null);

      // Set up stream listener
      unsubscribeRef.current = api.ai.clarification.onStream((chunk: ClarificationStreamChunk) => {
        switch (chunk.type) {
          case 'error':
            setError(chunk.content ?? 'Unknown error');
            setIsLoading(false);
            setStatus('idle');
            break;

          case 'finish':
            setIsLoading(false);
            // Capture usage data from finish chunk
            if (chunk.usage) {
              setUsageData(chunk.usage);
            }
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

              // Set questions
              if (result.questions && result.questions.length > 0) {
                setQuestions(result.questions);
                setStatus('questions_ready');
              } else if (result.detailScore && result.detailScore >= 4) {
                // No questions needed - request is detailed enough
                setStatus('skipped');
              } else {
                setStatus('questions_ready');
              }
            }
            break;
        }
      });

      // Start generation
      const result = await api.ai.clarification.generate({
        customPrompt,
        featureRequest: featureRequest.rawRequest ?? '',
        featureRequestId: featureRequest.id,
        modelId,
        projectId: featureRequest.projectId,
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
      }
    },
    [api, isElectron, featureRequest.id, featureRequest.rawRequest]
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
  }, [analysis, answers, featureRequest.id, questions, updateMutation]);

  // Reset clarification state
  const resetClarification = useCallback(() => {
    setStatus('idle');
    setAnalysis(null);
    setQuestions([]);
    setAnswers([]);
    setStreamingText('');
    setError(null);
    setIsLoading(false);
    setUsageData(null);
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
    analysis,
    answers,
    cancelClarification,
    error,
    isLoading,
    questions,
    resetClarification,
    saveAnswers,
    setAnswer,
    startClarification,
    status,
    streamingText,
    usageData,
  };
}
