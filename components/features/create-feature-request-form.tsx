'use client';

import type { CreateFeatureRequestFormValues } from '@/lib/validations/feature-request';

import { Button } from '@/components/ui/button';
import { useAppForm } from '@/lib/forms/form-hook';
import { createFeatureRequestSchema } from '@/lib/validations/feature-request';

interface CreateFeatureRequestFormProps {
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: CreateFeatureRequestFormValues) => Promise<void> | void;
}

export function CreateFeatureRequestForm({ isSubmitting, onCancel, onSubmit }: CreateFeatureRequestFormProps) {
  const form = useAppForm({
    defaultValues: {
      description: '',
      title: '',
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validators: {
      onSubmit: createFeatureRequestSchema,
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
        {/* Title Field */}
        <form.AppField name={'title'}>
          {(field) => (
            <field.TextField autoFocus label={'Title'} placeholder={'Enter a title for your feature request'} />
          )}
        </form.AppField>

        {/* Description Field */}
        <form.AppField name={'description'}>
          {(field) => (
            <field.TextareaField
              description={'Describe what you want to build or change'}
              label={'Description'}
              placeholder={'Describe your feature request...'}
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
            <form.SubmitButton>{isSubmitting ? 'Creating...' : 'Create Feature Request'}</form.SubmitButton>
          </form.AppForm>
        </div>
      </div>
    </form>
  );
}
