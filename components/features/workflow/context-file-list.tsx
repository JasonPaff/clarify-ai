'use client';

import { File, FileText, Image, X } from 'lucide-react';

import type { FeatureRequestContextFile } from '@/db/schema/feature-request-context-files.schema';

import { IconButton } from '@/components/ui/icon-button';
import { cn } from '@/lib/utils';

const FILE_TYPE_ICONS = {
  document: FileText,
  image: Image,
  repository: File,
} as const;

interface ContextFileListProps extends ClassName {
  files: Array<FeatureRequestContextFile>;
  onRemove: (fileId: number) => void;
}

/**
 * Displays a list of selected context files with remove actions.
 * Shows appropriate icons based on file type and allows removal of individual files.
 */
export const ContextFileList = ({ className, files, onRemove }: ContextFileListProps) => {
  const hasFiles = files.length > 0;

  if (!hasFiles) {
    return (
      <div className={cn('rounded-md border border-border bg-muted/30 p-4 text-center', className)}>
        <p className={'text-sm text-muted-foreground'}>No context files added</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {files.map((file) => {
        const Icon = FILE_TYPE_ICONS[file.fileType];

        const handleRemoveClick = () => {
          onRemove(file.id);
        };

        // Truncate path to show only last 2 segments
        const pathSegments = file.filePath.split(/[/\\]/);
        const truncatedPath =
          pathSegments.length > 2
            ? `.../${pathSegments.slice(-2).join('/')}`
            : file.filePath;

        return (
          <div
            className={
              'flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2'
            }
            key={file.id}
          >
            {/* File Info */}
            <div className={'flex min-w-0 flex-1 items-center gap-2'}>
              <Icon className={'size-4 shrink-0 text-muted-foreground'} />
              <div className={'min-w-0 flex-1'}>
                <p className={'truncate text-sm font-medium'}>{file.displayName}</p>
                <p className={'truncate text-xs text-muted-foreground'} title={file.filePath}>
                  {truncatedPath}
                </p>
              </div>
            </div>

            {/* Remove Button */}
            <IconButton
              aria-label={`Remove ${file.displayName}`}
              className={'size-7 shrink-0'}
              onClick={handleRemoveClick}
              type={'button'}
            >
              <X className={'size-4'} />
            </IconButton>
          </div>
        );
      })}
    </div>
  );
};
