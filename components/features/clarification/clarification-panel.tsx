'use client';

import { AlertCircle, CheckCircle2, SkipForward, X } from 'lucide-react';
import { useState } from 'react';

import type { FeatureRequest } from '@/db/schema/feature-requests.schema';
import type { FullModelId } from '@/lib/ai/models';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useClarification } from '@/hooks/use-clarification';
import { cn } from '@/lib/utils';

import { AdvancedSettings } from './advanced-settings';
import { AnalysisSummary } from './analysis-summary';
import { ModelSelector } from './model-selector';
import { QuestionsList } from './questions-list';
import { StreamingAnalysis } from './streaming-analysis';

type ClarificationPanelProps = ClassName & {
  featureRequest: FeatureRequest;
  onClose?: () => void;
  onComplete?: () => void;
};

/**
 * Main panel component for the clarification workflow.
 * Orchestrates model selection, AI analysis, questions display, and answer submission.
 */
export const ClarificationPanel = ({ className, featureRequest, onClose, onComplete }: ClarificationPanelProps) => {
  const [selectedModel, setSelectedModel] = useState<FullModelId | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');

  const {
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
  } = useClarification({ featureRequest });

  const handleStartClarification = async () => {
    if (!selectedModel) return;
    await startClarification(selectedModel, customPrompt || undefined);
  };

  const handleSaveAndContinue = async () => {
    await saveAnswers();
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

  const allQuestionsAnswered =
    questions.length > 0 && questions.every((q) => answers.some((a) => a.questionId === q.id && a.selectedValue));

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

      {/* Idle state: Model selection and start button */}
      {status === 'idle' && (
        <div className={'space-y-3'}>
          <div className={'flex items-end gap-2'}>
            <div className={'flex-1'}>
              <label className={'mb-1.5 block text-sm font-medium'}>AI Model</label>
              <ModelSelector isDisabled={isLoading} onValueChange={setSelectedModel} value={selectedModel} />
            </div>
            <Button disabled={!selectedModel || isLoading} onClick={handleStartClarification}>
              Analyze Request
            </Button>
          </div>

          <AdvancedSettings customPrompt={customPrompt} onCustomPromptChange={setCustomPrompt} />
        </div>
      )}

      {/* Analyzing state: Show streaming text */}
      {status === 'analyzing' && (
        <div className={'space-y-3'}>
          <StreamingAnalysis isLoading={isLoading} text={streamingText} />
          <Button onClick={cancelClarification} variant={'outline'}>
            Cancel
          </Button>
        </div>
      )}

      {/* Questions ready state: Show analysis and questions */}
      {status === 'questions_ready' && (
        <div className={'space-y-4'}>
          {analysis && <AnalysisSummary analysis={analysis} />}

          <QuestionsList answers={answers} onAnswerChange={setAnswer} questions={questions} />

          <div className={'flex gap-2'}>
            <Button disabled={!allQuestionsAnswered} onClick={handleSaveAndContinue}>
              <CheckCircle2 className={'mr-2 size-4'} />
              Save & Continue
            </Button>
            <Button onClick={handleCancel} variant={'outline'}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Skipped state: Request was detailed enough */}
      {status === 'skipped' && (
        <div className={'space-y-4'}>
          {analysis && <AnalysisSummary analysis={analysis} />}

          <Alert>
            <SkipForward className={'size-4'} />
            <AlertTitle>Request is Detailed Enough</AlertTitle>
            <AlertDescription>
              Your feature request has sufficient detail (score: {analysis?.detailScore}/5). You can proceed directly to
              refining requirements.
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
            <Button onClick={resetClarification} variant={'outline'}>
              Ask Questions Anyway
            </Button>
          </div>
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

          <div className={'flex gap-2'}>
            <Button
              onClick={() => {
                onComplete?.();
              }}
            >
              Continue to Refine
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
