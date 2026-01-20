'use client';

import { format, formatDistanceToNow } from 'date-fns';
import { Check, Eye, FileText, GitBranch, Pencil, Sparkles, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';

import type { RepositoryOverviewStatus } from '@/hooks/queries/use-repository-overviews';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';

import { ImportRepositoryOverviewDialog } from './import-repository-overview-dialog';
import { RepositoryOverviewDialog } from './repository-overview-dialog';

interface RepositoryCardProps {
  fileCount?: null | number;
  id: number;
  lastScannedAt: null | string;
  name: string;
  onDelete?: () => void;
  onEdit?: () => void;
  overviewStatus: RepositoryOverviewStatus;
  path: string;
  projectId: number;
}

export function RepositoryCard({
  fileCount,
  id,
  lastScannedAt,
  name,
  onDelete,
  onEdit,
  overviewStatus,
  path,
  projectId,
}: RepositoryCardProps) {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  const formattedLastScanned = lastScannedAt
    ? `Last scanned ${formatDistanceToNow(new Date(lastScannedAt), { addSuffix: true })}`
    : 'Never scanned';

  const files = fileCount !== null && ` • ${fileCount} ${fileCount === 1 ? 'file' : 'files'}`;

  const hasOverview = overviewStatus.hasOverview;
  const formattedGeneratedDate = overviewStatus.generatedAt
    ? format(new Date(overviewStatus.generatedAt), 'MMM d, yyyy')
    : null;

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
        {/* Repository Info */}
        <CardTitle className={'mb-1 text-base'}>{name}</CardTitle>
        <CardDescription className={'truncate text-xs'} title={path}>
          {path}
        </CardDescription>
        <p className={'mt-2 text-xs text-muted-foreground'}>
          {formattedLastScanned}
          {files}
        </p>

        {/* Overview Status */}
        <div className={'mt-3 flex items-center gap-2'}>
          <FileText className={'size-3.5 text-muted-foreground'} />
          <span className={'text-xs text-muted-foreground'}>Overview:</span>
          {hasOverview ? (
            overviewStatus.isImported ? (
              <Badge size={'sm'} variant={'default'}>
                <Upload className={'mr-1 size-3'} />
                Imported ({formattedGeneratedDate})
              </Badge>
            ) : (
              <Badge size={'sm'} variant={'completed'}>
                <Check className={'mr-1 size-3'} />
                Generated ({formattedGeneratedDate})
              </Badge>
            )
          ) : (
            <span className={'text-xs text-muted-foreground'}>Not generated</span>
          )}
        </div>

        {/* Overview Actions */}
        <div className={'mt-4 flex gap-2'}>
          <RepositoryOverviewDialog projectId={projectId} repositoryId={id} repositoryName={name} repositoryPath={path}>
            {hasOverview ? (
              <Button size={'sm'} variant={'outline'}>
                <Eye className={'size-3.5'} />
                View Overview
              </Button>
            ) : (
              <Button size={'sm'} variant={'secondary'}>
                <Sparkles className={'size-3.5'} />
                Generate Overview
              </Button>
            )}
          </RepositoryOverviewDialog>

          <Button onClick={() => setIsImportDialogOpen(true)} size={'sm'} variant={'outline'}>
            <Upload className={'size-3.5'} />
            Import Overview
          </Button>
        </div>

        {/* Import Dialog */}
        <ImportRepositoryOverviewDialog
          isOpen={isImportDialogOpen}
          onOpenChange={setIsImportDialogOpen}
          repositoryId={id}
        />
      </CardContent>
    </Card>
  );
}
