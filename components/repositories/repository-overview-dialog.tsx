'use client';

import type { ReactNode } from 'react';

import { X } from 'lucide-react';
import { useRef, useState } from 'react';

import { useBackgroundOverviewGeneration } from '@/components/providers/background-overview-generation-provider';
import {
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { IconButton } from '@/components/ui/icon-button';
import {
  useRepositoryOverview,
  useUpdateRepositoryOverview,
  useUpsertRepositoryOverview,
} from '@/hooks/queries/use-repository-overviews';

import { OverviewCloseConfirmationDialog } from './overview-close-confirmation-dialog';
import { RepositoryOverviewGenerator, type RepositoryOverviewGeneratorHandle } from './repository-overview-generator';
import { RepositoryOverviewViewer } from './repository-overview-viewer';

type DialogMode = 'generate' | 'view';

interface RepositoryOverviewDialogProps {
  children: ReactNode;
  projectId: number;
  repositoryId: number;
  repositoryName: string;
  repositoryPath: string;
}

/**
 * Dialog for generating and viewing repository overviews.
 * Automatically switches between generate and view modes based on whether an overview exists.
 */
export function RepositoryOverviewDialog({
  children,
  projectId,
  repositoryId,
  repositoryName,
  repositoryPath,
}: RepositoryOverviewDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<DialogMode>('view');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const generatorRef = useRef<RepositoryOverviewGeneratorHandle>(null);

  const { data: overview, isLoading: isLoadingOverview } = useRepositoryOverview(repositoryId);
  const upsertOverview = useUpsertRepositoryOverview();
  const updateOverview = useUpdateRepositoryOverview();
  const { startBackgroundGeneration } = useBackgroundOverviewGeneration();

  const hasOverview = overview !== undefined && overview !== null;

  // Determine initial mode when dialog opens, or intercept close during generation
  const handleOpenChange = (open: boolean) => {
    if (!open && generatorRef.current?.isGenerating) {
      // User is trying to close while generation is in progress
      // Show confirmation dialog instead of closing
      setShowConfirmation(true);
      return;
    }

    setIsOpen(open);
    if (open) {
      setMode(hasOverview ? 'view' : 'generate');
    }
  };

  // Handle "Stop Generation" from confirmation dialog
  const handleStopGeneration = async () => {
    await generatorRef.current?.stopGeneration();
    setShowConfirmation(false);
    setIsOpen(false);
  };

  // Handle "Continue in Background" from confirmation dialog
  const handleContinueInBackground = () => {
    const transitionData = generatorRef.current?.prepareBackgroundTransition();
    if (transitionData) {
      startBackgroundGeneration({
        content: transitionData.content,
        customPrompt: transitionData.customPrompt,
        modelId: transitionData.modelId,
        projectId: transitionData.projectId,
        repositoryId,
        repositoryName,
      });
    }
    setShowConfirmation(false);
    setIsOpen(false);
  };

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
    setMode('view');
  };

  const handleUpdateManual = async (content: string) => {
    if (!overview) return;

    await updateOverview.mutateAsync({
      data: {
        lastEditedAt: new Date().toISOString(),
        manualContent: content,
      },
      id: overview.id,
    });
  };

  const handleRegenerate = () => {
    setMode('generate');
  };

  const handleCancelGenerate = () => {
    if (hasOverview) {
      setMode('view');
    } else {
      setIsOpen(false);
    }
  };

  const isGenerating = mode === 'generate';
  const isViewing = mode === 'view';

  const isViewingWithOverview = isViewing && overview !== undefined && overview !== null;
  const hasNoOverview = !isLoadingOverview && !isGenerating && !isViewingWithOverview;

  return (
    <DialogRoot onOpenChange={handleOpenChange} open={isOpen}>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className={'max-w-2xl'}>
          {/* Header */}
          <div className={'relative'}>
            <DialogClose render={<IconButton className={'absolute -top-2 -right-2'} />}>
              <X className={'size-4'} />
            </DialogClose>
          </div>

          <DialogTitle>{isGenerating ? 'Generate Repository Overview' : 'Repository Overview'}</DialogTitle>

          <DialogDescription>
            {isGenerating
              ? 'Use AI to generate an overview of your repository structure, technologies, and key features.'
              : `Overview for ${repositoryName}`}
          </DialogDescription>

          {/* Content */}
          <div className={'mt-6'}>
            {isLoadingOverview && (
              <div className={'flex items-center justify-center py-8'}>
                <span className={'text-sm text-muted-foreground'}>Loading overview...</span>
              </div>
            )}

            {isGenerating && (
              <RepositoryOverviewGenerator
                onCancel={handleCancelGenerate}
                onSave={handleSaveGenerated}
                projectId={projectId}
                ref={generatorRef}
                repositoryId={repositoryId}
                repositoryPath={repositoryPath}
              />
            )}

            {isViewingWithOverview && (
              <RepositoryOverviewViewer
                onRegenerate={handleRegenerate}
                onUpdate={handleUpdateManual}
                overview={overview}
                repositoryName={repositoryName}
              />
            )}

            {hasNoOverview && (
              <div className={'flex flex-col items-center gap-4 py-8'}>
                <p className={'text-sm text-muted-foreground'}>No overview exists for this repository.</p>
                <button
                  className={`
                    text-sm text-accent underline-offset-4 transition-colors
                    hover:underline
                  `}
                  onClick={() => setMode('generate')}
                  type={'button'}
                >
                  Generate one now
                </button>
              </div>
            )}
          </div>
        </DialogPopup>
      </DialogPortal>

      {/* Confirmation dialog for closing during generation */}
      <OverviewCloseConfirmationDialog
        onContinueInBackground={handleContinueInBackground}
        onOpenChange={setShowConfirmation}
        onStopGeneration={handleStopGeneration}
        open={showConfirmation}
        repositoryName={repositoryName}
      />
    </DialogRoot>
  );
}
