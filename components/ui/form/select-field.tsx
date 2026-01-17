'use client';

import { Select } from '@base-ui/react/select';
import { cva, type VariantProps } from 'class-variance-authority';
import { Check, ChevronDown } from 'lucide-react';
import { useId } from 'react';

import { useFieldContext } from '@/lib/forms/form-hook';

import { FieldWrapper, getAriaDescribedBy } from './field-wrapper';

export const selectTriggerVariants = cva(
  `
    inline-flex w-full items-center justify-between gap-2 rounded-md border
    border-border bg-transparent text-foreground
    focus:ring-2 focus:ring-accent focus:outline-none
    data-disabled:cursor-not-allowed data-disabled:opacity-50
    data-popup-open:ring-2 data-popup-open:ring-accent
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
    disabled?: boolean;
    label: string;
    options: Array<SelectOption>;
    placeholder?: string;
  };

interface SelectOption {
  disabled?: boolean;
  label: string;
  value: string;
}

export function SelectField({
  className,
  description,
  disabled,
  label,
  options,
  placeholder = 'Select an option',
  size,
}: SelectFieldProps) {
  const field = useFieldContext<string>();
  const id = useId();

  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const error = field.state.meta.errors[0];
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
      <Select.Root
        disabled={disabled}
        name={field.name}
        onOpenChange={(open) => {
          if (!open) {
            field.handleBlur();
          }
        }}
        onValueChange={(value) => field.handleChange(value ?? '')}
        value={field.state.value}
      >
        <Select.Trigger
          aria-describedby={getAriaDescribedBy(descriptionId, errorId, Boolean(description), hasError)}
          aria-invalid={hasError || undefined}
          className={selectTriggerVariants({ size })}
          id={id}
        >
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
                  disabled={option.disabled}
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
    </FieldWrapper>
  );
}
