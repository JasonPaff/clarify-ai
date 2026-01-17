# Form Conventions

A comprehensive guide for consistent, accessible form development using TanStack React Form with Base UI primitives and CVA styling.

---

## Tech Stack

- **TanStack React Form**: `@tanstack/react-form` for form state management
- **Base UI**: `@base-ui/react` for unstyled accessible UI primitives
- **CVA**: `class-variance-authority` for variant-based component styling
- **React**: `useId()` hook for accessible ID generation

---

## File Organization

### Directory Structure

```
lib/
  forms/
    index.ts                    # Form hook exports
    form-hook.ts                # Form hook factory configuration

components/
  ui/
    form/
      index.ts                  # Barrel exports for all form components
      field-wrapper.tsx         # Shared field wrapper with label/error/description
      form-error.tsx            # Form-level error display
      submit-button.tsx         # Form-aware submit button
      text-field.tsx            # Text input field
      textarea-field.tsx        # Textarea field
      select-field.tsx          # Select dropdown field
      checkbox-field.tsx        # Checkbox field
      switch-field.tsx          # Switch/toggle field
      number-field.tsx          # Number input field
      focus-management/
        focus-context.tsx       # Focus management context provider
        use-focus-management.ts # Focus management hook
        with-focus-management.tsx # HOC for wrapping forms
```

### File Naming

- Field component files: `{type}-field.tsx` (kebab-case)
- Form utility files: descriptive names like `field-wrapper.tsx`, `form-error.tsx`
- Focus management in dedicated subdirectory
- All exports via barrel file at `components/ui/form/index.ts`

---

## Form Hook Factory Pattern

### Configuration Setup

```typescript
// lib/forms/form-hook.ts
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";

import { CheckboxField } from "@/components/ui/form/checkbox-field";
import { FormError } from "@/components/ui/form/form-error";
import { NumberFieldComponent } from "@/components/ui/form/number-field";
import { SelectField } from "@/components/ui/form/select-field";
import { SubmitButton } from "@/components/ui/form/submit-button";
import { SwitchField } from "@/components/ui/form/switch-field";
import { TextField } from "@/components/ui/form/text-field";
import { TextareaField } from "@/components/ui/form/textarea-field";

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

export const { useAppForm, withForm } = createFormHook({
  fieldComponents: {
    CheckboxField,
    NumberField: NumberFieldComponent,
    SelectField,
    SwitchField,
    TextareaField,
    TextField,
  },
  fieldContext,
  formComponents: {
    FormError,
    SubmitButton,
  },
  formContext,
});
```

### Barrel Exports

```typescript
// lib/forms/index.ts
export {
  fieldContext,
  formContext,
  useAppForm,
  useFieldContext,
  useFormContext,
  withForm,
} from "./form-hook";
```

### Hook Usage

| Hook              | Purpose                                     | Use In                  |
| ----------------- | ------------------------------------------- | ----------------------- |
| `useAppForm`      | Create form instance with registered fields | Form container          |
| `useFieldContext` | Access field state and handlers             | Field components        |
| `useFormContext`  | Access form state and methods               | Form-level components   |
| `withForm`        | HOC to wrap form components                 | Form component creation |

---

## Field Component Architecture

### Required Structure

Every field component must follow this structure:

```typescript
"use client";

import { useId } from "react";

import { useFieldContext } from "@/lib/forms/form-hook";

import { FieldWrapper, getAriaDescribedBy } from "./field-wrapper";

export function ExampleField({ label, description, ...props }) {
  // 1. Access field context with proper type
  const field = useFieldContext<string>();

  // 2. Generate unique ID
  const id = useId();

  // 3. Create accessibility IDs
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  // 4. Extract error state
  const error = field.state.meta.errors[0];
  const hasError = Boolean(error);

  // 5. Render with FieldWrapper
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
      <input
        aria-describedby={getAriaDescribedBy(
          descriptionId,
          errorId,
          Boolean(description),
          hasError
        )}
        aria-invalid={hasError || undefined}
        id={id}
        name={field.name}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        value={field.state.value ?? ""}
      />
    </FieldWrapper>
  );
}
```

### Field Type Parameters

Always provide the correct type parameter to `useFieldContext`:

```typescript
// String fields (text, textarea, select, email, password, url)
const field = useFieldContext<string>();

// Boolean fields (checkbox, switch)
const field = useFieldContext<boolean>();

// Number fields
const field = useFieldContext<null | number>();
```

---

## FieldWrapper Component

### Purpose

FieldWrapper provides consistent label, description, and error display for form fields:

```typescript
// Usage pattern
<FieldWrapper
  description={description}       // Optional help text
  descriptionId={descriptionId}   // ID for aria-describedby
  error={error}                   // First error message
  errorId={errorId}               // ID for aria-describedby
  label={label}                   // Field label text
  labelFor={id}                   // Associates label with input
  size={size}                     // Size variant (sm, default, lg)
>
  {/* Input element */}
</FieldWrapper>
```

### getAriaDescribedBy Helper

Use this helper to build the `aria-describedby` attribute correctly:

```typescript
import { getAriaDescribedBy } from "./field-wrapper";

// In component
aria-describedby={getAriaDescribedBy(
  descriptionId,     // ID of description element
  errorId,           // ID of error element
  Boolean(description), // Has description?
  hasError           // Has error?
)}
```

The helper prioritizes error over description when both exist.

---

## Accessibility Requirements

### Required ARIA Attributes

Every interactive form element must include:

```typescript
// On the input/interactive element
aria-describedby={getAriaDescribedBy(descriptionId, errorId, hasDescription, hasError)}
aria-invalid={hasError || undefined}
id={id}
name={field.name}
```

### Error Messages

Field-level errors require:

```typescript
<p
  aria-live="polite"
  className={errorVariants({ size })}
  id={errorId}
  role="alert"
>
  {error}
</p>
```

Form-level errors require:

```typescript
<div
  aria-live="assertive"
  role="alert"
>
  {/* Error content */}
</div>
```

### Focus Management

For forms with validation, implement focus management:

```typescript
// Wrap form with FocusProvider
import { FocusProvider } from "@/components/ui/form/focus-management/focus-context";

<FocusProvider>
  <YourForm />
</FocusProvider>

// Or use the HOC
import { withFocusManagement } from "@/components/ui/form/focus-management/with-focus-management";

const FormWithFocus = withFocusManagement(YourFormComponent);
```

---

## CVA Styling Conventions

### Size Variants

All field components must support three size variants:

```typescript
export const inputVariants = cva(`base-styles-here`, {
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
});
```

### Data Attribute Styling

Use Base UI data attributes for state styling:

```typescript
// Disabled state
data-disabled:cursor-not-allowed data-disabled:opacity-50

// Invalid state
data-invalid:border-destructive
data-invalid:focus:ring-destructive

// Checked/unchecked state (checkbox, switch)
data-checked:bg-accent data-checked:border-accent
data-unchecked:bg-transparent data-unchecked:border-border

// Popup state (select)
data-popup-open:ring-2 data-popup-open:ring-accent

// Highlighted state (select items)
data-highlighted:bg-muted
```

### Focus Ring Pattern

Use consistent focus ring styling:

```typescript
// For Base UI components
focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:outline-none

// For native elements
focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none
```

---

## Form State Management

### Subscribe Pattern

Use `form.Subscribe` to access reactive form state:

```typescript
// In SubmitButton
<form.Subscribe selector={(state) => [state.isSubmitting, state.canSubmit]}>
  {([isSubmitting, canSubmit]) => (
    <Button
      aria-busy={isSubmitting || undefined}
      aria-disabled={(!canSubmit || isSubmitting) || undefined}
      disabled={!canSubmit || isSubmitting}
      type="submit"
    >
      {isSubmitting ? "Submitting..." : children}
    </Button>
  )}
</form.Subscribe>

// In FormError
<form.Subscribe selector={(state) => state.errors}>
  {(errors) => {
    if (errors.length === 0) return null;
    return <ErrorDisplay errors={errors} />;
  }}
</form.Subscribe>
```

### Field State Access

Access field state through the field context:

```typescript
const field = useFieldContext<string>();

// Current value
field.state.value;

// Validation errors
field.state.meta.errors[0]; // First error
field.state.meta.errors; // All errors

// Field name
field.name;

// Handlers
field.handleChange(value);
field.handleBlur;
```

---

## Focus Management Utilities

### FocusProvider

Provides context for field registration and error focusing:

```typescript
import { FocusProvider } from "@/components/ui/form/focus-management/focus-context";

export const MyForm = () => (
  <FocusProvider>
    <form>
      {/* form fields */}
    </form>
  </FocusProvider>
);
```

### useFocusManagement Hook

Returns utilities for managing focus:

```typescript
const { focusFirstError, registerField, unregisterField } =
  useFocusManagement();

// Register a field (typically in useEffect)
registerField(fieldName, inputRef);

// Unregister on cleanup
unregisterField(fieldName);

// Focus first field with error
focusFirstError(formApi);
```

### withFocusManagement HOC

Wraps a form component with FocusProvider:

```typescript
import { withFocusManagement } from "@/components/ui/form/focus-management/with-focus-management";

const MyFormComponent = (props) => {
  /* ... */
};

export const MyForm = withFocusManagement(MyFormComponent);
```

---

## Complete Field Component Examples

### TextField

```typescript
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
```

### CheckboxField (Inline Layout)

```typescript
"use client";

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
    focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
    focus-visible:outline-none
    data-checked:border-accent data-checked:bg-accent
    data-checked:text-accent-foreground
    data-disabled:cursor-not-allowed data-disabled:opacity-50
    data-unchecked:border-border data-unchecked:bg-transparent
  `,
  {
    defaultVariants: { size: "default" },
    variants: {
      size: {
        default: "size-4",
        lg: "size-5",
        sm: "size-3.5",
      },
    },
  }
);

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
      <label className="flex items-center gap-2">
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
          <Checkbox.Indicator className="flex data-unchecked:hidden">
            <Check aria-hidden="true" className="size-3" />
          </Checkbox.Indicator>
        </Checkbox.Root>
        <span className={labelVariants({ size })}>{label}</span>
      </label>
      {description && !error && (
        <p className={cn(descriptionVariants({ size }), "pl-6")} id={descriptionId}>
          {description}
        </p>
      )}
      {error && (
        <p
          aria-live="polite"
          className={cn(errorVariants({ size }), "pl-6")}
          id={errorId}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
```

### FormError (Form-Level)

```typescript
"use client";

import { AlertCircle } from "lucide-react";

import { useFormContext } from "@/lib/forms/form-hook";
import { cn } from "@/lib/utils";

type FormErrorProps = ClassName;

export function FormError({ className }: FormErrorProps) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => state.errors}>
      {(errors) => {
        if (errors.length === 0) return null;

        return (
          <div
            aria-live="assertive"
            className={cn(
              `flex items-start gap-2 rounded-md border border-destructive/50
               bg-destructive/10 p-3 text-sm text-destructive`,
              className
            )}
            role="alert"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <div className="flex flex-col gap-1">
              {errors.map((error, index) => (
                <p key={index}>{error}</p>
              ))}
            </div>
          </div>
        );
      }}
    </form.Subscribe>
  );
}
```

---

## Essential Rules Summary

1. **"use client" Directive**: Every field component must have `"use client"` at the top
2. **useFieldContext**: Always call with proper type parameter (`<string>`, `<boolean>`, `<null | number>`)
3. **useId()**: Always use React's `useId()` for generating element IDs
4. **FieldWrapper**: Use for standard vertical layout fields; implement inline for checkbox/switch
5. **getAriaDescribedBy**: Always use this helper for building `aria-describedby`
6. **aria-invalid**: Always include `aria-invalid={hasError || undefined}` on interactive elements
7. **Error Display**: Use `aria-live="polite"` and `role="alert"` for field errors
8. **CVA Variants**: Support sm, default, lg size variants in all field components
9. **Data Attributes**: Use Base UI data attributes for state styling
10. **Focus Rings**: Use consistent focus ring pattern with accent color and offset
11. **Field Registration**: Register form in `fieldComponents` or `formComponents` in hook factory
12. **Barrel Exports**: Export all components and variants from `components/ui/form/index.ts`

---
