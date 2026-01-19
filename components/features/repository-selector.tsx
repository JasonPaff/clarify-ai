'use client';

import { useMemo } from 'react';

import { MultiSelectField } from '@/components/ui/form/multi-select-field';
import { useRepositories } from '@/hooks/queries/use-repositories';

interface RepositorySelectorProps {
  description?: string;
  isDisabled?: boolean;
  label?: string;
  projectId: number;
}

/**
 * Repository selector component that wraps MultiSelectField with repository data fetching.
 * This component should be used within a form.AppField render function.
 *
 * @example
 * ```tsx
 * <form.AppField name={'repositoryIds'}>
 *   {() => <RepositorySelector label={'Repositories'} projectId={projectId} />}
 * </form.AppField>
 * ```
 */
export const RepositorySelector = ({
  description,
  isDisabled,
  label = 'Repositories',
  projectId,
}: RepositorySelectorProps) => {
  const { data: repositories, isPending } = useRepositories(projectId);

  const options = useMemo(() => {
    if (!repositories) return [];

    return repositories.map((repository) => ({
      label: repository.name,
      value: repository.id,
    }));
  }, [repositories]);

  const hasNoRepositories = !isPending && options.length === 0;

  const descriptionDisplay = hasNoRepositories
    ? 'No repositories found for this project. Add repositories in project settings.'
    : description;

  return (
    <MultiSelectField
      description={descriptionDisplay}
      isDisabled={isDisabled || isPending || hasNoRepositories}
      label={label}
      options={options}
    />
  );
};
