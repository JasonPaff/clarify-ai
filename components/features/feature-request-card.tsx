'use client';

import type { VariantProps } from 'class-variance-authority';
import type { MouseEvent } from 'react';

import { formatDistanceToNow } from 'date-fns';
import { Lightbulb, Pencil, Trash2 } from 'lucide-react';

import type { FeatureRequest } from '@/db/schema/feature-requests.schema';

import { Badge, badgeVariants } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';
import { cn } from '@/lib/utils';

type FeatureRequestStatus = 'completed' | 'draft' | 'planning' | 'refining' | 'researching';

const statusLabels: Record<FeatureRequestStatus, string> = {
  completed: 'Completed',
  draft: 'Draft',
  planning: 'Planning',
  refining: 'Refining',
  researching: 'Researching',
};

const statusVariantMap: Record<FeatureRequestStatus, VariantProps<typeof badgeVariants>['variant']> = {
  completed: 'completed',
  draft: 'draft',
  planning: 'planning',
  refining: 'refining',
  researching: 'researching',
};

interface FeatureRequestCardProps {
  createdAt: FeatureRequest['createdAt'];
  description?: FeatureRequest['description'];
  onClick?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  status: FeatureRequest['status'];
  title: FeatureRequest['title'];
}

export const FeatureRequestCard = ({
  createdAt,
  description,
  onClick,
  onDelete,
  onEdit,
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

  const _isClickable = Boolean(onClick);

  return (
    <Card
      className={cn(_isClickable && 'cursor-pointer transition-colors hover:border-accent')}
      onClick={handleCardClick}
    >
      {/* Header */}
      <CardHeader className={'pb-2'}>
        <div className={'flex items-start justify-between'}>
          <div
            className={`
              flex size-10 items-center justify-center rounded-lg bg-muted
            `}
          >
            <Lightbulb className={'size-5 text-muted-foreground'} />
          </div>
          <div className={'flex gap-1'}>
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
        <div className={'mb-2 flex items-center gap-2'}>
          <CardTitle className={'text-base'}>{title}</CardTitle>
          <Badge variant={statusVariantMap[status as FeatureRequestStatus]}>
            {statusLabels[status as FeatureRequestStatus]}
          </Badge>
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
