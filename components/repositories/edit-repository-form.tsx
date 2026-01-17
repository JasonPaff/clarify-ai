'use client';

import { Button } from '@/components/ui/button';
import { useAppForm } from '@/lib/forms';
import { type UpdateRepositoryFormValues, updateRepositorySchema } from '@/lib/validations/repository';

interface EditRepositoryFormProps {
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: UpdateRepositoryFormValues) => Promise<void> | void;
  repository: {
    id: number;
    name: string;
    path: string;
  };
}

export function EditRepositoryForm({ isSubmitting, onCancel, onSubmit, repository }: EditRepositoryFormProps) {
  const form = useAppForm({
    defaultValues: {
      name: repository.name,
      path: repository.path,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validators: {
      onSubmit: updateRepositorySchema,
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
        {/* Form Fields */}
        <form.AppField name={'name'}>
          {(field) => <field.TextField label={'Repository Name'} placeholder={'Enter repository name'} />}
        </form.AppField>

        <form.AppField name={'path'}>
          {(field) => (
            <field.PathSelectorField
              description={'Local file system path to the repository'}
              label={'Repository Path'}
              placeholder={'Select repository path...'}
            />
          )}
        </form.AppField>

        {/* Action Buttons */}
        <div className={'mt-2 flex justify-end gap-3'}>
          <Button disabled={isSubmitting} onClick={onCancel} type={'button'} variant={'outline'}>
            Cancel
          </Button>
          <form.AppForm>
            <form.SubmitButton>{isSubmitting ? 'Saving...' : 'Save'}</form.SubmitButton>
          </form.AppForm>
        </div>
      </div>
    </form>
  );
}
