"use client";

import { Input } from "@base-ui/react/input";
import { cva, type VariantProps } from "class-variance-authority";
import { useId } from "react";

import { useFieldContext } from "@/lib/forms/form-hook";
import { cn } from "@/lib/utils";

import { FieldWrapper, getAriaDescribedBy } from "./field-wrapper";

export const inputVariants = cva(
  `
    w-full rounded-md border border-border bg-transparent text-foreground
    placeholder:text-muted-foreground
    focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:outline-none
    data-disabled:cursor-not-allowed data-disabled:opacity-50
    data-invalid:border-destructive
    data-invalid:focus:ring-destructive
  `,
  {
    defaultVariants: {
      size: "default",
    },
    variants: {
      size: {
        default: "h-9 px-3 text-sm",
        lg: "h-10 px-4 text-base",
        sm: "h-8 px-2 text-xs",
      },
    },
  }
);

type TextFieldProps = ClassName &
  VariantProps<typeof inputVariants> & {
    description?: string;
    disabled?: boolean;
    label: string;
    placeholder?: string;
    type?: "email" | "password" | "text" | "url";
  };

export function TextField({
  className,
  description,
  disabled,
  label,
  placeholder,
  size,
  type = "text",
}: TextFieldProps) {
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
      <Input
        aria-describedby={getAriaDescribedBy(
          descriptionId,
          errorId,
          Boolean(description),
          hasError
        )}
        aria-invalid={hasError || undefined}
        className={cn(inputVariants({ size }), className)}
        disabled={disabled}
        id={id}
        name={field.name}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        value={field.state.value ?? ""}
      />
    </FieldWrapper>
  );
}
