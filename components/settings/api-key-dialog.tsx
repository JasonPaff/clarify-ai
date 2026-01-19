'use client';

import { X } from 'lucide-react';

import type { MajorProvider } from '@/lib/validations/api-key';
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
import { useControllableState } from '@/hooks/use-controllable-state';

import { ApiKeyForm } from './api-key-form';

type ApiKeyDialogProps = Children & {
  existingKey?: ApiKeyInfo;
  mode: DialogMode;
  onOpenChange?: (isOpen: boolean) => void;
  open?: boolean;
};

type DialogMode = 'create' | 'edit';

export function ApiKeyDialog({ children, existingKey, mode, onOpenChange, open: controlledOpen }: ApiKeyDialogProps) {
  const [isOpen, setIsOpen] = useControllableState({
    defaultValue: false,
    onChange: onOpenChange,
    value: controlledOpen,
  });

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

  // Type assertion is safe because the API key management UI only displays major providers
  const _initialValues =
    _isEditMode && existingKey
      ? {
          notes: existingKey.notes ?? '',
          provider: existingKey.provider as MajorProvider,
        }
      : undefined;

  return (
    <DialogRoot onOpenChange={handleOpenChange} open={isOpen}>
      {/* Dialog Trigger (only when children provided) */}
      {children && <DialogTrigger>{children}</DialogTrigger>}

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
