'use client';

import type { ComponentPropsWithRef } from 'react';

import { Slider } from '@base-ui/react/slider';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

export const sliderTrackVariants = cva(
  `
    relative h-1.5 w-full rounded-full bg-muted
  `,
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default: 'h-1.5',
        lg: 'h-2',
        sm: 'h-1',
      },
    },
  }
);

export const sliderIndicatorVariants = cva(
  `
    rounded-full bg-accent
  `,
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default: '',
        lg: '',
        sm: '',
      },
    },
  }
);

export const sliderThumbVariants = cva(
  `
    block rounded-full bg-accent shadow-sm
    focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none
    data-disabled:pointer-events-none data-disabled:opacity-50
    data-dragging:cursor-grabbing
  `,
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default: 'size-4',
        lg: 'size-5',
        sm: 'size-3',
      },
    },
  }
);

interface ParameterSliderProps extends ComponentPropsWithRef<'div'>, VariantProps<typeof sliderTrackVariants> {
  description?: string;
  formatValue?: (value: number) => string;
  isDisabled?: boolean;
  label: string;
  max: number;
  min: number;
  onValueChange: (value: number) => void;
  step?: number;
  value: number;
}

type SliderValue = number | readonly [number, ...Array<number>];

export const ParameterSlider = ({
  className,
  description,
  formatValue,
  isDisabled = false,
  label,
  max,
  min,
  onValueChange,
  ref,
  size = 'default',
  step = 1,
  value,
  ...props
}: ParameterSliderProps) => {
  const displayValue = formatValue ? formatValue(value) : String(value);

  const handleValueChange = (newValue: SliderValue) => {
    const numericValue = Array.isArray(newValue) ? (newValue[0] ?? min) : newValue;
    onValueChange(numericValue);
  };

  return (
    <div className={cn('flex flex-col gap-2', className)} ref={ref} {...props}>
      {/* Label and Value Display */}
      <div className={'flex items-center justify-between'}>
        <label className={'text-sm font-medium'}>{label}</label>
        <span className={'text-sm text-muted-foreground tabular-nums'}>{displayValue}</span>
      </div>

      {/* Slider Control */}
      <Slider.Root
        disabled={isDisabled}
        max={max}
        min={min}
        onValueChange={handleValueChange}
        step={step}
        value={value}
      >
        <Slider.Control className={'flex w-full touch-none items-center py-2 select-none'}>
          <Slider.Track className={sliderTrackVariants({ size })}>
            <Slider.Indicator className={sliderIndicatorVariants({ size })} />
            <Slider.Thumb
              aria-label={label}
              className={cn(
                sliderThumbVariants({ size }),
                'cursor-grab transition-shadow hover:shadow-md'
              )}
            />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>

      {/* Description */}
      {description && <p className={'text-xs text-muted-foreground'}>{description}</p>}
    </div>
  );
};
