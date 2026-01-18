'use client';

import type { VariantProps } from 'class-variance-authority';

import { Field } from '@base-ui/react/field';
import { Input } from '@base-ui/react/input';
import { cva } from 'class-variance-authority';

import { useFieldContext } from '@/lib/forms/form-hook';
import { cn } from '@/lib/utils';

import { descriptionVariants, errorVariants, labelVariants } from './field-wrapper';
import { TanStackFieldRoot } from './tanstack-field-root';

export const inputVariants = cva(
  `
    w-full rounded-md border border-border bg-transparent text-foreground
    placeholder:text-muted-foreground
    focus:ring-2 focus:ring-accent focus:ring-offset-0 focus:outline-none
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
        default: 'h-9 px-3 text-sm',
        lg: 'h-10 px-4 text-base',
        sm: 'h-8 px-2 text-xs',
      },
    },
  }
);

type TextFieldProps = ClassName &
  VariantProps<typeof inputVariants> & {
    autoFocus?: boolean;
    description?: string;
    isDisabled?: boolean;
    label: string;
    placeholder?: string;
    type?: 'email' | 'password' | 'text' | 'url';
  };

export function TextField({
  autoFocus,
  className,
  description,
  isDisabled,
  label,
  placeholder,
  size,
  type = 'text',
}: TextFieldProps) {
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

      {/* Input */}
      <Input
        autoFocus={autoFocus}
        className={cn(inputVariants({ size }))}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        placeholder={placeholder}
        type={type}
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
