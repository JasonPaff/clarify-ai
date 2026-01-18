'use client';

import type { ComponentProps } from 'react';

import { NumberField } from '@base-ui/react/number-field';
import { cva, type VariantProps } from 'class-variance-authority';
import { Minus, Plus } from 'lucide-react';
import { useId } from 'react';

import { useFieldContext } from '@/lib/forms/form-hook';
import { cn } from '@/lib/utils';

import { FieldWrapper, getAriaDescribedBy } from './field-wrapper';

export const numberInputVariants = cva(
  `
    border-y border-border bg-transparent text-center text-foreground
    tabular-nums
    focus:z-10 focus:ring-2 focus:ring-accent focus:outline-none
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
    disabled?: boolean;
    label: string;
    max?: number;
    min?: number;
    step?: number;
  };

export function NumberFieldComponent({
  className,
  description,
  disabled,
  label,
  max,
  min,
  size,
  step = 1,
}: NumberFieldComponentProps) {
  const field = useFieldContext<null | number>();
  const id = useId();

  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const error = field.state.meta.errors[0]?.message;
  const hasError = Boolean(error);

  return (
    <FieldWrapper
      className={className}
      description={description}
      descriptionId={descriptionId}
      error={error}
      errorId={errorId}
      label={label}
      labelFor={id}
      size={size}
    >
      <NumberField.Root
        aria-invalid={hasError || undefined}
        disabled={disabled}
        id={id}
        max={max}
        min={min}
        name={field.name}
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
          <NumberField.Input
            aria-describedby={getAriaDescribedBy(descriptionId, errorId, Boolean(description), hasError)}
            className={numberInputVariants({ size })}
            onBlur={field.handleBlur}
          />
          <NumberField.Increment
            aria-label={'Increase value'}
            className={cn(numberButtonVariants({ size }), 'rounded-r-md border-l-0')}
          >
            <PlusIcon aria-hidden={'true'} />
          </NumberField.Increment>
        </NumberField.Group>
      </NumberField.Root>
    </FieldWrapper>
  );
}

function MinusIcon(props: ComponentProps<'svg'>) {
  return <Minus className={'size-3.5'} {...props} />;
}

function PlusIcon(props: ComponentProps<'svg'>) {
  return <Plus className={'size-3.5'} {...props} />;
}
