'use client';

import { AlertDialog } from '@base-ui/react/alert-dialog';
import { AlertTriangle } from 'lucide-react';

import type { ValidationWarning } from '@/lib/workflow/step-validation';

import { Button } from '@/components/ui/button';
import { useControllableState } from '@/hooks/use-controllable-state';
import { cn } from '@/lib/utils';

type StepTransitionWarningDialogProps = Children & {
  onCancel?: () => void;
  onConfirm: () => void;
  onOpenChange?: (isOpen: boolean) => void;
  open?: boolean;
  targetStep: string;
  warnings: Array<ValidationWarning>;
};

export function StepTransitionWarningDialog({
  children,
  onCancel,
  onConfirm,
  onOpenChange,
  open: controlledOpen,
  targetStep,
  warnings,
}: StepTransitionWarningDialogProps) {
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

  const handleCancel = () => {
    onCancel?.();
    setIsOpen(false);
  };

  const hasWarnings = warnings.length > 0;

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
          {/* Header */}
          <div className={'flex items-start gap-3'}>
            <div className={'flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10'}>
              <AlertTriangle className={'size-5 text-amber-500'} />
            </div>
            <div className={'flex-1'}>
              {/* Title */}
              <AlertDialog.Title className={'text-lg font-semibold text-foreground'}>
                Incomplete Data Warning
              </AlertDialog.Title>

              {/* Description */}
              <AlertDialog.Description className={'mt-1 text-sm text-muted-foreground'}>
                {hasWarnings
                  ? `There are ${warnings.length} warning${warnings.length > 1 ? 's' : ''} before navigating to `
                  : 'Are you sure you want to navigate to '}
                <span className={'font-semibold text-foreground'}>{targetStep}</span>
                {hasWarnings ? ':' : '?'}
              </AlertDialog.Description>
            </div>
          </div>

          {/* Warnings List */}
          {hasWarnings && (
            <ul className={'mt-4 space-y-2'}>
              {warnings.map((warning, index) => (
                <li
                  className={cn(
                    'flex items-start gap-2 rounded-md border px-3 py-2 text-sm',
                    warning.severity === 'caution' && 'border-destructive/30 bg-destructive/5',
                    warning.severity === 'warning' && 'border-amber-500/30 bg-amber-500/5',
                    warning.severity === 'info' && 'border-border bg-muted/50'
                  )}
                  key={`${warning.type}-${index}`}
                >
                  <span
                    className={cn(
                      'mt-0.5 size-1.5 shrink-0 rounded-full',
                      warning.severity === 'caution' && 'bg-destructive',
                      warning.severity === 'warning' && 'bg-amber-500',
                      warning.severity === 'info' && 'bg-muted-foreground'
                    )}
                  />
                  <span className={'text-muted-foreground'}>{warning.message}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Info Text */}
          <p className={'mt-4 text-sm text-muted-foreground'}>
            You can proceed anyway, but the results of the{' '}
            <span className={'font-medium text-foreground'}>{targetStep}</span> step may be less accurate.
          </p>

          {/* Actions */}
          <div className={'mt-6 flex justify-end gap-3'}>
            <AlertDialog.Close render={<Button onClick={handleCancel} variant={'outline'} />}>Cancel</AlertDialog.Close>
            <Button onClick={handleConfirm} variant={'default'}>
              Proceed Anyway
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
