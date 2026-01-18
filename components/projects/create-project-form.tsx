'use client';

import type { CreateProjectFormValues } from '@/lib/validations/project';

import { Button } from '@/components/ui/button';
import { useAppForm } from '@/lib/forms/form-hook';
import { createProjectSchema } from '@/lib/validations/project';

interface CreateProjectFormProps {
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: CreateProjectFormValues) => Promise<void> | void;
}

export function CreateProjectForm({ isSubmitting, onCancel, onSubmit }: CreateProjectFormProps) {
  const form = useAppForm({
    defaultValues: {
      description: '',
      name: '',
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validators: {
      onSubmit: createProjectSchema,
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
      <form.AppForm>
        <div className={'flex flex-col gap-4'}>
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

          <div className={'mt-2 flex justify-end gap-3'}>
            <Button disabled={isSubmitting} onClick={onCancel} type={'button'} variant={'outline'}>
              Cancel
            </Button>
            <form.SubmitButton>{isSubmitting ? 'Creating...' : 'Create Project'}</form.SubmitButton>
          </div>
        </div>
      </form.AppForm>
    </form>
  );
}
