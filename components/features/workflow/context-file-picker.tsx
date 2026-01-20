'use client';

import { FolderOpen, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  useAddContextFile,
  useContextFiles,
  useRemoveContextFile,
} from '@/hooks/queries/use-feature-request-context-files';
import { useElectronDialog, useElectronFs } from '@/hooks/useElectron';
import { cn } from '@/lib/utils';

import { ContextFileList } from './context-file-list';

interface ContextFilePickerProps extends ClassName {
  featureRequestId: number;
}

/**
 * Provides a complete UI for adding and managing context files for a feature request.
 * Opens native file dialogs to select files and displays them in a list with remove actions.
 */
export const ContextFilePicker = ({ className, featureRequestId }: ContextFilePickerProps) => {
  const { openFile } = useElectronDialog();
  const { stat } = useElectronFs();

  const { data: files, isError, isLoading } = useContextFiles(featureRequestId);

  const addContextFileMutation = useAddContextFile();
  const removeContextFileMutation = useRemoveContextFile();

  const isAddingFile = addContextFileMutation.isPending;
  const isRemovingFile = removeContextFileMutation.isPending;
  const isDisabled = isAddingFile || isRemovingFile;

  const handleAddFileClick = async () => {
    const filePath = await openFile();

    if (!filePath) {
      return;
    }

    // Get file stats for size
    const statResult = await stat(filePath);

    const sizeBytes = statResult.success && statResult.stats ? statResult.stats.size : 0;

    // Extract display name from file path
    const pathSegments = filePath.split(/[/\\]/);
    const displayName = pathSegments[pathSegments.length - 1] ?? filePath;

    // Determine file type from extension
    const extension = displayName.split('.').pop()?.toLowerCase() ?? '';
    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'];
    const isImage = imageExtensions.includes(extension);

    addContextFileMutation.mutate({
      displayName,
      featureRequestId,
      filePath,
      fileType: isImage ? 'image' : 'document',
      sizeBytes,
    });
  };

  const handleRemoveFile = (fileId: number) => {
    removeContextFileMutation.mutate(fileId);
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Header and Actions */}
      <div className={'flex items-center justify-between'}>
        <div className={'flex items-center gap-2'}>
          <FolderOpen className={'size-4 text-muted-foreground'} />
          <span className={'text-sm font-medium'}>Context Files</span>
        </div>
        <Button
          disabled={isDisabled}
          onClick={handleAddFileClick}
          size={'sm'}
          type={'button'}
          variant={'outline'}
        >
          <Plus className={'size-4'} />
          Add File
        </Button>
      </div>

      {/* File List */}
      {isLoading ? (
        <div className={'rounded-md border border-border bg-muted/30 p-4 text-center'}>
          <p className={'text-sm text-muted-foreground'}>Loading files...</p>
        </div>
      ) : isError ? (
        <div className={'rounded-md border border-destructive/50 bg-destructive/10 p-4 text-center'}>
          <p className={'text-sm text-destructive'}>Failed to load context files</p>
        </div>
      ) : (
        <ContextFileList files={files ?? []} onRemove={handleRemoveFile} />
      )}
    </div>
  );
};
