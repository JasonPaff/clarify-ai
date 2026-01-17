'use client';

import { formatDistanceToNow } from 'date-fns';
import { GitBranch, Pencil, Trash2 } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';

interface RepositoryCardProps {
  fileCount?: null | number;
  lastScannedAt: null | string;
  name: string;
  onDelete?: () => void;
  onEdit?: () => void;
  path: string;
}

export function RepositoryCard({ fileCount, lastScannedAt, name, onDelete, onEdit, path }: RepositoryCardProps) {
  const formattedLastScanned = lastScannedAt
    ? `Last scanned ${formatDistanceToNow(new Date(lastScannedAt), { addSuffix: true })}`
    : 'Never scanned';

  return (
    <Card>
      <CardHeader className={'pb-2'}>
        <div className={'flex items-start justify-between'}>
          <div
            className={`
              flex size-10 items-center justify-center rounded-lg bg-muted
            `}
          >
            <GitBranch className={'size-5 text-muted-foreground'} />
          </div>
          <div className={'flex gap-1'}>
            <IconButton aria-label={'Edit repository'} onClick={onEdit} type={'button'}>
              <Pencil className={'size-4'} />
            </IconButton>
            <IconButton aria-label={'Delete repository'} onClick={onDelete} type={'button'}>
              <Trash2 className={'size-4'} />
            </IconButton>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CardTitle className={'mb-1 text-base'}>{name}</CardTitle>
        <CardDescription className={'truncate text-xs'} title={path}>
          {path}
        </CardDescription>
        <p className={'mt-2 text-xs text-muted-foreground'}>
          {formattedLastScanned}
          {fileCount != null && ` • ${fileCount} ${fileCount === 1 ? 'file' : 'files'}`}
        </p>
      </CardContent>
    </Card>
  );
}
