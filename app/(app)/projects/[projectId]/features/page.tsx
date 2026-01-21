'use client';

import { Lightbulb, Plus, X } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import { withParamValidation } from 'next-typesafe-url/app/hoc';
import { useRouter } from 'next/navigation';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { Fragment, use, useEffect, useMemo, useState } from 'react';

import type { FeatureStatusFilter, PageProps } from '@/app/(app)/projects/[projectId]/features/route-type';
import type { FeatureRequest } from '@/db/schema/feature-requests.schema';

import { featureStatusFilterValues, Route } from '@/app/(app)/projects/[projectId]/features/route-type';
import { QueryErrorBoundary } from '@/components/data/query-error-boundary';
import { DeleteFeatureRequestDialog } from '@/components/features/delete-feature-request-dialog';
import { EditFeatureRequestDialog } from '@/components/features/edit-feature-request-dialog';
import { FeatureRequestCard } from '@/components/features/feature-request-card';
import { FeatureRequestFilterToolbar } from '@/components/features/feature-request-filter-toolbar';
import { NewFeatureRequestDialog } from '@/components/features/new-feature-request-dialog';
import { PageHeader } from '@/components/layout/page-header';
import { FeatureRequestsSkeleton } from '@/components/skeletons/feature-requests-skeleton';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useFeatureRequestRepositories } from '@/hooks/queries/use-feature-request-repositories';
import {
  useArchiveFeatureRequest,
  useFeatureRequests,
  useUnarchiveFeatureRequest,
} from '@/hooks/queries/use-feature-requests';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { useElectronStore } from '@/hooks/useElectron';

type FeaturesPageProps = PageProps;

/** Key for storing the showArchived preference in electron-store */
const SHOW_ARCHIVED_STORE_KEY = 'showArchivedFeatures';

function EditDialogWithData({
  featureRequest,
  onOpenChange,
  projectId,
}: {
  featureRequest: Pick<FeatureRequest, 'description' | 'id' | 'status' | 'title'>;
  onOpenChange: (isOpen: boolean) => void;
  projectId: number;
}) {
  const { data: repositoryIds = [], isLoading } = useFeatureRequestRepositories(featureRequest.id);

  // Wait for repository data to load before showing the dialog
  if (isLoading) {
    return null;
  }

  return (
    <EditFeatureRequestDialog
      featureRequest={featureRequest}
      initialRepositoryIds={repositoryIds}
      onOpenChange={onOpenChange}
      open={true}
      projectId={projectId}
    />
  );
}

function FeaturesContent({
  onClearFilters,
  projectId,
  searchQuery,
  showArchived,
  statusFilter,
}: {
  onClearFilters: () => void;
  projectId: number;
  searchQuery: string;
  showArchived: boolean;
  statusFilter: FeatureStatusFilter;
}) {
  const [editingFeatureRequest, setEditingFeatureRequest] = useState<null | Pick<
    FeatureRequest,
    'description' | 'id' | 'status' | 'title'
  >>(null);
  const [deletingFeatureRequest, setDeletingFeatureRequest] = useState<null | Pick<FeatureRequest, 'id' | 'title'>>(
    null
  );

  const router = useRouter();
  const { data: featureRequests = [], isLoading } = useFeatureRequests(projectId);
  const archiveMutation = useArchiveFeatureRequest();
  const unarchiveMutation = useUnarchiveFeatureRequest();

  // Step 7: Client-side filtering logic
  const filteredFeatureRequests = useMemo(() => {
    return featureRequests.filter((featureRequest) => {
      // Filter by status when not "all"
      if (statusFilter !== 'all' && featureRequest.status !== statusFilter) {
        return false;
      }

      // Filter by search query matching title or description (case-insensitive)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const titleMatch = featureRequest.title.toLowerCase().includes(query);
        const descriptionMatch = featureRequest.description?.toLowerCase().includes(query) ?? false;
        if (!titleMatch && !descriptionMatch) {
          return false;
        }
      }

      // Filter out archived items unless showArchived is true
      if (!showArchived && featureRequest.archivedAt !== null) {
        return false;
      }

      return true;
    });
  }, [featureRequests, statusFilter, searchQuery, showArchived]);

  const handleCardClick = (featureId: number) => {
    router.push(
      $path({
        route: '/projects/[projectId]/features/[featureId]',
        routeParams: { featureId, projectId },
      })
    );
  };

  const handleArchive = (id: number) => {
    archiveMutation.mutate(id);
  };

  const handleUnarchive = (id: number) => {
    unarchiveMutation.mutate(id);
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

  // Show empty state when filters result in no matches
  if (filteredFeatureRequests.length === 0) {
    return (
      <EmptyState
        action={
          <Button onClick={onClearFilters} variant={'outline'}>
            <X className={'size-4'} />
            Clear filters
          </Button>
        }
        description={'Try adjusting your filters or search query to find what you are looking for.'}
        icon={<Lightbulb className={'size-6'} />}
        title={'No matching feature requests'}
      />
    );
  }

  return (
    <Fragment>
      <div className={'flex flex-col gap-4'}>
        {filteredFeatureRequests.map((featureRequest) => (
          <FeatureRequestCard
            archivedAt={featureRequest.archivedAt}
            createdAt={featureRequest.createdAt}
            description={featureRequest.description ?? undefined}
            id={featureRequest.id}
            key={featureRequest.id}
            onArchive={handleArchive}
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
            onUnarchive={handleUnarchive}
            staleSteps={featureRequest.staleSteps}
            status={featureRequest.status}
            title={featureRequest.title}
          />
        ))}
      </div>

      {editingFeatureRequest && (
        <EditDialogWithData
          featureRequest={editingFeatureRequest}
          onOpenChange={(open) => !open && setEditingFeatureRequest(null)}
          projectId={projectId}
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
  const { get: getStoreValue, set: setStoreValue } = useElectronStore();

  // Step 4: URL state management with nuqs
  const [statusFilter, setStatusFilter] = useQueryState(
    'status',
    parseAsStringLiteral(featureStatusFilterValues).withDefault('all')
  );

  const [urlSearchQuery, setUrlSearchQuery] = useQueryState('search', {
    defaultValue: '',
    parse: (value) => value ?? '',
    serialize: (value) => value || '',
  });

  // Step 5: Debounced search - local state for immediate input feedback
  const [localSearchQuery, setLocalSearchQuery] = useState(urlSearchQuery);

  // Debounced callback to update URL after 300ms
  const { cancel: cancelDebouncedSearch, debounced: debouncedSetUrlSearch } = useDebouncedCallback(
    (value: string) => {
      void setUrlSearchQuery(value || null);
    },
    { delay: 300 }
  );

  // Sync local state when URL changes (e.g., browser back/forward)
  useEffect(() => {
    setLocalSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  // Handle search input change - update local state immediately, debounce URL update
  const handleSearchChange = (value: string) => {
    setLocalSearchQuery(value);
    debouncedSetUrlSearch(value);
  };

  // Step 6: Archive toggle persistence with Electron store
  const [showArchived, setShowArchived] = useState(false);
  const [isArchivePreferenceLoaded, setIsArchivePreferenceLoaded] = useState(false);

  // Load showArchived preference from electron-store on mount
  useEffect(() => {
    const loadArchivePreference = async () => {
      const storedValue = await getStoreValue<boolean>(SHOW_ARCHIVED_STORE_KEY);
      if (storedValue !== undefined) {
        setShowArchived(storedValue);
      }
      setIsArchivePreferenceLoaded(true);
    };
    void loadArchivePreference();
  }, [getStoreValue]);

  // Handler to update showArchived and persist to electron-store
  const handleShowArchivedChange = (value: boolean) => {
    setShowArchived(value);
    void setStoreValue(SHOW_ARCHIVED_STORE_KEY, value);
  };

  // Handler for status filter change - convert undefined to 'all'
  const handleStatusChange = (status: FeatureStatusFilter | undefined) => {
    void setStatusFilter(status ?? 'all');
  };

  // Handler to clear all filters and reset to default state
  const handleClearFilters = () => {
    // Cancel any pending debounced search update to prevent it from reapplying old search
    cancelDebouncedSearch();
    void setStatusFilter('all');
    setLocalSearchQuery('');
    void setUrlSearchQuery(null);
  };

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

      {/* Filter Toolbar */}
      <FeatureRequestFilterToolbar
        className={'mb-6'}
        isShowArchived={showArchived}
        onSearchChange={handleSearchChange}
        onShowArchivedChange={handleShowArchivedChange}
        onStatusChange={handleStatusChange}
        search={localSearchQuery}
        status={statusFilter === 'all' ? undefined : statusFilter}
      />

      <QueryErrorBoundary>
        {isArchivePreferenceLoaded && (
          <FeaturesContent
            onClearFilters={handleClearFilters}
            projectId={projectId}
            searchQuery={localSearchQuery}
            showArchived={showArchived}
            statusFilter={statusFilter}
          />
        )}
      </QueryErrorBoundary>
    </Fragment>
  );
}

export default withParamValidation(FeaturesPage, Route);
