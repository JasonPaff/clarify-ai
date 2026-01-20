'use client';

import { GitBranch, Plus } from 'lucide-react';
import { withParamValidation } from 'next-typesafe-url/app/hoc';
import { Fragment, use, useState } from 'react';

import type { Repository } from '@/db/schema/repositories.schema';

import { PageProps, Route } from '@/app/(app)/projects/[projectId]/repositories/route-type';
import { QueryErrorBoundary } from '@/components/data/query-error-boundary';
import { PageHeader } from '@/components/layout/page-header';
import { DeleteRepositoryDialog } from '@/components/repositories/delete-repository-dialog';
import { EditRepositoryDialog } from '@/components/repositories/edit-repository-dialog';
import { NewRepositoryDialog } from '@/components/repositories/new-repository-dialog';
import { RepositoryCard } from '@/components/repositories/repository-card';
import { RepositoriesSkeleton } from '@/components/skeletons/repositories-skeleton';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useRepositoriesWithOverviewStatus } from '@/hooks/queries/use-repositories';

type RepositoriesPageProps = PageProps;

function RepositoriesContent({ projectId }: { projectId: number }) {
  const [editingRepository, setEditingRepository] = useState<null | Pick<Repository, 'id' | 'name' | 'path'>>(null);
  const [deletingRepository, setDeletingRepository] = useState<null | Pick<Repository, 'id' | 'name'>>(null);

  const { data: repositories, isPending } = useRepositoriesWithOverviewStatus(projectId);

  if (isPending) {
    return <RepositoriesSkeleton />;
  }

  const isEmpty = !isPending && repositories.length === 0;

  if (isEmpty) {
    return (
      <EmptyState
        action={
          <NewRepositoryDialog projectId={projectId}>
            <Button>
              <Plus className={'size-4'} />
              Connect your first repository
            </Button>
          </NewRepositoryDialog>
        }
        description={'Connect repositories to provide context for AI-powered implementation planning.'}
        icon={<GitBranch className={'size-6'} />}
        title={'No repositories connected'}
      />
    );
  }

  return (
    <Fragment>
      <div className={'flex flex-col gap-4'}>
        {repositories.map((repository) => (
          <RepositoryCard
            fileCount={repository.fileCount}
            id={repository.id}
            key={repository.id}
            lastScannedAt={repository.lastScannedAt}
            name={repository.name}
            onDelete={() => setDeletingRepository({ id: repository.id, name: repository.name })}
            onEdit={() => setEditingRepository({ id: repository.id, name: repository.name, path: repository.path })}
            overviewStatus={repository.overviewStatus}
            path={repository.path}
            projectId={projectId}
          />
        ))}
      </div>

      {editingRepository && (
        <EditRepositoryDialog
          onOpenChange={(open) => !open && setEditingRepository(null)}
          open={true}
          repository={editingRepository}
        />
      )}

      {deletingRepository && (
        <DeleteRepositoryDialog
          onOpenChange={(open) => !open && setDeletingRepository(null)}
          open={true}
          repository={deletingRepository}
        />
      )}
    </Fragment>
  );
}

function RepositoriesPage({ routeParams }: RepositoriesPageProps) {
  const { projectId } = use(routeParams);

  return (
    <Fragment>
      <PageHeader
        action={
          <NewRepositoryDialog projectId={projectId}>
            <Button>
              <Plus className={'size-4'} />
              Connect Repository
            </Button>
          </NewRepositoryDialog>
        }
        description={'Connect local repositories to provide context for AI-powered implementation planning.'}
        title={'Repositories'}
      />

      <QueryErrorBoundary>
        <RepositoriesContent projectId={projectId} />
      </QueryErrorBoundary>
    </Fragment>
  );
}

export default withParamValidation(RepositoriesPage, Route);
