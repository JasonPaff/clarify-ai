'use client';

import type { ComponentProps } from 'react';
import type { VariantProps } from 'class-variance-authority';

import { Field } from '@base-ui/react/field';
import { NumberField } from '@base-ui/react/number-field';
import { cva } from 'class-variance-authority';
import { Minus, Plus } from 'lucide-react';

import { useFieldContext } from '@/lib/forms/form-hook';
import { cn } from '@/lib/utils';

import { descriptionVariants, errorVariants, labelVariants } from './field-wrapper';
import { TanStackFieldRoot } from './tanstack-field-root';

export const numberInputVariants = cva(
  `
    border-y border-border bg-transparent text-center text-foreground
    tabular-nums
    focus:z-10 focus:ring-2 focus:ring-accent focus:ring-offset-0 focus:outline-none
    data-disabled:cursor-not-allowed data-disabled:opacity-50
    data-invalid:border-destructive
    data-invalid:focus:ring-destructive
  `,
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default: 'h-9 w-20 text-sm',
        lg: 'h-10 w-24 text-base',
        sm: 'h-8 w-16 text-xs',
      },
    },
  }
);

export const numberButtonVariants = cva(
  `
    flex items-center justify-center border border-border bg-muted
    text-foreground select-none
    hover:bg-muted/80
    active:bg-muted/70
    data-disabled:cursor-not-allowed data-disabled:opacity-50
  `,
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default: 'size-9',
        lg: 'size-10',
        sm: 'size-8',
      },
    },
  }
);

type NumberFieldComponentProps = ClassName &
  VariantProps<typeof numberInputVariants> & {
    description?: string;
    isDisabled?: boolean;
    label: string;
    max?: number;
    min?: number;
    step?: number;
  };

export function NumberFieldComponent({
  className,
  description,
  isDisabled,
  label,
  max,
  min,
  size,
  step = 1,
}: NumberFieldComponentProps) {
  const field = useFieldContext<null | number>();

  const error = field.state.meta.errors[0]?.message;
  const _hasError = Boolean(error);

  return (
    <TanStackFieldRoot
      className={className}
      isDirty={field.state.meta.isDirty}
      isDisabled={isDisabled}
      isInvalid={_hasError}
      isTouched={field.state.meta.isTouched}
      name={field.name}
      size={size}
    >
      {/* Label */}
      <Field.Label className={labelVariants({ size })}>{label}</Field.Label>

      {/* Number Input */}
      <NumberField.Root
        disabled={isDisabled}
        max={max}
        min={min}
        onValueChange={(value) => field.handleChange(value)}
        step={step}
        value={field.state.value}
      >
        <NumberField.Group className={'flex'}>
          <NumberField.Decrement
            aria-label={'Decrease value'}
            className={cn(numberButtonVariants({ size }), 'rounded-l-md border-r-0')}
          >
            <MinusIcon aria-hidden={'true'} />
          </NumberField.Decrement>
          <NumberField.Input className={numberInputVariants({ size })} onBlur={field.handleBlur} />
          <NumberField.Increment
            aria-label={'Increase value'}
            className={cn(numberButtonVariants({ size }), 'rounded-r-md border-l-0')}
          >
            <PlusIcon aria-hidden={'true'} />
          </NumberField.Increment>
        </NumberField.Group>
      </NumberField.Root>

      {/* Description */}
      {description && !_hasError && (
        <Field.Description className={descriptionVariants({ size })}>{description}</Field.Description>
      )}

      {/* Error */}
      {_hasError && (
        <Field.Error className={errorVariants({ size })} match={true}>
          {error}
        </Field.Error>
      )}
    </TanStackFieldRoot>
  );
}

function MinusIcon(props: ComponentProps<'svg'>) {
  return <Minus className={'size-3.5'} {...props} />;
}

function PlusIcon(props: ComponentProps<'svg'>) {
  return <Plus className={'size-3.5'} {...props} />;
}
