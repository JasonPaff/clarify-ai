'use client';

import { Input } from '@base-ui/react/input';
import { type VariantProps } from 'class-variance-authority';
import { FolderOpen } from 'lucide-react';
import { useId } from 'react';

import { Button } from '@/components/ui/button';
import { FieldWrapper, getAriaDescribedBy } from '@/components/ui/form/field-wrapper';
import { inputVariants } from '@/components/ui/form/text-field';
import { useElectronDialog } from '@/hooks/useElectron';
import { useFieldContext } from '@/lib/forms/form-hook';
import { cn } from '@/lib/utils';

type PathSelectorFieldProps = ClassName &
  VariantProps<typeof inputVariants> & {
    description?: string;
    disabled?: boolean;
    label: string;
    placeholder?: string;
  };

export function PathSelectorField({
  className,
  description,
  disabled,
  label,
  placeholder,
  size,
}: PathSelectorFieldProps) {
  const field = useFieldContext<string>();
  const { openDirectory } = useElectronDialog();
  const id = useId();

  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const error = field.state.meta.errors[0];
  const _hasError = Boolean(error);

  const handleBrowseClick = async () => {
    const selectedPath = await openDirectory();
    if (selectedPath) {
      field.handleChange(selectedPath);
    }
  };

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
      {/* Path Input with Browse Button */}
      <div className={'flex gap-2'}>
        <Input
          aria-describedby={getAriaDescribedBy(descriptionId, errorId, Boolean(description), _hasError)}
          aria-invalid={_hasError || undefined}
          className={cn(inputVariants({ size }), 'grow', className)}
          disabled={disabled}
          id={id}
          name={field.name}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          placeholder={placeholder}
          type={'text'}
          value={field.state.value ?? ''}
        />
        <Button
          aria-label={'Browse for folder'}
          disabled={disabled}
          onClick={handleBrowseClick}
          size={'icon'}
          type={'button'}
          variant={'outline'}
        >
          <FolderOpen className={'size-4'} />
        </Button>
      </div>
    </FieldWrapper>
  );
}
