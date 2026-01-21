'use client';

import type { ReactNode } from 'react';

import { FilePlus, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { DiscoveredFileEntry } from '@/lib/validations/discovery';

import { Button } from '@/components/ui/button';
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
import { useRepositories } from '@/hooks/queries/use-repositories';
import { useAppForm } from '@/lib/forms/form-hook';
import { addDiscoveredFileSchema } from '@/lib/validations/discovery';

interface AddFileDialogProps {
  children?: ReactNode;
  /** Callback when a file is successfully added */
  onAdd: (file: DiscoveredFileEntry) => void;
  /** Project ID for fetching repositories */
  projectId: number;
}

interface Repository {
  id: number;
  name: string;
}

const ACTION_OPTIONS = [
  { label: 'Create - New file to be created', value: 'create' },
  { label: 'Modify - Existing file to be modified', value: 'modify' },
  { label: 'Delete - File to be removed', value: 'delete' },
  { label: 'Review - File to review for context', value: 'review' },
];

const RISK_OPTIONS = [
  { label: 'Low - Minor changes with limited impact', value: 'low' },
  { label: 'Medium - Moderate changes that may affect related code', value: 'medium' },
  { label: 'High - Critical changes with significant impact', value: 'high' },
];

/**
 * Dialog for manually adding files that the AI may have missed during discovery.
 * Allows users to specify file path, action type, risk level, and justification.
 */
export const AddFileDialog = ({ children, onAdd, projectId }: AddFileDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: repositories } = useRepositories(projectId);

  const repositoryOptions = useMemo(() => {
    if (!repositories || repositories.length === 0) {
      return [];
    }
    return repositories.map((repo: Repository) => ({
      label: repo.name,
      value: String(repo.id),
    }));
  }, [repositories]);

  const hasMultipleRepositories = repositoryOptions.length > 1;
  const defaultRepositoryId = repositoryOptions.length === 1 ? String(repositoryOptions[0]?.value ?? '') : '';

  const form = useAppForm({
    defaultValues: {
      action: '',
      path: '',
      reason: '',
      repositoryId: defaultRepositoryId,
      risk: '',
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        const fileEntry: DiscoveredFileEntry = {
          action: value.action as DiscoveredFileEntry['action'],
          isManuallyAdded: true,
          path: value.path,
          reason: value.reason,
          repositoryId: value.repositoryId ? Number(value.repositoryId) : undefined,
          risk: value.risk as DiscoveredFileEntry['risk'],
        };

        onAdd(fileEntry);
        setIsOpen(false);
        form.reset();
      } finally {
        setIsSubmitting(false);
      }
    },
    validators: {
      onSubmit: addDiscoveredFileSchema,
    },
  });

  const handleCancel = () => {
    setIsOpen(false);
    form.reset();
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset();
    }
  };

  const triggerContent = children ?? (
    <Button size={'sm'} variant={'outline'}>
      <FilePlus aria-hidden={'true'} className={'mr-2 size-4'} />
      Add File
    </Button>
  );

  return (
    <DialogRoot onOpenChange={handleOpenChange} open={isOpen}>
      <DialogTrigger>{triggerContent}</DialogTrigger>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup size={'lg'}>
          {/* Close Button */}
          <div className={'relative'}>
            <DialogClose render={<IconButton className={'absolute -top-2 -right-2'} />}>
              <X className={'size-4'} />
            </DialogClose>
          </div>

          {/* Dialog Header */}
          <DialogTitle>Add File to Discovery</DialogTitle>
          <DialogDescription>
            Manually add a file that may have been missed by the AI analysis. Provide the file path and explain why this
            file is relevant to the feature implementation.
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
              {/* File Path Field */}
              <form.AppField name={'path'}>
                {(field) => (
                  <field.TextField
                    description={'Relative path from repository root (e.g., src/components/Button.tsx)'}
                    label={'File Path'}
                    placeholder={'src/components/example.tsx'}
                  />
                )}
              </form.AppField>

              {/* Repository Selector - Only show for multi-repo projects */}
              {hasMultipleRepositories && (
                <form.AppField name={'repositoryId'}>
                  {(field) => (
                    <field.SelectField
                      description={'Select which repository this file belongs to'}
                      label={'Repository'}
                      options={repositoryOptions}
                      placeholder={'Select a repository'}
                    />
                  )}
                </form.AppField>
              )}

              {/* Action Type Field */}
              <form.AppField name={'action'}>
                {(field) => (
                  <field.SelectField
                    description={'What action should be taken with this file?'}
                    label={'Action Type'}
                    options={ACTION_OPTIONS}
                    placeholder={'Select an action'}
                  />
                )}
              </form.AppField>

              {/* Risk Level Field */}
              <form.AppField name={'risk'}>
                {(field) => (
                  <field.SelectField
                    description={'Estimated risk level for changes to this file'}
                    label={'Risk Level'}
                    options={RISK_OPTIONS}
                    placeholder={'Select risk level'}
                  />
                )}
              </form.AppField>

              {/* Reason Textarea */}
              <form.AppField name={'reason'}>
                {(field) => (
                  <field.TextareaField
                    description={'Explain why this file is relevant to the feature implementation'}
                    label={'Reason'}
                    placeholder={'This file needs to be modified because...'}
                    rows={3}
                  />
                )}
              </form.AppField>

              {/* Action Buttons */}
              <div className={'mt-2 flex justify-end gap-3'}>
                <Button disabled={isSubmitting} onClick={handleCancel} type={'button'} variant={'outline'}>
                  Cancel
                </Button>
                <form.AppForm>
                  <form.SubmitButton>{isSubmitting ? 'Adding...' : 'Add File'}</form.SubmitButton>
                </form.AppForm>
              </div>
            </div>
          </form>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
};
