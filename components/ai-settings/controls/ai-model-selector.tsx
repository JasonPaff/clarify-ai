'use client';

import type { ComponentPropsWithRef } from 'react';

import type { FullModelId } from '@/lib/ai/models';

import { ModelSelector } from '@/components/features/clarification/model-selector';
import { cn } from '@/lib/utils';

interface AIModelSelectorProps extends Omit<ComponentPropsWithRef<'div'>, 'onChange'> {
  /** Whether the selector is disabled */
  isDisabled?: boolean;
  /** Whether this value is modified from default (for visual indicator) */
  isModified?: boolean;
  /** Callback when the model changes */
  onChange: (value: FullModelId) => void;
  /** Currently selected model ID */
  value: FullModelId | null | undefined;
}

/**
 * AI Model selector control component.
 * Wraps the existing ModelSelector with a consistent interface.
 */
export function AIModelSelector({
  className,
  isDisabled = false,
  isModified = false,
  onChange,
  ref,
  value,
  ...props
}: AIModelSelectorProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)} ref={ref} {...props}>
      <div className={'flex items-center justify-between'}>
        <label className={'text-sm font-medium'}>Model</label>
        {isModified && <span className={'text-xs text-muted-foreground'}>(modified)</span>}
      </div>
      <ModelSelector isDisabled={isDisabled} onValueChange={onChange} value={value ?? null} />
    </div>
  );
}
