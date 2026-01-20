'use client';

import { X } from 'lucide-react';

import {
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog';
import { IconButton } from '@/components/ui/icon-button';
import { useUpsertRepositoryOverview } from '@/hooks/queries/use-repository-overviews';

import { RepositoryOverviewGenerator } from '../../repositories/repository-overview-generator';

interface RepositoryOverviewRegenerateDialogProps {
  /** Callback when dialog open state changes */
  onOpenChange: (isOpen: boolean) => void;
  /** Whether the dialog is open */
  open: boolean;
  /** Repository ID to regenerate overview for */
  repositoryId: number;
  /** Repository display name */
  repositoryName: string;
  /** Full path to the repository */
  repositoryPath: string;
}

/**
 * Dialog for regenerating repository overviews from the Describe Step.
 * Wraps RepositoryOverviewGenerator to provide a focused experience for regeneration.
 */
export const RepositoryOverviewRegenerateDialog = ({
  onOpenChange,
  open,
  repositoryId,
  repositoryName,
  repositoryPath,
}: RepositoryOverviewRegenerateDialogProps) => {
  const upsertOverview = useUpsertRepositoryOverview();

  const handleSaveGenerated = async (data: { content: string; customPrompt: string; modelId: string }) => {
    await upsertOverview.mutateAsync({
      data: {
        content: data.content,
        generatedAt: new Date().toISOString(),
        modelId: data.modelId,
        promptUsed: data.customPrompt || 'default',
      },
      repositoryId,
    });
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <DialogRoot onOpenChange={onOpenChange} open={open}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className={'max-w-2xl'}>
          {/* Header */}
          <div className={'relative'}>
            <DialogClose render={<IconButton className={'absolute -top-2 -right-2'} />}>
              <X className={'size-4'} />
            </DialogClose>
          </div>

          <DialogTitle>Regenerate Repository Overview</DialogTitle>

          <DialogDescription>
            Use AI to regenerate the overview for <span className={'font-semibold'}>{repositoryName}</span>. This will
            replace the existing overview.
          </DialogDescription>

          {/* Content */}
          <div className={'mt-6'}>
            <RepositoryOverviewGenerator
              onCancel={handleCancel}
              onSave={handleSaveGenerated}
              repositoryId={repositoryId}
              repositoryPath={repositoryPath}
            />
          </div>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
};
