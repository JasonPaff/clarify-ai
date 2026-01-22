import { parseClarificationAnswers, parseClarificationQuestions } from '@/lib/validations/clarification';

export function buildClarificationContext(
  questionsJson: null | string | undefined,
  answersJson: null | string | undefined
): null | string {
  const questions = parseClarificationQuestions(questionsJson);
  const answers = parseClarificationAnswers(answersJson);

  if (questions.length === 0 || answers.length === 0) {
    return null;
  }

  const lines: Array<string> = ['## Clarification Q&A', ''];

  for (const question of questions) {
    const answer = answers.find((item) => item.questionId === question.id);
    const selectedValue = answer?.selectedValue ?? null;
    const selectedLabel = selectedValue
      ? (question.options.find((option) => option.value === selectedValue)?.label ?? selectedValue)
      : null;

    let answerText = selectedLabel ?? 'Unanswered';
    if (answer?.customText) {
      const prefix = selectedLabel ? `${selectedLabel} - ` : '';
      answerText = `${prefix}${answer.customText}`;
    }

    lines.push(`Q: ${question.question}`);
    lines.push(`A: ${answerText}`);
    lines.push('');
  }

  return lines.join('\n').trim();
}
