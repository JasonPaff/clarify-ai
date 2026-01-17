"use client";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const fieldWrapperVariants = cva("flex flex-col gap-1.5", {
  defaultVariants: {
    size: "default",
  },
  variants: {
    size: {
      default: "",
      lg: "",
      sm: "",
    },
  },
});

export const labelVariants = cva("font-medium text-foreground", {
  defaultVariants: {
    size: "default",
  },
  variants: {
    size: {
      default: "text-sm",
      lg: "text-base",
      sm: "text-xs",
    },
  },
});

export const descriptionVariants = cva("text-muted-foreground", {
  defaultVariants: {
    size: "default",
  },
  variants: {
    size: {
      default: "text-sm",
      lg: "text-sm",
      sm: "text-xs",
    },
  },
});

export const errorVariants = cva("text-destructive", {
  defaultVariants: {
    size: "default",
  },
  variants: {
    size: {
      default: "text-sm",
      lg: "text-sm",
      sm: "text-xs",
    },
  },
});

type FieldWrapperProps = ClassName &
  RequiredChildren &
  VariantProps<typeof fieldWrapperVariants> & {
    description?: string;
    error?: string;
    label: string;
    labelFor?: string;
  };

export function FieldWrapper({
  children,
  className,
  description,
  error,
  label,
  labelFor,
  size,
}: FieldWrapperProps) {
  return (
    <div className={cn(fieldWrapperVariants({ size }), className)}>
      <label className={labelVariants({ size })} htmlFor={labelFor}>
        {label}
      </label>
      {children}
      {description && !error && (
        <p className={descriptionVariants({ size })}>{description}</p>
      )}
      {error && <p className={errorVariants({ size })}>{error}</p>}
    </div>
  );
}
