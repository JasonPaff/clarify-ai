'use client';

import { AlertDialog } from '@base-ui/react/alert-dialog';
import { useState } from 'react';

import type { Repository } from '@/db/schema/repositories.schema';

import { Button } from '@/components/ui/button';
import { useDeleteRepository } from '@/hooks/queries/use-repositories';
import { cn } from '@/lib/utils';

type DeleteRepositoryDialogProps = Children & {
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  repository: Pick<Repository, 'id' | 'name'>;
};

export function DeleteRepositoryDialog({
  children,
  onOpenChange,
  open: controlledOpen,
  repository,
}: DeleteRepositoryDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled
    ? (onOpenChange ??
      (() => {
        /* intentionally empty */
      }))
    : setUncontrolledOpen;

  const deleteRepository = useDeleteRepository();

  const isConfirmed = confirmationText === repository.name;

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setConfirmationText('');
    }
  };

  const handleDelete = async () => {
    if (!isConfirmed) return;
    await deleteRepository.mutateAsync(repository.id);
    setOpen(false);
  };

  return (
    <AlertDialog.Root onOpenChange={handleOpenChange} open={open}>
      {children && (
        <AlertDialog.Trigger nativeButton={false} render={<span className={'inline-flex'} />}>
          {children}
        </AlertDialog.Trigger>
      )}
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
          <AlertDialog.Title className={'text-lg font-semibold text-foreground'}>Delete Repository</AlertDialog.Title>
          <AlertDialog.Description className={`mt-2 text-sm text-muted-foreground`}>
            Are you sure you want to delete <span className={'font-semibold text-foreground'}>{repository.name}</span>?
          </AlertDialog.Description>
          <p className={'mt-4 text-sm text-destructive'}>
            This action cannot be undone. The repository reference will be permanently removed from this project.
          </p>
          <div className={'mt-4'}>
            <label className={'block text-sm text-muted-foreground'} htmlFor={'confirm-delete-repository'}>
              Type <span className={'font-semibold text-foreground'}>{repository.name}</span> to confirm
            </label>
            <input
              autoComplete={'off'}
              className={cn(
                'mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground',
                'placeholder:text-muted-foreground',
                'focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none'
              )}
              id={'confirm-delete-repository'}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={repository.name}
              type={'text'}
              value={confirmationText}
            />
          </div>
          <div className={'mt-6 flex justify-end gap-3'}>
            <AlertDialog.Close render={<Button variant={'outline'} />}>Cancel</AlertDialog.Close>
            <Button
              disabled={!isConfirmed || deleteRepository.isPending}
              onClick={handleDelete}
              variant={'destructive'}
            >
              {deleteRepository.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
