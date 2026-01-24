'use client';

import type { ComponentPropsWithRef } from 'react';

import { ParameterSlider } from '@/components/features/workflow/parameter-slider';
import { DEFAULT_MAX_TOKENS, formatMaxTokens, MAX_TOKENS_CONFIG } from '@/lib/ai/settings';
import { cn } from '@/lib/utils';

interface AIMaxTokensSliderProps extends Omit<ComponentPropsWithRef<'div'>, 'onChange'> {
  /** Default max tokens value (for showing "Default: X" hint) */
  defaultValue?: number;
  /** Whether the slider is disabled */
  isDisabled?: boolean;
  /** Whether this value is modified from default (for visual indicator) */
  isModified?: boolean;
  /** Callback when the value changes */
  onChange: (value: number) => void;
  /** Whether to show the default value hint when modified */
  showDefaultHint?: boolean;
  /** Current max tokens value */
  value: number | undefined;
}

/**
 * AI Max Tokens slider control component.
 * Controls the maximum number of tokens in AI responses.
 */
export function AIMaxTokensSlider({
  className,
  defaultValue = DEFAULT_MAX_TOKENS,
  isDisabled = false,
  isModified = false,
  onChange,
  ref,
  showDefaultHint = true,
  value,
  ...props
}: AIMaxTokensSliderProps) {
  const effectiveValue = value ?? defaultValue;

  return (
    <div className={cn('flex flex-col gap-1', className)} ref={ref} {...props}>
      <ParameterSlider
        description={'Maximum number of tokens the model can generate in the response.'}
        formatValue={formatMaxTokens}
        isDisabled={isDisabled}
        label={'Max Tokens'}
        max={MAX_TOKENS_CONFIG.max}
        min={MAX_TOKENS_CONFIG.min}
        onValueChange={onChange}
        step={MAX_TOKENS_CONFIG.step}
        value={effectiveValue}
      />
      {showDefaultHint && isModified && (
        <p className={'text-xs text-muted-foreground'}>Default: {formatMaxTokens(defaultValue)}</p>
      )}
    </div>
  );
}
