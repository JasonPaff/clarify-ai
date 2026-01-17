"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { useId } from "react";

import { useFieldContext } from "@/lib/forms/form-hook";
import { cn } from "@/lib/utils";

import { FieldWrapper, getAriaDescribedBy } from "./field-wrapper";

export const textareaVariants = cva(
  `
    w-full resize-none rounded-md border border-border bg-transparent
    text-foreground
    placeholder:text-muted-foreground
    focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:outline-none
    disabled:cursor-not-allowed disabled:opacity-50
    aria-invalid:border-destructive
    aria-invalid:focus:ring-destructive
  `,
  {
    defaultVariants: {
      size: "default",
    },
    variants: {
      size: {
        default: "min-h-20 px-3 py-2 text-sm",
        lg: "min-h-24 px-4 py-3 text-base",
        sm: "min-h-16 px-2 py-1.5 text-xs",
      },
    },
  }
);

type TextareaFieldProps = ClassName &
  VariantProps<typeof textareaVariants> & {
    description?: string;
    disabled?: boolean;
    label: string;
    placeholder?: string;
    rows?: number;
  };

export function TextareaField({
  className,
  description,
  disabled,
  label,
  placeholder,
  rows = 3,
  size,
}: TextareaFieldProps) {
  const field = useFieldContext<string>();
  const id = useId();

  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const error = field.state.meta.errors[0];
  const hasError = Boolean(error);

  return (
    <FieldWrapper
      description={description}
      descriptionId={descriptionId}
      error={error}
      errorId={errorId}
      label={label}
      labelFor={id}
      size={size}
    >
      <textarea
        aria-describedby={getAriaDescribedBy(
          descriptionId,
          errorId,
          Boolean(description),
          hasError
        )}
        aria-invalid={hasError || undefined}
        className={cn(textareaVariants({ size }), className)}
        disabled={disabled}
        id={id}
        name={field.name}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        value={field.state.value ?? ""}
      />
    </FieldWrapper>
  );
}
