'use client';

import { AlertCircle, CheckCircle2, Loader2, MessageCirclePlus, SkipForward, X } from 'lucide-react';
import { useEffect } from 'react';

import type { FeatureRequestRun } from '@/db/schema/feature-request-runs.schema';
import type { FeatureRequest } from '@/db/schema/feature-requests.schema';
import type { FullModelId } from '@/lib/ai/models';
import type { ClarificationContextFile, ClarificationRepositoryOverview } from '@/types/electron';

import { CancelAiDialog } from '@/components/features/workflow/cancel-ai-dialog';
import { useWorkflow } from '@/components/providers/workflow-provider';
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ui/ai/reasoning';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useClarification } from '@/hooks/use-clarification';
import { getModelInfo } from '@/lib/ai/models';
import { cn } from '@/lib/utils';

import { AnalysisSummary } from './analysis-summary';
import { ClarificationCostEstimate } from './cost-estimate';
import { QuestionsList } from './questions-list';
import { StreamingAnalysis } from './streaming-analysis';

export interface ClarificationModelConfig {
  customPrompt?: string;
  maxTokens?: number;
  modelId: FullModelId | null;
  temperature?: number;
  thinkingBudget?: number;
  thinkingEnabled: boolean;
}

type ClarificationPanelProps = ClassName & {
  contextFiles?: Array<ClarificationContextFile>;
  currentRun?: FeatureRequestRun;
  featureRequest: FeatureRequest;
  isConfigLoading?: boolean;
  modelConfig: ClarificationModelConfig | null;
  /** Callback to register the cancel function for external cancellation */
  onCancelRegister?: (cancelFn: () => void) => void;
  onClose?: () => void;
  onComplete?: () => void;
  repositoryOverviews?: Array<ClarificationRepositoryOverview>;
};

/**
 * Main panel component for the clarification workflow.
 * Orchestrates AI analysis, questions display, and answer submission.
 * Model configuration is now managed via StepSettingsPanel.
 */
export const ClarificationPanel = ({
  className,
  contextFiles,
  currentRun,
  featureRequest,
  isConfigLoading = false,
  modelConfig,
  onCancelRegister,
  onClose,
  onComplete,
  repositoryOverviews,
}: ClarificationPanelProps) => {
  const { registerAiOperation, unregisterAiOperation } = useWorkflow();

  const {
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
    saveAnswers,
    setAnswer,
    skipClarification,
    startClarification,
    status,
    streamingText,
  } = useClarification({ contextFiles, currentRun, featureRequest, modelConfig, repositoryOverviews });

  // Register/unregister AI operation with workflow context when loading state changes
  useEffect(() => {
    if (isLoading) {
      registerAiOperation('refine');
    } else {
      unregisterAiOperation('refine');
    }

    // Cleanup on unmount to ensure we unregister if component unmounts while loading
    return () => {
      unregisterAiOperation('refine');
    };
  }, [isLoading, registerAiOperation, unregisterAiOperation]);

  // Register the cancel function for external cancellation (e.g., from step navigation)
  useEffect(() => {
    onCancelRegister?.(cancelClarification);
  }, [cancelClarification, onCancelRegister]);

  const handleStartClarification = async (forceQuestions = false) => {
    if (!modelConfig?.modelId) return;

    const isModelSupportsThinking = getModelInfo(modelConfig.modelId)?.supportsThinking ?? false;
    const effectiveThinking = isModelSupportsThinking ? modelConfig.thinkingEnabled : false;

    await startClarification({
      enableThinking: effectiveThinking,
      forceQuestions,
    });
  };

  const handleForceQuestions = async () => {
    await handleStartClarification(true);
  };

  const handleSaveAndContinue = async () => {
    await saveAnswers();
    onComplete?.();
  };

  const handleSkipClarification = async () => {
    await skipClarification();
    onComplete?.();
  };

  const handleCancel = () => {
    if (isLoading) {
      cancelClarification();
    } else {
      resetClarification();
      onClose?.();
    }
  };

  const handleRequestMoreClarification = async () => {
    if (!modelConfig?.modelId) return;

    const isModelSupportsThinking = getModelInfo(modelConfig.modelId)?.supportsThinking ?? false;
    const effectiveThinking = isModelSupportsThinking ? modelConfig.thinkingEnabled : false;

    await requestMoreClarification(effectiveThinking);
  };

  const allQuestionsAnswered =
    isQuestionsComplete &&
    questions.length > 0 &&
    questions.every((q) => answers.some((a) => a.questionId === q.id && a.selectedValue));
  const hasReasoningContent = reasoningText.length > 0;
  const hasModelConfigured = modelConfig?.modelId !== null;
  const isReady = !isConfigLoading && hasModelConfigured;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with close button */}
      <div className={'flex items-center justify-between'}>
        <h3 className={'font-medium'}>Clarify Request</h3>
        <Button onClick={handleCancel} size={'sm'} variant={'ghost'}>
          <X className={'size-4'} />
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <Alert variant={'destructive'}>
          <AlertCircle className={'size-4'} />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Idle state: Start button */}
      {status === 'idle' && (
        <div className={'space-y-3'}>
          {/* Loading Config State */}
          {isConfigLoading && (
            <div className={'flex items-center gap-2 rounded-md border border-border bg-muted/30 p-4'}>
              <Loader2 className={'size-4 animate-spin text-muted-foreground'} />
              <span className={'text-sm text-muted-foreground'}>Loading configuration...</span>
            </div>
          )}

          {/* No Model Configured State */}
          {!isConfigLoading && !hasModelConfigured && (
            <Alert>
              <AlertCircle className={'size-4'} />
              <AlertTitle>Model Not Configured</AlertTitle>
              <AlertDescription>
                Please configure a model in the Clarify Settings panel above before analyzing the request.
              </AlertDescription>
            </Alert>
          )}

          {/* Ready State */}
          {isReady && (
            <div className={'flex flex-col gap-3'}>
              {/* Cost Estimate */}
              <ClarificationCostEstimate
                customPrompt={modelConfig?.customPrompt}
                featureRequestContent={featureRequest.rawRequest ?? ''}
                modelId={modelConfig?.modelId ?? null}
              />

              {/* Action Buttons */}
              <div className={'flex flex-wrap items-center gap-2'}>
                <Button disabled={isLoading} onClick={() => handleStartClarification()}>
                  Analyze Request
                </Button>
                {!isLoading && (
                  <Button onClick={handleSkipClarification} variant={'outline'}>
                    <SkipForward className={'mr-2 size-4'} />
                    Skip Clarification
                  </Button>
                )}
              </div>
            </div>
          )}

          {!isReady && !isLoading && (
            <div className={'flex'}>
              <Button onClick={handleSkipClarification} variant={'outline'}>
                <SkipForward className={'mr-2 size-4'} />
                Skip Clarification
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Analyzing state: Show streaming text */}
      {status === 'analyzing' && (
        <div className={'space-y-3'}>
          {/* Reasoning/Thinking Display */}
          {hasReasoningContent && (
            <Reasoning isStreaming={isReasoningStreaming}>
              <ReasoningTrigger />
              <ReasoningContent className={'h-36'}>{reasoningText}</ReasoningContent>
            </Reasoning>
          )}

          <StreamingAnalysis isLoading={isLoading} text={streamingText} />
          <CancelAiDialog onConfirm={cancelClarification} stepName={'Clarification'}>
            <Button variant={'outline'}>Cancel</Button>
          </CancelAiDialog>
        </div>
      )}

      {/* Questions ready state: Show analysis and questions */}
      {status === 'questions_ready' && (
        <div className={'space-y-4'}>
          {analysis && <AnalysisSummary analysis={analysis} />}

          <QuestionsList
            answers={answers}
            isQuestionsComplete={isQuestionsComplete}
            onAnswerChange={setAnswer}
            questions={questions}
          />

          <div className={'flex flex-wrap gap-2'}>
            <Button disabled={!allQuestionsAnswered} onClick={handleSaveAndContinue}>
              <CheckCircle2 className={'mr-2 size-4'} />
              Save & Continue
            </Button>
            <Button
              disabled={!allQuestionsAnswered || isLoading}
              onClick={handleRequestMoreClarification}
              variant={'outline'}
            >
              <MessageCirclePlus className={'mr-2 size-4'} />
              Request More Clarification
            </Button>
            <Button onClick={handleCancel} variant={'outline'}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Skipped state: Request was detailed enough (AI determined) */}
      {status === 'skipped' && (
        <div className={'space-y-4'}>
          {analysis && (
            <AnalysisSummary analysis={analysis} isLoading={isLoading} onRequestOverride={handleForceQuestions} />
          )}

          <Alert>
            <SkipForward className={'size-4'} />
            <AlertTitle>Request is Detailed Enough</AlertTitle>
            <AlertDescription>
              Your feature request scored {analysis?.detailScore}/5 for detail level, which indicates sufficient clarity
              for implementation. The AI determined that clarification questions are not necessary. You can proceed
              directly to refining requirements, or request clarification anyway if you prefer.
            </AlertDescription>
          </Alert>

          <div className={'flex gap-2'}>
            <Button
              onClick={() => {
                onComplete?.();
              }}
            >
              Continue to Refine
            </Button>
            <Button disabled={isLoading} onClick={handleForceQuestions} variant={'outline'}>
              <MessageCirclePlus className={'mr-2 size-4'} />
              Ask Questions Anyway
            </Button>
          </div>
        </div>
      )}

      {/* Skipped by user state: User chose to skip clarification */}
      {status === 'skipped_by_user' && (
        <div className={'space-y-4'}>
          <Alert>
            <SkipForward className={'size-4'} />
            <AlertTitle>Clarification Skipped</AlertTitle>
            <AlertDescription>
              You chose to skip clarification. You can proceed directly to refining requirements or run clarification if
              needed.
            </AlertDescription>
          </Alert>

          <Button onClick={resetClarification} variant={'outline'}>
            Run Clarification
          </Button>
        </div>
      )}

      {/* Completed state */}
      {status === 'completed' && (
        <div className={'space-y-4'}>
          {analysis && <AnalysisSummary analysis={analysis} defaultOpen={false} />}

          <Alert variant={'success'}>
            <CheckCircle2 className={'size-4'} />
            <AlertTitle>Clarification Complete</AlertTitle>
            <AlertDescription>
              Your answers have been saved. You can now proceed to refine requirements.
            </AlertDescription>
          </Alert>

          <div className={'flex flex-wrap gap-2'}>
            <Button disabled={isLoading} onClick={handleRequestMoreClarification} variant={'outline'}>
              <MessageCirclePlus className={'mr-2 size-4'} />
              Request More Clarification
            </Button>
            <Button onClick={resetClarification} variant={'outline'}>
              Re-run Clarification
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
