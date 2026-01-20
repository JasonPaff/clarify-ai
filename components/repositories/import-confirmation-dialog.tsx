'use client';

import { AlertDialog } from '@base-ui/react/alert-dialog';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImportConfirmationDialogProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ImportConfirmationDialog = ({ isOpen, onCancel, onConfirm }: ImportConfirmationDialogProps) => {
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onCancel();
    }
  };

  return (
    <AlertDialog.Root onOpenChange={handleOpenChange} open={isOpen}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop
          className={cn(
            `
              fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity
              duration-200
            `,
            'data-ending-style:opacity-0',
            'data-starting-style:opacity-0'
          )}
        />
        <AlertDialog.Popup
          className={cn(
            `
              fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-1/2
              rounded-lg border border-border
            `,
            `
              bg-background p-6 shadow-lg transition-all duration-200
              outline-none
            `,
            'data-ending-style:scale-95 data-ending-style:opacity-0',
            'data-starting-style:scale-95 data-starting-style:opacity-0'
          )}
        >
          {/* Header */}
          <AlertDialog.Title className={'text-lg font-semibold text-foreground'}>
            Replace Existing Overview?
          </AlertDialog.Title>

          {/* Description */}
          <AlertDialog.Description className={'mt-2 text-sm text-muted-foreground'}>
            You already have an overview for this repository. Importing will replace your existing content.
          </AlertDialog.Description>

          {/* Warning */}
          <p className={'mt-4 text-sm text-destructive'}>This action cannot be undone.</p>

          {/* Actions */}
          <div className={'mt-6 flex justify-end gap-3'}>
            <AlertDialog.Close render={<Button variant={'outline'} />}>Cancel</AlertDialog.Close>
            <Button onClick={onConfirm} variant={'destructive'}>
              Replace
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};
