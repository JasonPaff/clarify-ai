'use client';

import { AlertDialog } from '@base-ui/react/alert-dialog';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OverviewCloseConfirmationDialogProps {
  onContinueInBackground: () => void;
  onOpenChange: (isOpen: boolean) => void;
  onStopGeneration: () => void;
  open: boolean;
  repositoryName: string;
}

/**
 * Confirmation dialog shown when user tries to close the overview generation dialog
 * while generation is in progress. Offers two choices:
 * - Stop Generation: Cancel the generation and close
 * - Continue in Background: Close dialog but let generation complete and auto-save
 */
export function OverviewCloseConfirmationDialog({
  onContinueInBackground,
  onOpenChange,
  onStopGeneration,
  open,
  repositoryName,
}: OverviewCloseConfirmationDialogProps) {
  return (
    <AlertDialog.Root onOpenChange={onOpenChange} open={open}>
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
          <AlertDialog.Title className={'text-lg font-semibold text-foreground'}>
            Generation in Progress
          </AlertDialog.Title>

          {/* Description */}
          <AlertDialog.Description className={'mt-2 text-sm text-muted-foreground'}>
            The overview for <span className={'font-semibold text-foreground'}>{repositoryName}</span> is still being
            generated.
          </AlertDialog.Description>

          {/* Info */}
          <p className={'mt-4 text-sm text-muted-foreground'}>
            You can stop the generation now, or let it continue in the background and save automatically when complete.
          </p>

          {/* Actions */}
          <div className={'mt-6 flex items-center justify-between'}>
            <AlertDialog.Close render={<Button variant={'ghost'} />}>Cancel</AlertDialog.Close>
            <div className={'flex gap-3'}>
              <Button onClick={onStopGeneration} variant={'destructive'}>
                Stop Generation
              </Button>
              <Button onClick={onContinueInBackground} variant={'outline'}>
                Continue in Background
              </Button>
            </div>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
