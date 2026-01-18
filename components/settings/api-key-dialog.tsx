'use client';

import { X } from 'lucide-react';
import { useState } from 'react';

import type { ApiKeyInfo } from '@/types/electron';

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

import { ApiKeyForm } from './api-key-form';

type ApiKeyDialogProps = Children & {
  existingKey?: ApiKeyInfo;
  mode: DialogMode;
};

type DialogMode = 'create' | 'edit';

export function ApiKeyDialog({ children, existingKey, mode }: ApiKeyDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSuccess = () => {
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  const _isEditMode = mode === 'edit';
  const _dialogTitle = _isEditMode ? 'Edit API Key' : 'Add API Key';
  const _dialogDescription = _isEditMode
    ? 'Update the API key or notes for this provider.'
    : 'Add a new API key for an AI provider.';

  const _initialValues =
    _isEditMode && existingKey
      ? {
          notes: existingKey.notes ?? '',
          provider: existingKey.provider,
        }
      : undefined;

  return (
    <DialogRoot onOpenChange={handleOpenChange} open={isOpen}>
      {/* Dialog Trigger */}
      <DialogTrigger>{children}</DialogTrigger>

      {/* Dialog Portal */}
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup>
          {/* Close Button */}
          <div className={'relative'}>
            <DialogClose render={<IconButton className={'absolute -top-2 -right-2'} />}>
              <X className={'size-4'} />
            </DialogClose>
          </div>

          {/* Dialog Header */}
          <DialogTitle>{_dialogTitle}</DialogTitle>
          <DialogDescription>{_dialogDescription}</DialogDescription>

          {/* Dialog Content */}
          <div className={'mt-6'}>
            <ApiKeyForm initialValues={_initialValues} mode={mode} onCancel={handleCancel} onSuccess={handleSuccess} />
          </div>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}
