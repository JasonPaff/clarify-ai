'use client';

import type { ComponentPropsWithRef } from 'react';

import { Switch } from '@/components/ui/switch';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { ParameterSlider } from './parameter-slider';

const MIN_BUDGET = 1024;
const MAX_BUDGET = 128000;
const BUDGET_STEP = 1024;

interface ThinkingBudgetControlProps extends Omit<ComponentPropsWithRef<'div'>, 'onChange'> {
  budget: number;
  isDisabled?: boolean;
  isEnabled: boolean;
  isSupportsThinking: boolean;
  onBudgetChange: (budget: number) => void;
  onEnabledChange: (isEnabled: boolean) => void;
}

export const ThinkingBudgetControl = ({
  budget,
  className,
  isDisabled = false,
  isEnabled,
  isSupportsThinking,
  onBudgetChange,
  onEnabledChange,
  ref,
  ...props
}: ThinkingBudgetControlProps) => {
  const isControlDisabled = isDisabled || !isSupportsThinking;

  const handleEnabledChange = (isChecked: boolean) => {
    onEnabledChange(isChecked);
  };

  const formatBudgetValue = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k tokens`;
    }
    return `${value} tokens`;
  };

  /* Switch Control */
  const switchControl = (
    <div className={'flex items-center gap-3'}>
      <Switch checked={isEnabled} disabled={isControlDisabled} onCheckedChange={handleEnabledChange} size={'sm'} />
      <div className={'flex flex-col gap-0.5'}>
        <span className={'text-sm font-medium'}>Extended Thinking</span>
        <span className={'text-xs text-muted-foreground'}>Enable deep reasoning for complex tasks</span>
      </div>
    </div>
  );

  return (
    <div className={cn('flex flex-col gap-4', className)} ref={ref} {...props}>
      {/* Toggle Control */}
      {isSupportsThinking ? (
        switchControl
      ) : (
        <Tooltip content={'This model does not support extended thinking'} side={'top'}>
          {switchControl}
        </Tooltip>
      )}

      {/* Budget Slider */}
      {isEnabled && isSupportsThinking && (
        <ParameterSlider
          description={'Maximum tokens the model can use for reasoning'}
          formatValue={formatBudgetValue}
          isDisabled={isDisabled}
          label={'Thinking Budget'}
          max={MAX_BUDGET}
          min={MIN_BUDGET}
          onValueChange={onBudgetChange}
          step={BUDGET_STEP}
          value={budget}
        />
      )}
    </div>
  );
};
