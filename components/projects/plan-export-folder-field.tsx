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

type PlanExportFolderFieldProps = ClassName &
  VariantProps<typeof inputVariants> & {
    description?: string;
    isDisabled?: boolean;
    label: string;
    placeholder?: string;
  };

export const PlanExportFolderField = ({
  className,
  description,
  isDisabled,
  label,
  placeholder = 'Select a folder for plan exports...',
  size,
}: PlanExportFolderFieldProps) => {
  const field = useFieldContext<string>();
  const { openDirectory } = useElectronDialog();

  const error = field.state.meta.errors[0]?.message;
  const hasError = Boolean(error);
  const hasValue = Boolean(field.state.value);

  const handleBrowseClick = async () => {
    const selectedPath = await openDirectory();
    if (selectedPath) {
      field.handleChange(selectedPath);
    }
  };

  const handleClearClick = () => {
    field.handleChange('');
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

      {/* Folder Input with Browse Button */}
      <div className={'flex gap-2'}>
        <Input
          className={cn('grow', !hasValue && 'text-muted-foreground')}
          disabled={isDisabled}
          isInvalid={hasError}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          placeholder={placeholder}
          readOnly
          size={size}
          type={'text'}
          value={field.state.value ?? ''}
        />
        {hasValue && (
          <Button
            aria-label={'Clear folder selection'}
            disabled={isDisabled}
            onClick={handleClearClick}
            size={'icon'}
            type={'button'}
            variant={'ghost'}
          >
            <span className={'text-lg leading-none'}>&times;</span>
          </Button>
        )}
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
