'use client';

import { Lightbulb, Plus } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import { withParamValidation } from 'next-typesafe-url/app/hoc';
import { useRouter } from 'next/navigation';
import { Fragment, use, useState } from 'react';

import type { PageProps } from '@/app/(app)/projects/[projectId]/features/route-type';
import type { FeatureRequest } from '@/db/schema/feature-requests.schema';

import { Route } from '@/app/(app)/projects/[projectId]/features/route-type';
import { QueryErrorBoundary } from '@/components/data/query-error-boundary';
import { DeleteFeatureRequestDialog } from '@/components/features/delete-feature-request-dialog';
import { EditFeatureRequestDialog } from '@/components/features/edit-feature-request-dialog';
import { FeatureRequestCard } from '@/components/features/feature-request-card';
import { NewFeatureRequestDialog } from '@/components/features/new-feature-request-dialog';
import { PageHeader } from '@/components/layout/page-header';
import { FeatureRequestsSkeleton } from '@/components/skeletons/feature-requests-skeleton';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useFeatureRequests } from '@/hooks/queries/use-feature-requests';

type FeaturesPageProps = PageProps;

function FeaturesContent({ projectId }: { projectId: number }) {
  const [editingFeatureRequest, setEditingFeatureRequest] = useState<null | Pick<
    FeatureRequest,
    'description' | 'id' | 'status' | 'title'
  >>(null);
  const [deletingFeatureRequest, setDeletingFeatureRequest] = useState<null | Pick<FeatureRequest, 'id' | 'title'>>(
    null
  );

  const router = useRouter();
  const { data: featureRequests = [], isLoading } = useFeatureRequests(projectId);

  const handleCardClick = (featureId: number) => {
    router.push(
      $path({
        route: '/projects/[projectId]/features/[featureId]',
        routeParams: { featureId, projectId },
      })
    );
  };

  if (isLoading) {
    return <FeatureRequestsSkeleton />;
  }

  if (!isLoading && featureRequests.length === 0) {
    return (
      <EmptyState
        action={
          <NewFeatureRequestDialog projectId={projectId}>
            <Button>
              <Plus className={'size-4'} />
              Create your first feature request
            </Button>
          </NewFeatureRequestDialog>
        }
        description={'Feature requests help you plan and track implementation ideas for this project.'}
        icon={<Lightbulb className={'size-6'} />}
        title={'No feature requests yet'}
      />
    );
  }

  return (
    <Fragment>
      <div className={'flex flex-col gap-4'}>
        {featureRequests.map((featureRequest) => (
          <FeatureRequestCard
            createdAt={featureRequest.createdAt}
            description={featureRequest.description ?? undefined}
            key={featureRequest.id}
            onClick={() => handleCardClick(featureRequest.id)}
            onDelete={() => setDeletingFeatureRequest({ id: featureRequest.id, title: featureRequest.title })}
            onEdit={() =>
              setEditingFeatureRequest({
                description: featureRequest.description,
                id: featureRequest.id,
                status: featureRequest.status,
                title: featureRequest.title,
              })
            }
            status={featureRequest.status}
            title={featureRequest.title}
          />
        ))}
      </div>

      {editingFeatureRequest && (
        <EditFeatureRequestDialog
          featureRequest={editingFeatureRequest}
          onOpenChange={(open) => !open && setEditingFeatureRequest(null)}
          open={true}
        />
      )}

      {deletingFeatureRequest && (
        <DeleteFeatureRequestDialog
          featureRequest={deletingFeatureRequest}
          onOpenChange={(open) => !open && setDeletingFeatureRequest(null)}
          open={true}
        />
      )}
    </Fragment>
  );
}

function FeaturesPage({ routeParams }: FeaturesPageProps) {
  const { projectId } = use(routeParams);

  return (
    <Fragment>
      <PageHeader
        action={
          <NewFeatureRequestDialog projectId={projectId}>
            <Button>
              <Plus className={'size-4'} />
              New Feature Request
            </Button>
          </NewFeatureRequestDialog>
        }
        description={'Create and manage feature requests to transform into actionable implementation plans.'}
        title={'Feature Requests'}
      />

      <QueryErrorBoundary>
        <FeaturesContent projectId={projectId} />
      </QueryErrorBoundary>
    </Fragment>
  );
}

export default withParamValidation(FeaturesPage, Route);
