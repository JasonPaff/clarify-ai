'use client';

import { type VariantProps } from 'class-variance-authority';

import { Button, buttonVariants } from '@/components/ui/button';
import { useFormContext } from '@/lib/forms/form-hook';
import { cn } from '@/lib/utils';

type SubmitButtonProps = ClassName & RequiredChildren & VariantProps<typeof buttonVariants>;

export function SubmitButton({ children, className, size, variant }: SubmitButtonProps) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => [state.isSubmitting, state.canSubmit]}>
      {([isSubmitting, canSubmit]) => (
        <Button
          aria-busy={isSubmitting || undefined}
          aria-disabled={!canSubmit || isSubmitting || undefined}
          className={cn(className)}
          disabled={!canSubmit || isSubmitting}
          size={size}
          type={'submit'}
          variant={variant}
        >
          {isSubmitting ? 'Submitting...' : children}
        </Button>
      )}
    </form.Subscribe>
  );
}
