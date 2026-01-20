'use client';

import { useStore } from '@tanstack/react-form';
import { FileText, Upload, X } from 'lucide-react';
import { Fragment, useState } from 'react';

import type { InputMethod } from '@/lib/validations/import-repository-overview';

import { ImportConfirmationDialog } from '@/components/repositories/import-confirmation-dialog';
import { Button } from '@/components/ui/button';
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
import { useImportRepositoryOverview, useRepositoryOverview } from '@/hooks/queries/use-repository-overviews';
import { useElectronDialog, useElectronFs } from '@/hooks/useElectron';
import { useAppForm } from '@/lib/forms/form-hook';
import { importRepositoryOverviewSchema } from '@/lib/validations/import-repository-overview';

interface ImportRepositoryOverviewDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  repositoryId: number;
}

const INPUT_METHOD_OPTIONS = [
  {
    description: 'Select a markdown file from your computer',
    label: 'Upload File',
    value: 'file' as InputMethod,
  },
  {
    description: 'Paste markdown content directly',
    label: 'Paste Content',
    value: 'paste' as InputMethod,
  },
];

export function ImportRepositoryOverviewDialog({
  isOpen,
  onOpenChange,
  repositoryId,
}: ImportRepositoryOverviewDialogProps) {
  const [selectedFilePath, setSelectedFilePath] = useState<null | string>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [fileError, setFileError] = useState<null | string>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingContent, setPendingContent] = useState<null | string>(null);

  const { openFile } = useElectronDialog();
  const { readFile } = useElectronFs();
  const importOverview = useImportRepositoryOverview();
  const { data: existingOverview, isLoading: isLoadingOverview } = useRepositoryOverview(repositoryId);

  /**
   * Determines if we need to show confirmation before importing.
   * Only show confirmation if:
   * - An overview already exists
   * - The existing overview was NOT imported (modelId !== 'imported')
   */
  const needsConfirmation = existingOverview && existingOverview.modelId !== 'imported';

  const performImport = async (content: string) => {
    await importOverview.mutateAsync({
      content,
      repositoryId,
    });
    onOpenChange(false);
    resetForm();
  };

  const handleConfirmImport = async () => {
    if (pendingContent) {
      setShowConfirmation(false);
      await performImport(pendingContent);
      setPendingContent(null);
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
    setPendingContent(null);
  };

  const form = useAppForm({
    defaultValues: {
      content: '',
      inputMethod: 'file' as InputMethod,
    },
    onSubmit: async ({ value }) => {
      // If still loading overview status, wait - but typically this will be fast
      // and the user won't be able to submit that quickly
      if (isLoadingOverview) {
        return;
      }

      if (needsConfirmation) {
        // Store content and show confirmation dialog
        setPendingContent(value.content);
        setShowConfirmation(true);
      } else {
        // No existing AI-generated overview, proceed directly
        await performImport(value.content);
      }
    },
    validators: {
      onSubmit: importRepositoryOverviewSchema,
    },
  });

  const resetForm = () => {
    setSelectedFilePath(null);
    setFileError(null);
    setShowConfirmation(false);
    setPendingContent(null);
    form.reset();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const handleSelectFile = async () => {
    setFileError(null);
    const path = await openFile([{ extensions: ['md'], name: 'Markdown' }]);

    if (path) {
      setSelectedFilePath(path);
      setIsLoadingFile(true);

      const result = await readFile(path);

      setIsLoadingFile(false);

      if (result.success && result.content) {
        form.setFieldValue('content', result.content);
        setFileError(null);
      } else {
        setFileError(result.error ?? 'Failed to read file');
        form.setFieldValue('content', '');
      }
    }
  };

  const [currentInputMethod] = useStore(form.store, (state) => [state.values.inputMethod]);
  const isFileMethod = currentInputMethod === 'file';
  const isPasteMethod = currentInputMethod === 'paste';
  const isSubmitting = importOverview.isPending;
  const isDisabled = isSubmitting || isLoadingOverview;

  return (
    <Fragment>
      {/* Confirmation Dialog */}
      <ImportConfirmationDialog
        isOpen={showConfirmation}
        onCancel={handleCancelConfirmation}
        onConfirm={() => void handleConfirmImport()}
      />
    <DialogRoot onOpenChange={handleOpenChange} open={isOpen}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup size={'lg'}>
          {/* Close Button */}
          <div className={'relative'}>
            <DialogClose render={<IconButton className={'absolute -top-2 -right-2'} />}>
              <X className={'size-4'} />
            </DialogClose>
          </div>

          {/* Header */}
          <DialogTitle>Import Repository Overview</DialogTitle>
          <DialogDescription>
            Import an existing repository overview from a markdown file or paste content directly.
          </DialogDescription>

          {/* Form */}
          <form
            className={'mt-6'}
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <div className={'flex flex-col gap-4'}>
              {/* Input Method Selection */}
              <form.AppField
                listeners={{
                  onChange: () => {
                    // Clear content when input method changes
                    form.setFieldValue('content', '');
                    setSelectedFilePath(null);
                    setFileError(null);
                  },
                }}
                name={'inputMethod'}
              >
                {(field) => (
                  <field.RadioField
                    label={'Import Method'}
                    options={INPUT_METHOD_OPTIONS}
                    orientation={'horizontal'}
                  />
                )}
              </form.AppField>

              {/* File Selection UI */}
              {isFileMethod && (
                <div className={'flex flex-col gap-2'}>
                  <Button
                    className={'w-full justify-start gap-2'}
                    disabled={isLoadingFile}
                    onClick={handleSelectFile}
                    type={'button'}
                    variant={'outline'}
                  >
                    <Upload className={'size-4'} />
                    {isLoadingFile ? 'Loading...' : 'Select Markdown File'}
                  </Button>

                  {selectedFilePath && !fileError && (
                    <div className={'flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2'}>
                      <FileText className={'size-4 text-muted-foreground'} />
                      <span className={'truncate text-sm text-muted-foreground'}>{selectedFilePath}</span>
                    </div>
                  )}

                  {fileError && (
                    <div className={'rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2'}>
                      <span className={'text-sm text-destructive'}>{fileError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Paste Content UI */}
              {isPasteMethod && (
                <form.AppField name={'content'}>
                  {(field) => (
                    <field.TextareaField
                      description={'Paste the markdown content for the repository overview'}
                      label={'Overview Content'}
                      placeholder={'# Repository Overview\n\nPaste your markdown content here...'}
                      rows={10}
                    />
                  )}
                </form.AppField>
              )}

              {/* Hidden content field error for file method */}
              {isFileMethod && (
                <form.AppField name={'content'}>
                  {(field) => {
                    const error = field.state.meta.errors[0]?.message;
                    const hasError = Boolean(error) && field.state.meta.isTouched;

                    if (!hasError) return null;

                    return (
                      <div className={'rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2'}>
                        <span className={'text-sm text-destructive'}>{error}</span>
                      </div>
                    );
                  }}
                </form.AppField>
              )}

              {/* Action Buttons */}
              <div className={'mt-2 flex justify-end gap-3'}>
                <Button
                  disabled={isDisabled}
                  onClick={() => handleOpenChange(false)}
                  type={'button'}
                  variant={'outline'}
                >
                  Cancel
                </Button>
                <form.AppForm>
                  <form.SubmitButton>
                    {isSubmitting ? 'Importing...' : 'Import Overview'}
                  </form.SubmitButton>
                </form.AppForm>
              </div>
            </div>
          </form>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
    </Fragment>
  );
}
