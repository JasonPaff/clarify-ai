'use client';

import { Switch } from '@base-ui/react/switch';
import { cva, type VariantProps } from 'class-variance-authority';
import { useId } from 'react';

import { useFieldContext } from '@/lib/forms/form-hook';
import { cn } from '@/lib/utils';

import { descriptionVariants, errorVariants, getAriaDescribedBy, labelVariants } from './field-wrapper';

export const switchVariants = cva(
  `
    relative inline-flex shrink-0 cursor-pointer rounded-full border-2
    border-transparent transition-colors duration-200 ease-in-out
    focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none
    data-checked:bg-accent
    data-disabled:cursor-not-allowed data-disabled:opacity-50
    data-unchecked:bg-muted
  `,
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default: 'h-5 w-9',
        lg: 'h-6 w-11',
        sm: 'h-4 w-7',
      },
    },
  }
);

export const switchThumbVariants = cva(
  `
    pointer-events-none block rounded-full bg-white shadow-sm ring-0
    transition-transform duration-200 ease-in-out
  `,
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default: `
          size-4
          data-checked:translate-x-4
          data-unchecked:translate-x-0
        `,
        lg: `
          size-5
          data-checked:translate-x-5
          data-unchecked:translate-x-0
        `,
        sm: `
          size-3
          data-checked:translate-x-3
          data-unchecked:translate-x-0
        `,
      },
    },
  }
);

type SwitchFieldProps = ClassName &
  VariantProps<typeof switchVariants> & {
    description?: string;
    disabled?: boolean;
    label: string;
  };

export function SwitchField({ className, description, disabled, label, size }: SwitchFieldProps) {
  const field = useFieldContext<boolean>();
  const id = useId();

  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const error = field.state.meta.errors[0];
  const hasError = Boolean(error);

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label className={'flex items-center gap-2'}>
        <Switch.Root
          aria-describedby={getAriaDescribedBy(descriptionId, errorId, Boolean(description), hasError)}
          aria-invalid={hasError || undefined}
          checked={field.state.value ?? false}
          className={switchVariants({ size })}
          disabled={disabled}
          id={id}
          name={field.name}
          onCheckedChange={(checked) => field.handleChange(checked)}
        >
          <Switch.Thumb className={switchThumbVariants({ size })} />
        </Switch.Root>
        <span className={labelVariants({ size })}>{label}</span>
      </label>
      {description && !error && (
        <p className={cn(descriptionVariants({ size }), 'pl-11')} id={descriptionId}>
          {description}
        </p>
      )}
      {error && (
        <p aria-live={'polite'} className={cn(errorVariants({ size }), 'pl-11')} id={errorId} role={'alert'}>
          {error}
        </p>
      )}
    </div>
  );
}
