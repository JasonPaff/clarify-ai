'use client';

import { AlertDialog } from '@base-ui/react/alert-dialog';

import type { ApiKeyInfo } from '@/types/electron';

import { Button } from '@/components/ui/button';
import { useDeleteApiKey } from '@/hooks/queries/use-api-keys';
import { useControllableState } from '@/hooks/use-controllable-state';
import { cn } from '@/lib/utils';
import { PROVIDER_DISPLAY_NAMES } from '@/types/electron';

type DeleteApiKeyDialogProps = Children & {
  apiKey: ApiKeyInfo;
  onOpenChange?: (isOpen: boolean) => void;
  open?: boolean;
};

export function DeleteApiKeyDialog({ apiKey, children, onOpenChange, open: controlledOpen }: DeleteApiKeyDialogProps) {
  const [isOpen, setIsOpen] = useControllableState({
    defaultValue: false,
    onChange: onOpenChange,
    value: controlledOpen,
  });

  const deleteApiKey = useDeleteApiKey();

  const handleOpenChange = (isDialogOpen: boolean) => {
    setIsOpen(isDialogOpen);
  };

  const handleDelete = async () => {
    await deleteApiKey.mutateAsync(apiKey.provider);
    setIsOpen(false);
  };

  const _providerDisplayName = getProviderDisplayName(apiKey.provider);

  return (
    <AlertDialog.Root onOpenChange={handleOpenChange} open={isOpen}>
      {/* Trigger */}
      {children && <AlertDialog.Trigger render={<span className={'inline-flex'} />}>{children}</AlertDialog.Trigger>}

      {/* Portal */}
      <AlertDialog.Portal>
        {/* Backdrop */}
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

        {/* Dialog Content */}
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
          {/* Title */}
          <AlertDialog.Title className={'text-lg font-semibold text-foreground'}>Delete API Key</AlertDialog.Title>

          {/* Description */}
          <AlertDialog.Description className={'mt-2 text-sm text-muted-foreground'}>
            Are you sure you want to delete the{' '}
            <span className={'font-semibold text-foreground'}>{_providerDisplayName}</span> API key?
          </AlertDialog.Description>

          {/* Warning */}
          <p className={'mt-4 text-sm text-destructive'}>
            This action cannot be undone. You will need to add the API key again to use {_providerDisplayName} services.
          </p>

          {/* Key Info */}
          <div className={'mt-4 rounded-md border border-border bg-muted/30 p-3'}>
            <div className={'text-xs text-muted-foreground'}>Current key</div>
            <div className={'mt-1 font-mono text-sm text-foreground'}>{apiKey.maskedKey}</div>
          </div>

          {/* Actions */}
          <div className={'mt-6 flex justify-end gap-3'}>
            <AlertDialog.Close render={<Button variant={'outline'} />}>Cancel</AlertDialog.Close>
            <Button disabled={deleteApiKey.isPending} onClick={handleDelete} variant={'destructive'}>
              {deleteApiKey.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

// Helper function to format provider names
const getProviderDisplayName = (provider: ApiKeyInfo['provider']): string => {
  return PROVIDER_DISPLAY_NAMES[provider];
};
