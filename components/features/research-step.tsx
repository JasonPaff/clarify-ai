'use client';

import { Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { RepositorySelector } from '@/components/features/repository-selector';
import { Button } from '@/components/ui/button';
import {
  useFeatureRequestRepositories,
  useSetFeatureRequestRepositories,
} from '@/hooks/queries/use-feature-request-repositories';
import { useAppForm } from '@/lib/forms/form-hook';
import { researchStepFormSchema } from '@/lib/validations/feature-request-repositories';

interface ResearchStepProps {
  featureRequestId: number;
  projectId: number;
}

export const ResearchStep = ({ featureRequestId, projectId }: ResearchStepProps) => {
  const [trackedFeatureId, setTrackedFeatureId] = useState(featureRequestId);

  const { data: repositoryIds = [], isPending: isLoading } = useFeatureRequestRepositories(featureRequestId);

  const setRepositories = useSetFeatureRequestRepositories();

  const form = useAppForm({
    defaultValues: {
      repositoryIds: [] as Array<number>,
    },
    validators: {
      onSubmit: researchStepFormSchema,
    },
  });

  // Sync form state with fetched data when it arrives or when the feature request changes
  useEffect(() => {
    if (!isLoading && repositoryIds.length > 0) {
      form.setFieldValue('repositoryIds', repositoryIds);
    }
  }, [form, isLoading, repositoryIds]);

  // Reset form when feature request changes
  if (featureRequestId !== trackedFeatureId) {
    setTrackedFeatureId(featureRequestId);
    form.reset();
  }

  const handleRepositoryChange = useCallback(
    async (newRepositoryIds: Array<number>) => {
      await setRepositories.mutateAsync({
        featureRequestId,
        repositoryIds: newRepositoryIds,
      });
    },
    [featureRequestId, setRepositories]
  );

  const handleStartFileDiscovery = useCallback(() => {
    // TODO: Implement file discovery workflow
    console.log('Starting file discovery for repositories:', form.getFieldValue('repositoryIds'));
  }, [form]);

  const selectedRepositoryIds = form.getFieldValue('repositoryIds') ?? [];
  const hasSelectedRepositories = selectedRepositoryIds.length > 0;
  const isSaving = setRepositories.isPending;

  return (
    <div className={'flex flex-col gap-6'}>
      {/* Repository Selection Section */}
      <div className={'flex flex-col gap-2'}>
        <p className={'text-sm text-muted-foreground'}>
          Select repositories to analyze for file discovery. At least one repository is required to proceed.
        </p>

        <form.AppField
          listeners={{
            onChange: ({ value }) => {
              void handleRepositoryChange(value);
            },
          }}
          name={'repositoryIds'}
        >
          {() => (
            <RepositorySelector
              description={
                hasSelectedRepositories ? `${selectedRepositoryIds.length} repository(ies) selected` : undefined
              }
              isDisabled={isSaving}
              label={'Repositories'}
              projectId={projectId}
            />
          )}
        </form.AppField>
      </div>

      {/* Action Buttons Section */}
      <div className={'flex gap-2'}>
        <Button disabled={!hasSelectedRepositories || isSaving} onClick={handleStartFileDiscovery} variant={'outline'}>
          <Search className={'size-4'} />
          Start File Discovery
        </Button>
      </div>

      {/* Status Section */}
      {isSaving && <p className={'text-xs text-muted-foreground'}>Saving repository selection...</p>}
    </div>
  );
};
