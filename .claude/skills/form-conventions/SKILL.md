---
name: form-conventions
description: Enforces project TanStack React Form conventions automatically when creating or modifying forms, field components, or form validation logic. This skill should be used proactively whenever working with forms to ensure consistent patterns across the codebase.
---

# Form Conventions Enforcer

## Purpose

This skill enforces the project TanStack React Form conventions automatically during form development. It ensures consistent form hook usage, field component architecture, accessibility patterns, and adherence to project-specific standards for all form work.

## When to Use This Skill

Use this skill proactively in the following scenarios:

- Creating new form components
- Adding new field components
- Implementing form validation
- Working with form state management
- Setting up focus management for forms
- Working with files in `components/ui/form/` or `lib/forms/`
- Any task involving `@tanstack/react-form` usage

**Important**: This skill should activate automatically without explicit user request whenever form work is detected.

## How to Use This Skill

### 1. Load Conventions Reference

Before creating or modifying any form code, load the complete conventions document:

```
Read references/Form-Conventions.md
```

This reference contains the authoritative standards including:

- Form hook factory patterns with `createFormHook`
- Field component architecture and required patterns
- FieldWrapper usage and accessibility helpers
- ARIA attribute requirements
- CVA styling conventions with size variants
- Form state management with Subscribe patterns
- Focus management utilities

### 2. Apply Conventions During Development

When writing form code, ensure strict adherence to all conventions:

**Form Hook Factory**:

- Use `useAppForm` from `lib/forms/form-hook` for all forms
- Use `useFieldContext<T>()` in field components with proper type parameter
- Use `useFormContext` in form-level components like FormError and SubmitButton

**Field Components**:

- Always add `"use client"` directive
- Always call `useFieldContext<T>()` with appropriate type
- Always use `useId()` for generating element IDs
- Always wrap with FieldWrapper or implement error/description display
- Always use `getAriaDescribedBy` helper for accessibility

**Accessibility**:

- Always include `aria-invalid={hasError || undefined}` on interactive elements
- Always include `aria-describedby` using the helper function
- Always add `aria-live="polite"` and `role="alert"` on error messages
- Use `aria-live="assertive"` for form-level errors

**Styling**:

- Use CVA with size variants (sm, default, lg)
- Use data attributes for state styling (data-invalid, data-disabled, data-checked)
- Use focus ring patterns: `focus:ring-2 focus:ring-accent focus:ring-offset-2`

### 3. Automatic Convention Enforcement

After generating or modifying form code, immediately perform automatic validation and correction:

1. **Scan for violations**: Review the generated code against all conventions from the reference document
2. **Identify issues**: Create a mental checklist of any violations found:
   - Form hook usage
   - Field context typing
   - Missing `useId()` calls
   - Missing FieldWrapper or error display
   - Missing ARIA attributes
   - Missing `"use client"` directive
   - CVA variant structure

3. **Fix automatically**: Apply corrections immediately without asking for permission:
   - Add missing `"use client"` directive
   - Add proper field context typing
   - Add `useId()` for element IDs
   - Add FieldWrapper with proper props
   - Add all required ARIA attributes
   - Fix CVA variant structure

4. **Verify completeness**: Ensure all conventions are satisfied before presenting code to user

### 4. Reporting

After automatically fixing violations, provide a brief summary:

```
Form conventions enforced:
  - Added "use client" directive
  - Added useFieldContext<string>() with proper type
  - Added useId() for element ID generation
  - Added FieldWrapper with description and error support
  - Added aria-describedby using getAriaDescribedBy helper
  - Added aria-invalid for error state indication
```

**Do not ask for permission to apply fixes** - the skill's purpose is automatic enforcement.

## Convention Categories

The complete conventions are detailed in `references/Form-Conventions.md`. Key categories include:

1. **Form Hook Factory** - createFormHook, useAppForm, useFieldContext, useFormContext
2. **Field Components** - Structure, required hooks, FieldWrapper usage
3. **Accessibility** - ARIA attributes, focus management, error announcements
4. **CVA Styling** - Size variants, data attributes, focus rings
5. **Form State** - Subscribe patterns, field state access
6. **Focus Management** - FocusProvider, registerField, focusFirstError
7. **Error Handling** - Field errors, form-level errors, error display

## Important Notes

- **Automatic enforcement**: Apply fixes immediately without requesting permission
- **No compromises**: All conventions must be followed strictly
- **Reference first**: Always load the conventions reference before working with form code
- **Complete validation**: Check all aspects of the conventions, not just obvious violations
- **Proactive application**: Use this skill automatically when form work is detected, even if user doesn't mention conventions

## Workflow Summary

```
1. Detect form work (forms, fields, validation, form state)
2. Load references/Form-Conventions.md
3. Generate or modify code following all conventions
4. Scan generated code for any violations
5. Automatically fix all violations found
6. Present corrected code to user with brief summary of fixes applied
```

This workflow ensures every form implementation in the project maintains consistent, high-quality patterns that follow all established conventions.
