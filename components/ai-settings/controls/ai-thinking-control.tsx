'use client';

import type { ComponentPropsWithRef } from 'react';

import type { FullModelId } from '@/lib/ai/models';

import { ThinkingBudgetControl } from '@/components/features/workflow/thinking-budget-control';
import { getModelInfo } from '@/lib/ai/models';
import { DEFAULT_THINKING_BUDGET } from '@/lib/ai/settings';
import { cn } from '@/lib/utils';

interface AIThinkingControlProps extends Omit<ComponentPropsWithRef<'div'>, 'onChange'> {
  /** Current thinking budget value */
  budget: number | undefined;
  /** Default thinking budget value */
  defaultBudget?: number;
  /** Whether the control is disabled */
  isDisabled?: boolean;
  /** Whether thinking is enabled */
  isEnabled: boolean | undefined;
  /** Current model ID (used to determine if thinking is supported) */
  modelId: FullModelId | null | undefined;
  /** Callback when the budget changes */
  onBudgetChange: (budget: number) => void;
  /** Callback when enabled state changes */
  onEnabledChange: (isEnabled: boolean) => void;
}

/**
 * AI Thinking control component.
 * Handles both the thinking toggle and budget slider.
 * Automatically detects if the selected model supports thinking.
 */
export function AIThinkingControl({
  budget,
  className,
  defaultBudget = DEFAULT_THINKING_BUDGET,
  isDisabled = false,
  isEnabled,
  modelId,
  onBudgetChange,
  onEnabledChange,
  ref,
  ...props
}: AIThinkingControlProps) {
  // Determine if the current model supports thinking
  const modelInfo = modelId ? getModelInfo(modelId) : undefined;
  const supportsThinking = modelInfo?.supportsThinking ?? false;

  const effectiveBudget = budget ?? defaultBudget;
  const effectiveEnabled = isEnabled ?? false;

  return (
    <div className={cn(className)} ref={ref} {...props}>
      <ThinkingBudgetControl
        budget={effectiveBudget}
        isDisabled={isDisabled}
        isEnabled={effectiveEnabled}
        isSupportsThinking={supportsThinking}
        onBudgetChange={onBudgetChange}
        onEnabledChange={onEnabledChange}
      />
    </div>
  );
}
