'use client';

import { AlertDialog } from '@base-ui/react/alert-dialog';

import type { FeatureRequestRun } from '@/db/schema/feature-request-runs.schema';

import { Button } from '@/components/ui/button';
import { useControllableState } from '@/hooks/use-controllable-state';
import { cn } from '@/lib/utils';

type RestoreRunDialogProps = Children & {
  onConfirm: () => void;
  onOpenChange?: (isOpen: boolean) => void;
  open?: boolean;
  run: Pick<FeatureRequestRun, 'completedAt' | 'createdAt' | 'status' | 'step'>;
};

export function RestoreRunDialog({
  children,
  onConfirm,
  onOpenChange,
  open: controlledOpen,
  run,
}: RestoreRunDialogProps) {
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

  const parseSqliteTimestamp = (value: string) => new Date(value.endsWith('Z') ? value : `${value}Z`);
  const formattedDate = run.completedAt
    ? parseSqliteTimestamp(run.completedAt).toLocaleString()
    : parseSqliteTimestamp(run.createdAt).toLocaleString();

  const stepLabel = run.step === 'refine' ? 'Clarification' : run.step === 'research' ? 'Discover' : 'Planning';

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
            Restore Previous Version?
          </AlertDialog.Title>

          {/* Description */}
          <AlertDialog.Description className={'mt-2 text-sm text-muted-foreground'}>
            You are about to restore a previous version of the{' '}
            <span className={'font-semibold text-foreground'}>{stepLabel}</span> step.
          </AlertDialog.Description>

          {/* Run Details */}
          <div className={'mt-4 rounded-md border border-border bg-muted/50 p-3'}>
            <div className={'flex flex-col gap-1 text-sm'}>
              <div className={'flex justify-between'}>
                <span className={'text-muted-foreground'}>Step:</span>
                <span className={'font-medium text-foreground'}>{stepLabel}</span>
              </div>
              <div className={'flex justify-between'}>
                <span className={'text-muted-foreground'}>Status:</span>
                <span className={'font-medium text-foreground capitalize'}>{run.status}</span>
              </div>
              <div className={'flex justify-between'}>
                <span className={'text-muted-foreground'}>Date:</span>
                <span className={'font-medium text-foreground'}>{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Warning */}
          <p className={'mt-4 text-sm text-destructive'}>
            This action will replace the current outputs for this step with the outputs from the selected version. Any
            current progress will be overwritten.
          </p>

          {/* Actions */}
          <div className={'mt-6 flex justify-end gap-3'}>
            <AlertDialog.Close render={<Button variant={'outline'} />}>Cancel</AlertDialog.Close>
            <Button onClick={handleConfirm} variant={'default'}>
              Restore
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
