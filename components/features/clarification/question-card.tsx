'use client';

import type { ClarificationAnswer, ClarificationQuestion } from '@/lib/validations/clarification';

import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

type QuestionCardProps = ClassName & {
  answer?: ClarificationAnswer;
  isReadOnly?: boolean;
  onAnswerChange: (selectedValue: null | string, customText?: string) => void;
  question: ClarificationQuestion;
  questionNumber: number;
};

/**
 * Single question card with radio options and optional custom text input.
 */
export const QuestionCard = ({
  answer,
  className,
  isReadOnly = false,
  onAnswerChange,
  question,
  questionNumber,
}: QuestionCardProps) => {
  const isOtherSelected = answer?.selectedValue === '__other__';

  return (
    <div className={cn('rounded-md border border-border bg-card p-4', className)}>
      {/* Question */}
      <div className={'mb-3'}>
        <h4 className={'text-sm font-medium'}>
          <span className={'mr-2 text-muted-foreground'}>{questionNumber}.</span>
          {question.question}
        </h4>
      </div>

      {/* Options */}
      <RadioGroup
        disabled={isReadOnly}
        onValueChange={(value) => {
          if (isReadOnly) return;
          if (value === '__other__') {
            onAnswerChange(value, answer?.customText);
          } else {
            onAnswerChange(value);
          }
        }}
        value={answer?.selectedValue ?? ''}
      >
        {question.options.map((option) => (
          <div className={'flex items-start gap-2'} key={option.value}>
            <RadioGroupItem className={'mt-0.5'} disabled={isReadOnly} label={option.label} value={option.value} />
            {option.description && <span className={'text-xs text-muted-foreground'}>- {option.description}</span>}
          </div>
        ))}

        {/* Other option */}
        {question.allowCustom && (
          <div className={'flex items-start gap-2'}>
            <RadioGroupItem className={'mt-0.5'} disabled={isReadOnly} label={'Other'} value={'__other__'} />
          </div>
        )}
      </RadioGroup>

      {/* Custom text input (shown when "Other" is selected) */}
      {question.allowCustom && isOtherSelected && (
        <div className={'mt-2 ml-6'}>
          <Input
            className={'text-sm'}
            disabled={isReadOnly}
            onChange={(e) => {
              if (isReadOnly) return;
              onAnswerChange('__other__', e.target.value);
            }}
            placeholder={'Enter your answer...'}
            value={answer?.customText ?? ''}
          />
        </div>
      )}
    </div>
  );
};
