'use client';

import type { VariantProps } from 'class-variance-authority';

import { Field } from '@base-ui/react/field';
import { FolderOpen } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { descriptionVariants, errorVariants, labelVariants } from '@/components/ui/form/field-wrapper';
import { TanStackFieldRoot } from '@/components/ui/form/tanstack-field-root';
import { Input, inputVariants } from '@/components/ui/input';
import { useElectronDialog } from '@/hooks/useElectron';
import { useFieldContext } from '@/lib/forms/form-hook';
import { cn } from '@/lib/utils';

type PathSelectorFieldProps = ClassName &
  VariantProps<typeof inputVariants> & {
    description?: string;
    isDisabled?: boolean;
    label: string;
    placeholder?: string;
  };

export const PathSelectorField = ({
  className,
  description,
  isDisabled,
  label,
  placeholder,
  size,
}: PathSelectorFieldProps) => {
  const field = useFieldContext<string>();
  const { openDirectory } = useElectronDialog();

  const error = field.state.meta.errors[0]?.message;
  const hasError = Boolean(error);

  const handleBrowseClick = async () => {
    const selectedPath = await openDirectory();
    if (selectedPath) {
      field.handleChange(selectedPath);
    }
  };

  return (
    <TanStackFieldRoot
      className={className}
      isDirty={field.state.meta.isDirty}
      isDisabled={isDisabled}
      isInvalid={hasError}
      isTouched={field.state.meta.isTouched}
      name={field.name}
      size={size}
    >
      {/* Label */}
      <Field.Label className={labelVariants({ size })}>{label}</Field.Label>

      {/* Path Input with Browse Button */}
      <div className={'flex gap-2'}>
        <Input
          className={cn('grow')}
          disabled={isDisabled}
          isInvalid={hasError}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          placeholder={placeholder}
          size={size}
          type={'text'}
          value={field.state.value ?? ''}
        />
        <Button
          aria-label={'Browse for folder'}
          disabled={isDisabled}
          onClick={handleBrowseClick}
          size={'icon'}
          type={'button'}
          variant={'outline'}
        >
          <FolderOpen className={'size-4'} />
        </Button>
      </div>

      {/* Description */}
      {description && !hasError && (
        <Field.Description className={descriptionVariants({ size })}>{description}</Field.Description>
      )}

      {/* Error */}
      {hasError && (
        <Field.Error className={errorVariants({ size })} match={true}>
          {error}
        </Field.Error>
      )}
    </TanStackFieldRoot>
  );
};
