"use client";

import type { ComponentProps } from "react";

import { Checkbox } from "@base-ui/react/checkbox";
import { cva, type VariantProps } from "class-variance-authority";
import { Check } from "lucide-react";
import { useId } from "react";

import { useFieldContext } from "@/lib/forms/form-hook";
import { cn } from "@/lib/utils";

import {
  descriptionVariants,
  errorVariants,
  getAriaDescribedBy,
  labelVariants,
} from "./field-wrapper";

export const checkboxVariants = cva(
  `
    flex items-center justify-center rounded-sm border
    focus-visible:ring-2 focus-visible:ring-accent
    focus-visible:outline-none
    data-checked:border-accent data-checked:bg-accent
    data-checked:text-accent-foreground
    data-disabled:cursor-not-allowed data-disabled:opacity-50
    data-unchecked:border-border data-unchecked:bg-transparent
  `,
  {
    defaultVariants: {
      size: "default",
    },
    variants: {
      size: {
        default: "size-4",
        lg: "size-5",
        sm: "size-3.5",
      },
    },
  }
);

export const checkIconVariants = cva("", {
  defaultVariants: {
    size: "default",
  },
  variants: {
    size: {
      default: "size-3",
      lg: "size-3.5",
      sm: "size-2.5",
    },
  },
});

type CheckboxFieldProps = ClassName &
  VariantProps<typeof checkboxVariants> & {
    description?: string;
    disabled?: boolean;
    label: string;
  };

export function CheckboxField({
  className,
  description,
  disabled,
  label,
  size,
}: CheckboxFieldProps) {
  const field = useFieldContext<boolean>();
  const id = useId();

  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const error = field.state.meta.errors[0];
  const hasError = Boolean(error);

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label className={"flex items-center gap-2"}>
        <Checkbox.Root
          aria-describedby={getAriaDescribedBy(
            descriptionId,
            errorId,
            Boolean(description),
            hasError
          )}
          aria-invalid={hasError || undefined}
          checked={field.state.value ?? false}
          className={checkboxVariants({ size })}
          disabled={disabled}
          id={id}
          name={field.name}
          onCheckedChange={(checked) => field.handleChange(checked)}
        >
          <Checkbox.Indicator
            className={`
              flex
              data-unchecked:hidden
            `}
          >
            <CheckIcon aria-hidden={"true"} size={size} />
          </Checkbox.Indicator>
        </Checkbox.Root>
        <span className={labelVariants({ size })}>{label}</span>
      </label>
      {description && !error && (
        <p
          className={cn(descriptionVariants({ size }), "pl-6")}
          id={descriptionId}
        >
          {description}
        </p>
      )}
      {error && (
        <p
          aria-live={"polite"}
          className={cn(errorVariants({ size }), "pl-6")}
          id={errorId}
          role={"alert"}
        >
          {error}
        </p>
      )}
    </div>
  );
}

function CheckIcon(
  props: ComponentProps<"svg"> & VariantProps<typeof checkIconVariants>
) {
  const { size, ...rest } = props;
  return <Check className={cn(checkIconVariants({ size }))} {...rest} />;
}
