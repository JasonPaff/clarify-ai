'use client';

import type { VariantProps } from 'class-variance-authority';

import { Field } from '@base-ui/react/field';
import { cva } from 'class-variance-authority';

import { useFieldContext } from '@/lib/forms/form-hook';
import { cn } from '@/lib/utils';

import { descriptionVariants, errorVariants, labelVariants } from './field-wrapper';
import { TanStackFieldRoot } from './tanstack-field-root';

export const textareaVariants = cva(
  `
    w-full resize-none rounded-md border border-border bg-transparent
    text-foreground
    placeholder:text-muted-foreground
    focus:ring-2 focus:ring-accent focus:ring-offset-0 focus:outline-none
    disabled:cursor-not-allowed disabled:opacity-50
    data-invalid:border-destructive
    data-invalid:focus:ring-destructive
  `,
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default: 'min-h-20 px-3 py-2 text-sm',
        lg: 'min-h-24 px-4 py-3 text-base',
        sm: 'min-h-16 px-2 py-1.5 text-xs',
      },
    },
  }
);

type TextareaFieldProps = ClassName &
  VariantProps<typeof textareaVariants> & {
    description?: string;
    isDisabled?: boolean;
    label: string;
    placeholder?: string;
    rows?: number;
  };

export function TextareaField({
  className,
  description,
  isDisabled,
  label,
  placeholder,
  rows = 3,
  size,
}: TextareaFieldProps) {
  const field = useFieldContext<string>();

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

      {/* Textarea */}
      <textarea
        className={cn(textareaVariants({ size }))}
        data-disabled={isDisabled || undefined}
        data-invalid={_hasError || undefined}
        disabled={isDisabled}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        value={field.state.value ?? ''}
      />

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
