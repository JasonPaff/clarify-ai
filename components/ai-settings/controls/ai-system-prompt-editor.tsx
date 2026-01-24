'use client';

import type { ComponentPropsWithRef } from 'react';

import { useCallback, useMemo, useState } from 'react';

import type { StepConfigurationStep } from '@/db/schema/step-configurations.schema';

import { DefaultPromptViewer } from '@/components/features/workflow/default-prompt-viewer';
import { Textarea } from '@/components/ui/textarea';
import { getPromptMetadata } from '@/lib/ai/prompts/prompt-metadata';
import { cn } from '@/lib/utils';

interface AISystemPromptEditorProps extends Omit<ComponentPropsWithRef<'div'>, 'onChange'> {
  /** Whether the editor is disabled */
  isDisabled?: boolean;
  /** Callback when the prompt changes */
  onChange: (value: string | undefined) => void;
  /** The workflow step (for prompt metadata) */
  step: StepConfigurationStep;
  /** Current custom system prompt value */
  value: string | undefined;
}

/**
 * AI System Prompt editor control component.
 * Includes textarea for custom prompt and default prompt viewer.
 */
export function AISystemPromptEditor({
  className,
  isDisabled = false,
  onChange,
  ref,
  step,
  value,
  ...props
}: AISystemPromptEditorProps) {
  // State includes both local value and the last known external value
  // This pattern allows detecting when the external value changes
  const [state, setState] = useState(() => ({
    lastExternalValue: value,
    localPrompt: value ?? '',
  }));

  // Sync local state when external value changes (React-sanctioned pattern)
  // See: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (state.lastExternalValue !== value) {
    setState({
      lastExternalValue: value,
      localPrompt: value ?? '',
    });
  }

  const { localPrompt } = state;

  // Helper to update just the local prompt
  const setLocalPrompt = useCallback((newPrompt: string) => {
    setState((prev) => ({ ...prev, localPrompt: newPrompt }));
  }, []);

  // Get prompt metadata for the step
  const promptMetadata = useMemo(() => getPromptMetadata(step), [step]);

  // Handle blur to persist changes
  const handleBlur = useCallback(() => {
    const newValue = localPrompt.trim() || undefined;
    if (newValue !== value) {
      onChange(newValue);
    }
  }, [localPrompt, onChange, value]);

  // Handle "Use as Starting Point" from default prompt viewer
  const handleUseAsStartingPoint = useCallback(
    (prompt: string) => {
      setLocalPrompt(prompt);
      onChange(prompt);
    },
    [onChange, setLocalPrompt]
  );

  // Handle clearing the custom prompt
  const handleClear = useCallback(() => {
    setLocalPrompt('');
    onChange(undefined);
  }, [onChange, setLocalPrompt]);

  return (
    <div className={cn('flex flex-col gap-2', className)} ref={ref} {...props}>
      <div className={'flex items-center justify-between'}>
        <label className={'text-sm font-medium'} htmlFor={`system-prompt-${step}`}>
          Custom System Prompt
        </label>
        {localPrompt && (
          <button
            className={'text-xs text-muted-foreground hover:text-foreground'}
            disabled={isDisabled}
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            type={'button'}
          >
            Clear custom prompt (use default)
          </button>
        )}
      </div>
      <p className={'text-xs text-muted-foreground'}>
        Override the default system prompt for this step. Leave empty to use the default.
      </p>
      <Textarea
        className={'min-h-24 font-mono text-xs'}
        disabled={isDisabled}
        id={`system-prompt-${step}`}
        onBlur={handleBlur}
        onChange={(e) => setLocalPrompt(e.target.value)}
        placeholder={'Enter custom system prompt...'}
        value={localPrompt}
      />

      {/* Default Prompt Viewer */}
      <DefaultPromptViewer
        defaultPrompt={promptMetadata.defaultPrompt}
        isDisabled={isDisabled}
        onUseAsStartingPoint={handleUseAsStartingPoint}
        variables={promptMetadata.variables}
      />
    </div>
  );
}
