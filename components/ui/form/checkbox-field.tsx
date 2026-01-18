'use client';

import type { ComponentProps } from 'react';
import type { VariantProps } from 'class-variance-authority';

import { Checkbox } from '@base-ui/react/checkbox';
import { Field } from '@base-ui/react/field';
import { cva } from 'class-variance-authority';
import { Check } from 'lucide-react';

import { useFieldContext } from '@/lib/forms/form-hook';
import { cn } from '@/lib/utils';

import { descriptionVariants, errorVariants, labelVariants } from './field-wrapper';
import { TanStackFieldRoot } from './tanstack-field-root';

export const checkboxVariants = cva(
  `
    flex items-center justify-center rounded-sm border
    focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0 focus-visible:outline-none
    data-checked:border-accent data-checked:bg-accent
    data-checked:text-accent-foreground
    data-disabled:cursor-not-allowed data-disabled:opacity-50
    data-unchecked:border-border data-unchecked:bg-transparent
  `,
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default: 'size-4',
        lg: 'size-5',
        sm: 'size-3.5',
      },
    },
  }
);

export const checkIconVariants = cva('', {
  defaultVariants: {
    size: 'default',
  },
  variants: {
    size: {
      default: 'size-3',
      lg: 'size-3.5',
      sm: 'size-2.5',
    },
  },
});

type CheckboxFieldProps = ClassName &
  VariantProps<typeof checkboxVariants> & {
    description?: string;
    isDisabled?: boolean;
    label: string;
  };

export function CheckboxField({ className, description, isDisabled, label, size }: CheckboxFieldProps) {
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
      {/* Checkbox with Inline Label */}
      <Field.Item className={'flex items-center gap-2'}>
        <Checkbox.Root
          checked={field.state.value ?? false}
          className={checkboxVariants({ size })}
          onCheckedChange={(isChecked) => field.handleChange(isChecked)}
        >
          <Checkbox.Indicator className={'flex data-unchecked:hidden'}>
            <CheckIcon aria-hidden={'true'} size={size} />
          </Checkbox.Indicator>
        </Checkbox.Root>
        <Field.Label className={labelVariants({ size })} nativeLabel={false}>
          {label}
        </Field.Label>
      </Field.Item>

      {/* Description */}
      {description && !_hasError && (
        <Field.Description className={cn(descriptionVariants({ size }), 'pl-6')}>{description}</Field.Description>
      )}

      {/* Error */}
      {_hasError && (
        <Field.Error className={cn(errorVariants({ size }), 'pl-6')} match={true}>
          {error}
        </Field.Error>
      )}
    </TanStackFieldRoot>
  );
}

function CheckIcon(props: ComponentProps<'svg'> & VariantProps<typeof checkIconVariants>) {
  const { size, ...rest } = props;
  return <Check className={cn(checkIconVariants({ size }))} {...rest} />;
}
