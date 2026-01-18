'use client';

import type { VariantProps } from 'class-variance-authority';

import { Field } from '@base-ui/react/field';
import { Switch } from '@base-ui/react/switch';
import { cva } from 'class-variance-authority';

import { useFieldContext } from '@/lib/forms/form-hook';
import { cn } from '@/lib/utils';

import { descriptionVariants, errorVariants, labelVariants } from './field-wrapper';
import { TanStackFieldRoot } from './tanstack-field-root';

export const switchVariants = cva(
  `
    relative inline-flex shrink-0 cursor-pointer rounded-full border-2
    border-transparent transition-colors duration-200 ease-in-out
    focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0 focus-visible:outline-none
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
    isDisabled?: boolean;
    label: string;
  };

export function SwitchField({ className, description, isDisabled, label, size }: SwitchFieldProps) {
  const field = useFieldContext<boolean>();

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
      {/* Switch with Inline Label */}
      <Field.Item className={'flex items-center gap-2'}>
        <Switch.Root
          checked={field.state.value ?? false}
          className={switchVariants({ size })}
          onCheckedChange={(isChecked) => field.handleChange(isChecked)}
        >
          <Switch.Thumb className={switchThumbVariants({ size })} />
        </Switch.Root>
        <Field.Label className={labelVariants({ size })} nativeLabel={false} render={<span />}>
          {label}
        </Field.Label>
      </Field.Item>

      {/* Description */}
      {description && !_hasError && (
        <Field.Description className={cn(descriptionVariants({ size }), 'pl-11')}>{description}</Field.Description>
      )}

      {/* Error */}
      {_hasError && (
        <Field.Error className={cn(errorVariants({ size }), 'pl-11')} match={true}>
          {error}
        </Field.Error>
      )}
    </TanStackFieldRoot>
  );
}
