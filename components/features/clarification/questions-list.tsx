'use client';

import { Loader2 } from 'lucide-react';

import type { ClarificationAnswer, ClarificationQuestion } from '@/lib/validations/clarification';

import { cn } from '@/lib/utils';

import { QuestionCard } from './question-card';

type QuestionsListProps = ClassName & {
  answers: Array<ClarificationAnswer>;
  isQuestionsComplete?: boolean;
  isReadOnly?: boolean;
  onAnswerChange: (questionId: string, selectedValue: null | string, customText?: string) => void;
  questions: Array<ClarificationQuestion>;
};

/**
 * Skeleton loader that displays while questions are still streaming.
 */
const QuestionsLoadingSkeleton = () => {
  return (
    <div className={'space-y-3'}>
      {/* Skeleton Header */}
      <div className={'flex items-center gap-2'}>
        <Loader2 className={'size-4 animate-spin text-muted-foreground'} />
        <span className={'text-sm text-muted-foreground'}>Generating clarification questions...</span>
      </div>

      {/* Skeleton Cards */}
      {[1, 2, 3].map((i) => (
        <div className={'animate-pulse rounded-md border border-border bg-card p-4'} key={i}>
          {/* Skeleton Question */}
          <div className={'mb-3'}>
            <div className={'h-4 w-3/4 rounded-sm bg-muted'} />
          </div>

          {/* Skeleton Options */}
          <div className={'space-y-2'}>
            <div className={'flex items-center gap-2'}>
              <div className={'size-4 rounded-full bg-muted'} />
              <div className={'h-3 w-1/2 rounded-sm bg-muted'} />
            </div>
            <div className={'flex items-center gap-2'}>
              <div className={'size-4 rounded-full bg-muted'} />
              <div className={'h-3 w-2/5 rounded-sm bg-muted'} />
            </div>
            <div className={'flex items-center gap-2'}>
              <div className={'size-4 rounded-full bg-muted'} />
              <div className={'h-3 w-3/5 rounded-sm bg-muted'} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Container component that renders a list of question cards.
 * Shows loading skeleton while questions are streaming and disables inputs until complete.
 */
export const QuestionsList = ({
  answers,
  className,
  isQuestionsComplete = true,
  isReadOnly = false,
  onAnswerChange,
  questions,
}: QuestionsListProps) => {
  const isStreaming = !isQuestionsComplete;
  const headingText = isReadOnly
    ? 'Clarification questions and answers:'
    : isStreaming
      ? 'Questions are being generated...'
      : 'Please answer the following questions:';

  // Show skeleton while streaming and no questions yet
  if (isStreaming && questions.length === 0) {
    return <QuestionsLoadingSkeleton />;
  }

  // Return null only if complete with no questions
  if (isQuestionsComplete && questions.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className={'flex items-center gap-2'}>
        {isStreaming && <Loader2 className={'size-4 animate-spin text-muted-foreground'} />}
        <h3 className={'text-sm font-medium text-foreground'}>{headingText}</h3>
      </div>

      {/* Streaming Indicator */}
      {isStreaming && !isReadOnly && (
        <p className={'text-xs text-muted-foreground'}>Please wait until all questions have loaded before answering.</p>
      )}

      {/* Question Cards */}
      <div className={cn(isStreaming && 'pointer-events-none opacity-60')}>
        {questions.map((question, index) => {
          const answer = answers.find((a) => a.questionId === question.id);
          return (
            <QuestionCard
              answer={answer}
              className={'mt-3 first:mt-0'}
              isReadOnly={isReadOnly}
              key={question.id}
              onAnswerChange={(selectedValue, customText) => onAnswerChange(question.id, selectedValue, customText)}
              question={question}
              questionNumber={index + 1}
            />
          );
        })}
      </div>
    </div>
  );
};
