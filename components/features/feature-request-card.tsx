'use client';

import type { VariantProps } from 'class-variance-authority';
import type { MouseEvent } from 'react';

import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, Archive, ArchiveRestore, Lightbulb, Pencil, Trash2 } from 'lucide-react';

import type { FeatureRequest } from '@/db/schema/feature-requests.schema';

import { Badge, badgeVariants } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';
import { cn } from '@/lib/utils';

type FeatureRequestStatus = 'clarifying' | 'completed' | 'describing' | 'draft' | 'failed' | 'planning' | 'researching';

const statusLabels: Record<FeatureRequestStatus, string> = {
  clarifying: 'Clarifying',
  completed: 'Completed',
  describing: 'Describing',
  draft: 'Draft',
  failed: 'Failed',
  planning: 'Planning',
  researching: 'Researching',
};

const statusVariantMap: Record<FeatureRequestStatus, VariantProps<typeof badgeVariants>['variant']> = {
  clarifying: 'clarifying',
  completed: 'completed',
  describing: 'describing',
  draft: 'draft',
  failed: 'failed',
  planning: 'planning',
  researching: 'researching',
};

interface FeatureRequestCardProps {
  archivedAt?: FeatureRequest['archivedAt'];
  createdAt: FeatureRequest['createdAt'];
  description?: FeatureRequest['description'];
  id: FeatureRequest['id'];
  onArchive?: (id: number) => void;
  onClick?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onUnarchive?: (id: number) => void;
  staleSteps?: null | string;
  status: FeatureRequest['status'];
  title: FeatureRequest['title'];
}

export const FeatureRequestCard = ({
  archivedAt,
  createdAt,
  description,
  id,
  onArchive,
  onClick,
  onDelete,
  onEdit,
  onUnarchive,
  staleSteps,
  status,
  title,
}: FeatureRequestCardProps) => {
  const formattedCreatedAt = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  const handleCardClick = () => {
    onClick?.();
  };

  const handleEditClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onEdit?.();
  };

  const handleDeleteClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onDelete?.();
  };

  const handleArchiveClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onArchive?.(id);
  };

  const handleUnarchiveClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onUnarchive?.(id);
  };

  const isArchived = Boolean(archivedAt);
  const isClickable = Boolean(onClick);
  const hasStaleSteps = (() => {
    if (!staleSteps) return false;
    try {
      const parsed = JSON.parse(staleSteps) as unknown;
      return Array.isArray(parsed) && parsed.length > 0;
    } catch {
      return false;
    }
  })();

  return (
    <Card
      className={cn(isClickable && 'cursor-pointer transition-colors hover:border-accent', isArchived && 'opacity-60')}
      onClick={handleCardClick}
    >
      {/* Header */}
      <CardHeader className={'pb-2'}>
        <div className={'flex items-start justify-between'}>
          <div className={'flex size-10 items-center justify-center rounded-lg bg-muted'}>
            <Lightbulb className={'size-5 text-muted-foreground'} />
          </div>
          <div className={'flex gap-1'}>
            {isArchived ? (
              <IconButton aria-label={'Unarchive feature request'} onClick={handleUnarchiveClick} type={'button'}>
                <ArchiveRestore className={'size-4'} />
              </IconButton>
            ) : (
              <IconButton aria-label={'Archive feature request'} onClick={handleArchiveClick} type={'button'}>
                <Archive className={'size-4'} />
              </IconButton>
            )}
            <IconButton aria-label={'Edit feature request'} onClick={handleEditClick} type={'button'}>
              <Pencil className={'size-4'} />
            </IconButton>
            <IconButton aria-label={'Delete feature request'} onClick={handleDeleteClick} type={'button'}>
              <Trash2 className={'size-4'} />
            </IconButton>
          </div>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent>
        <div className={'mb-2 flex flex-wrap items-center gap-2'}>
          <CardTitle className={'text-base'}>{title}</CardTitle>
          <Badge variant={statusVariantMap[status as FeatureRequestStatus]}>
            {statusLabels[status as FeatureRequestStatus]}
          </Badge>
          {isArchived && <Badge variant={'default'}>Archived</Badge>}
          {hasStaleSteps && (
            <Badge variant={'stale'}>
              <AlertTriangle className={'mr-1 size-3'} />
              Stale
            </Badge>
          )}
        </div>
        {description && (
          <CardDescription className={'line-clamp-2 text-xs'} title={description}>
            {description}
          </CardDescription>
        )}
        <p className={'mt-2 text-xs text-muted-foreground'}>Created {formattedCreatedAt}</p>
      </CardContent>
    </Card>
  );
};
