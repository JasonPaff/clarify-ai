'use client';

import type { VariantProps } from 'class-variance-authority';

import { Field } from '@base-ui/react/field';
import { Select } from '@base-ui/react/select';
import { cva } from 'class-variance-authority';
import { Check, ChevronDown } from 'lucide-react';

import { useFieldContext } from '@/lib/forms/form-hook';

import { descriptionVariants, errorVariants, labelVariants } from './field-wrapper';
import { TanStackFieldRoot } from './tanstack-field-root';

export const selectTriggerVariants = cva(
  `
    inline-flex w-full items-center justify-between gap-2 rounded-md border
    border-border bg-transparent text-foreground
    focus:ring-2 focus:ring-accent focus:ring-offset-0 focus:outline-none
    data-disabled:cursor-not-allowed data-disabled:opacity-50
    data-popup-open:ring-2 data-popup-open:ring-accent data-popup-open:ring-offset-0
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

export const selectPopupVariants = cva(
  `
    z-50 rounded-md border border-border bg-card p-1 shadow-md
    transition-opacity duration-150 outline-none
    data-ending-style:opacity-0
    data-starting-style:opacity-0
  `,
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default: 'text-sm',
        lg: 'text-base',
        sm: 'text-xs',
      },
    },
  }
);

export const selectItemVariants = cva(
  `
    relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5
    text-foreground outline-none select-none
    data-disabled:pointer-events-none data-disabled:opacity-50
    data-highlighted:bg-muted
  `,
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default: 'text-sm',
        lg: 'text-base',
        sm: 'text-xs',
      },
    },
  }
);

type SelectFieldProps = ClassName &
  VariantProps<typeof selectTriggerVariants> & {
    description?: string;
    isDisabled?: boolean;
    label: string;
    options: Array<SelectOption>;
    placeholder?: string;
  };

interface SelectOption {
  isDisabled?: boolean;
  label: string;
  value: string;
}

export function SelectField({
  className,
  description,
  isDisabled,
  label,
  options,
  placeholder = 'Select an option',
  size,
}: SelectFieldProps) {
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
      {/* Label - use nativeLabel={false} for button-based trigger */}
      <Field.Label className={labelVariants({ size })} nativeLabel={false} render={<span />}>
        {label}
      </Field.Label>

      {/* Select */}
      <Select.Root
        disabled={isDisabled}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            field.handleBlur();
          }
        }}
        onValueChange={(value) => field.handleChange(value ?? '')}
        value={field.state.value}
      >
        <Select.Trigger className={selectTriggerVariants({ size })}>
          <Select.Value placeholder={placeholder} />
          <Select.Icon>
            <ChevronDown aria-hidden={'true'} className={'size-4 opacity-50'} />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup className={selectPopupVariants({ size })}>
              {options.map((option) => (
                <Select.Item
                  className={selectItemVariants({ size })}
                  disabled={option.isDisabled}
                  key={option.value}
                  value={option.value}
                >
                  <Select.ItemIndicator className={'absolute left-2'}>
                    <Check className={'size-3.5'} />
                  </Select.ItemIndicator>
                  <Select.ItemText className={'pl-5'}>{option.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>

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
