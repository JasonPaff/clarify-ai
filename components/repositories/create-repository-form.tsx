'use client';

import { Button } from '@/components/ui/button';
import { useAppForm } from '@/lib/forms/form-hook';
import { type CreateRepositoryFormValues, createRepositorySchema } from '@/lib/validations/repository';

interface CreateRepositoryFormProps {
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: CreateRepositoryFormValues) => Promise<void> | void;
}

export function CreateRepositoryForm({ isSubmitting, onCancel, onSubmit }: CreateRepositoryFormProps) {
  const form = useAppForm({
    defaultValues: {
      name: '',
      path: '',
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validators: {
      onSubmit: createRepositorySchema,
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <div className={'flex flex-col gap-4'}>
        {/* Repository Name Field */}
        <form.AppField name={'name'}>
          {(field) => <field.TextField autoFocus label={'Repository Name'} placeholder={'Enter repository name'} />}
        </form.AppField>

        {/* Repository Path Field */}
        <form.AppField name={'path'}>
          {(field) => (
            <field.PathSelectorField
              description={'Select the folder containing your repository'}
              label={'Repository Path'}
              placeholder={'Select or enter repository path'}
            />
          )}
        </form.AppField>

        {/* Action Buttons */}
        <div className={'mt-2 flex justify-end gap-3'}>
          <Button disabled={isSubmitting} onClick={onCancel} type={'button'} variant={'outline'}>
            Cancel
          </Button>
          <form.AppForm>
            <form.SubmitButton>{isSubmitting ? 'Connecting...' : 'Connect Repository'}</form.SubmitButton>
          </form.AppForm>
        </div>
      </div>
    </form>
  );
}
