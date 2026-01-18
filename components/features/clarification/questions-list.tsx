'use client';

import type { ClarificationAnswer, ClarificationQuestion } from '@/lib/validations/clarification';

import { cn } from '@/lib/utils';

import { QuestionCard } from './question-card';

type QuestionsListProps = ClassName & {
  answers: Array<ClarificationAnswer>;
  onAnswerChange: (questionId: string, selectedValue: null | string, customText?: string) => void;
  questions: Array<ClarificationQuestion>;
};

/**
 * Container component that renders a list of question cards.
 */
export const QuestionsList = ({ answers, className, onAnswerChange, questions }: QuestionsListProps) => {
  if (questions.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      <h3 className={'text-sm font-medium text-foreground'}>Please answer the following questions:</h3>
      {questions.map((question, index) => {
        const answer = answers.find((a) => a.questionId === question.id);
        return (
          <QuestionCard
            answer={answer}
            key={question.id}
            onAnswerChange={(selectedValue, customText) => onAnswerChange(question.id, selectedValue, customText)}
            question={question}
            questionNumber={index + 1}
          />
        );
      })}
    </div>
  );
};
