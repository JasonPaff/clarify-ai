'use client';

import { AlertDialog } from '@base-ui/react/alert-dialog';

import { Button } from '@/components/ui/button';
import { useControllableState } from '@/hooks/use-controllable-state';
import { cn } from '@/lib/utils';

type CancelAiDialogProps = Children & {
  onConfirm: () => void;
  onOpenChange?: (isOpen: boolean) => void;
  open?: boolean;
  stepName: string;
};

export function CancelAiDialog({
  children,
  onConfirm,
  onOpenChange,
  open: controlledOpen,
  stepName,
}: CancelAiDialogProps) {
  const [isOpen, setIsOpen] = useControllableState({
    defaultValue: false,
    onChange: onOpenChange,
    value: controlledOpen,
  });

  const handleOpenChange = (isDialogOpen: boolean) => {
    setIsOpen(isDialogOpen);
  };

  const handleConfirm = () => {
    onConfirm();
    setIsOpen(false);
  };

  return (
    <AlertDialog.Root onOpenChange={handleOpenChange} open={isOpen}>
      {/* Trigger */}
      {children && (
        <AlertDialog.Trigger nativeButton={false} render={<span className={'inline-flex'} />}>
          {children}
        </AlertDialog.Trigger>
      )}

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
          <AlertDialog.Title className={'text-lg font-semibold text-foreground'}>
            Stop AI Generation?
          </AlertDialog.Title>

          {/* Description */}
          <AlertDialog.Description className={'mt-2 text-sm text-muted-foreground'}>
            Are you sure you want to stop the <span className={'font-semibold text-foreground'}>{stepName}</span> step?
          </AlertDialog.Description>

          {/* Warning */}
          <p className={'mt-4 text-sm text-destructive'}>
            This action will cancel the current AI operation. Any progress made during this step will be lost and you
            will need to restart.
          </p>

          {/* Actions */}
          <div className={'mt-6 flex justify-end gap-3'}>
            <AlertDialog.Close render={<Button variant={'outline'} />}>Cancel</AlertDialog.Close>
            <Button onClick={handleConfirm} variant={'destructive'}>
              Stop Generation
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
