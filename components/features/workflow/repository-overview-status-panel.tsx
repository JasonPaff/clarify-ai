'use client';

import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, AlertTriangle, CheckCircle, Clock, Loader2, RefreshCw } from 'lucide-react';
import { useMemo } from 'react';

import type { RepositoryOverviewStatus } from '@/hooks/queries/use-repository-overviews';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRepositories } from '@/hooks/queries/use-repositories';
import { useRepositoryOverviewStatuses } from '@/hooks/queries/use-repository-overviews';
import { cn } from '@/lib/utils';

/**
 * Props for a single repository status item.
 */
interface RepositoryStatusItemProps extends ClassName {
  /** Whether the overview status is loading */
  isLoading: boolean;
  /** Callback to regenerate the overview */
  onRegenerate: (repositoryId: number) => void;
  /** The overview status for this repository */
  overviewStatus: RepositoryOverviewStatus | undefined;
  /** Repository ID */
  repositoryId: number;
  /** Repository name */
  repositoryName: string;
  /** Repository path */
  repositoryPath: string;
}

/**
 * Displays the status of a single repository's overview.
 */
const RepositoryStatusItem = ({
  className,
  isLoading,
  onRegenerate,
  overviewStatus,
  repositoryId,
  repositoryName,
  repositoryPath,
}: RepositoryStatusItemProps) => {
  const parseSqliteTimestamp = (value: string) => new Date(value.endsWith('Z') ? value : `${value}Z`);
  const hasOverview = overviewStatus?.hasOverview ?? false;
  const generatedAt = overviewStatus?.generatedAt;
  const modelId = overviewStatus?.modelId;
  const isImported = modelId === 'imported';
  const isModelGenerated = modelId && !isImported;

  const handleRegenerateClick = () => {
    onRegenerate(repositoryId);
  };

  // Truncate path to show only last 2 segments
  const pathSegments = repositoryPath.split(/[/\\]/);
  const truncatedPath = pathSegments.length > 2 ? `.../${pathSegments.slice(-2).join('/')}` : repositoryPath;

  // Format the generated date
  const formattedGeneratedAt = useMemo(() => {
    if (!generatedAt) return null;
    return formatDistanceToNow(parseSqliteTimestamp(generatedAt), { addSuffix: true });
  }, [generatedAt]);

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2',
        className
      )}
    >
      {/* Repository Info */}
      <div className={'flex min-w-0 flex-1 items-center gap-3'}>
        {/* Status Indicator */}
        {isLoading ? (
          <Loader2 className={'size-4 shrink-0 animate-spin text-muted-foreground'} />
        ) : hasOverview ? (
          <CheckCircle className={'size-4 shrink-0 text-green-600 dark:text-green-400'} />
        ) : (
          <AlertCircle className={'size-4 shrink-0 text-amber-600 dark:text-amber-400'} />
        )}

        {/* Name and Path */}
        <div className={'min-w-0 flex-1'}>
          <p className={'truncate text-sm font-medium'}>{repositoryName}</p>
          <p className={'truncate text-xs text-muted-foreground'} title={repositoryPath}>
            {truncatedPath}
          </p>
        </div>
      </div>

      {/* Metadata and Actions */}
      <div className={'flex shrink-0 items-center gap-2'}>
        {/* Generation Metadata */}
        {hasOverview && !isLoading && (
          <div className={'hidden flex-col items-end gap-0.5 text-right sm:flex'}>
            {formattedGeneratedAt && (
              <span className={'flex items-center gap-1 text-xs text-muted-foreground'}>
                <Clock className={'size-3'} />
                {formattedGeneratedAt}
              </span>
            )}
            {isModelGenerated && (
              <Badge className={'max-w-24 truncate'} size={'sm'} variant={'default'}>
                {modelId}
              </Badge>
            )}
            {isImported && (
              <Badge size={'sm'} variant={'default'}>
                Imported
              </Badge>
            )}
          </div>
        )}

        {/* Status Badge for No Overview */}
        {!hasOverview && !isLoading && (
          <Badge className={'shrink-0'} size={'sm'} variant={'draft'}>
            No Overview
          </Badge>
        )}

        {/* Regenerate Button */}
        <Button
          aria-label={`Regenerate overview for ${repositoryName}`}
          disabled={isLoading}
          onClick={handleRegenerateClick}
          size={'sm'}
          variant={'ghost'}
        >
          <RefreshCw className={'size-3.5'} />
          <span className={'hidden sm:inline'}>{hasOverview ? 'Regenerate' : 'Generate'}</span>
        </Button>
      </div>
    </div>
  );
};

/**
 * Skeleton loading state for a repository status item.
 */
const RepositoryStatusItemSkeleton = () => {
  return (
    <div className={'flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2'}>
      {/* Status and Info Skeleton */}
      <div className={'flex min-w-0 flex-1 items-center gap-3'}>
        <div className={'size-4 shrink-0 animate-pulse rounded-full bg-muted'} />
        <div className={'min-w-0 flex-1 space-y-1.5'}>
          <div className={'h-4 w-32 animate-pulse rounded-sm bg-muted'} />
          <div className={'h-3 w-48 animate-pulse rounded-sm bg-muted'} />
        </div>
      </div>

      {/* Actions Skeleton */}
      <div className={'flex shrink-0 items-center gap-2'}>
        <div className={'h-8 w-20 animate-pulse rounded-sm bg-muted'} />
      </div>
    </div>
  );
};

interface RepositoryOverviewStatusPanelProps extends ClassName {
  /** Callback when a repository overview should be regenerated */
  onRegenerate?: (repositoryId: number) => void;
  /** The project ID to fetch repositories for */
  projectId: number;
  /** Array of repository IDs to display status for */
  repositoryIds: Array<number>;
}

/**
 * Displays overview generation status for selected repositories.
 * Shows status indicators, generation metadata, and regenerate actions.
 */
export const RepositoryOverviewStatusPanel = ({
  className,
  onRegenerate,
  projectId,
  repositoryIds,
}: RepositoryOverviewStatusPanelProps) => {
  const {
    data: repositories,
    isError: isRepositoriesError,
    isPending: isRepositoriesPending,
  } = useRepositories(projectId);
  const {
    data: overviewStatusMap,
    isError: isOverviewsError,
    isPending: isOverviewsPending,
  } = useRepositoryOverviewStatuses(repositoryIds);

  const isPending = isRepositoriesPending || isOverviewsPending;
  const isError = isRepositoriesError || isOverviewsError;

  // Filter repositories to only show selected ones
  const selectedRepositories = useMemo(() => {
    if (!repositories) return [];
    return repositories.filter((repo) => repositoryIds.includes(repo.id));
  }, [repositories, repositoryIds]);

  const handleRegenerate = (repositoryId: number) => {
    onRegenerate?.(repositoryId);
  };

  const hasNoRepositories = repositoryIds.length === 0;

  // Empty state
  if (hasNoRepositories) {
    return (
      <div className={cn('rounded-md border border-border bg-muted/30 p-4 text-center', className)}>
        <p className={'text-sm text-muted-foreground'}>No repositories selected</p>
      </div>
    );
  }

  // Error state
  if (isError && !isPending) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-md border border-destructive/50 bg-destructive/5 p-4',
          className
        )}
      >
        <AlertTriangle className={'size-5 shrink-0 text-destructive'} />
        <div className={'flex-1'}>
          <p className={'text-sm font-medium text-destructive'}>Failed to load repository overviews</p>
          <p className={'mt-0.5 text-xs text-muted-foreground'}>
            Repository context may not be available for AI planning. Try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  // Loading skeleton
  if (isPending && selectedRepositories.length === 0) {
    return (
      <div className={cn('space-y-2', className)}>
        {repositoryIds.map((id) => (
          <RepositoryStatusItemSkeleton key={id} />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {selectedRepositories.map((repository) => (
        <RepositoryStatusItem
          isLoading={isOverviewsPending}
          key={repository.id}
          onRegenerate={handleRegenerate}
          overviewStatus={overviewStatusMap.get(repository.id)}
          repositoryId={repository.id}
          repositoryName={repository.name}
          repositoryPath={repository.path}
        />
      ))}
    </div>
  );
};
