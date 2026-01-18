'use client';

import { Button } from '@/components/ui/button';
import { useAppForm } from '@/lib/forms/form-hook';
import { type UpdateProjectFormValues, updateProjectSchema } from '@/lib/validations/project';

interface EditProjectFormProps {
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: UpdateProjectFormValues) => Promise<void> | void;
  project: {
    description: null | string;
    name: string;
  };
}

export function EditProjectForm({ isSubmitting, onCancel, onSubmit, project }: EditProjectFormProps) {
  const form = useAppForm({
    defaultValues: {
      description: project.description ?? '',
      name: project.name,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validators: {
      onSubmit: updateProjectSchema,
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
          {(field) => <field.TextField autoFocus label={'Project Name'} placeholder={'Enter project name'} />}
        </form.AppField>

        <form.AppField name={'description'}>
          {(field) => (
            <field.TextareaField
              description={'Optional description for your project'}
              label={'Description'}
              placeholder={'Describe your project...'}
              rows={4}
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
