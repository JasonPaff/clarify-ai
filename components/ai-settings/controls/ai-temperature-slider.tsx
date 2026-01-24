'use client';

import type { ComponentPropsWithRef } from 'react';

import { ParameterSlider } from '@/components/features/workflow/parameter-slider';
import { DEFAULT_TEMPERATURE, formatTemperature, TEMPERATURE_CONFIG } from '@/lib/ai/settings';
import { cn } from '@/lib/utils';

interface AITemperatureSliderProps extends Omit<ComponentPropsWithRef<'div'>, 'onChange'> {
  /** Default temperature value (for showing "Default: X" hint) */
  defaultValue?: number;
  /** Whether the slider is disabled */
  isDisabled?: boolean;
  /** Whether this value is modified from default (for visual indicator) */
  isModified?: boolean;
  /** Callback when the value changes */
  onChange: (value: number) => void;
  /** Whether to show the default value hint when modified */
  showDefaultHint?: boolean;
  /** Current temperature value */
  value: number | undefined;
}

/**
 * AI Temperature slider control component.
 * Controls the randomness/creativity of AI responses.
 */
export function AITemperatureSlider({
  className,
  defaultValue = DEFAULT_TEMPERATURE,
  isDisabled = false,
  isModified = false,
  onChange,
  ref,
  showDefaultHint = true,
  value,
  ...props
}: AITemperatureSliderProps) {
  const effectiveValue = value ?? defaultValue;

  return (
    <div className={cn('flex flex-col gap-1', className)} ref={ref} {...props}>
      <ParameterSlider
        description={'Controls randomness. Lower values are more focused, higher values more creative.'}
        formatValue={formatTemperature}
        isDisabled={isDisabled}
        label={'Temperature'}
        max={TEMPERATURE_CONFIG.max}
        min={TEMPERATURE_CONFIG.min}
        onValueChange={onChange}
        step={TEMPERATURE_CONFIG.step}
        value={effectiveValue}
      />
      {showDefaultHint && isModified && (
        <p className={'text-xs text-muted-foreground'}>Default: {formatTemperature(defaultValue)}</p>
      )}
    </div>
  );
}
