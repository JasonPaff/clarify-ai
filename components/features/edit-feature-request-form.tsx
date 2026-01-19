'use client';

import type { FeatureRequest } from '@/db/schema/feature-requests.schema';
import type { EditFeatureRequestFormValues, FeatureRequestStatus } from '@/lib/validations/feature-request';

import { RepositorySelector } from '@/components/features/repository-selector';
import { Button } from '@/components/ui/button';
import { useAppForm } from '@/lib/forms/form-hook';
import { editFeatureRequestFormSchema, featureRequestStatuses } from '@/lib/validations/feature-request';

interface EditFeatureRequestFormProps {
  featureRequest: Pick<FeatureRequest, 'description' | 'id' | 'status' | 'title'>;
  initialRepositoryIds: Array<number>;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: EditFeatureRequestFormValues) => Promise<void> | void;
  projectId: number;
}

const statusLabels: Record<FeatureRequestStatus, string> = {
  completed: 'Completed',
  draft: 'Draft',
  planning: 'Planning',
  refining: 'Refining',
  researching: 'Researching',
};

const statusOptions = featureRequestStatuses.map((status) => ({
  label: statusLabels[status],
  value: status,
}));

export function EditFeatureRequestForm({
  featureRequest,
  initialRepositoryIds,
  isSubmitting,
  onCancel,
  onSubmit,
  projectId,
}: EditFeatureRequestFormProps) {
  const form = useAppForm({
    defaultValues: {
      description: featureRequest.description ?? '',
      repositoryIds: initialRepositoryIds,
      status: featureRequest.status as FeatureRequestStatus,
      title: featureRequest.title,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validators: {
      onSubmit: editFeatureRequestFormSchema,
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

        {/* Status Field */}
        <form.AppField name={'status'}>
          {(field) => (
            <field.SelectField
              description={'Current workflow status'}
              label={'Status'}
              options={statusOptions}
              placeholder={'Select status'}
            />
          )}
        </form.AppField>

        {/* Repository Selection Field */}
        <form.AppField name={'repositoryIds'}>
          {() => (
            <RepositorySelector
              description={'Select repositories to analyze (optional)'}
              label={'Target Repositories'}
              projectId={projectId}
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
