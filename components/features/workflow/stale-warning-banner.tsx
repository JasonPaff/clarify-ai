'use client';

import type { ComponentPropsWithRef } from 'react';

import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StaleWarningBannerProps extends ComponentPropsWithRef<'div'> {
  onDismiss?: () => void;
  onRerun: () => void;
  reason: string;
  stepName: string;
}

export const StaleWarningBanner = ({
  className,
  onDismiss,
  onRerun,
  reason,
  ref,
  stepName,
  ...props
}: StaleWarningBannerProps) => {
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismissClick = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleRerunClick = () => {
    onRerun();
  };

  if (isDismissed) {
    return null;
  }

  return (
    <Alert className={cn('relative', className)} ref={ref} variant={'warning'} {...props}>
      {/* Icon */}
      <AlertTriangle className={'mt-0.5 size-4 shrink-0'} />

      {/* Content */}
      <div className={'flex flex-1 flex-col gap-2'}>
        {/* Title */}
        <AlertTitle>{stepName} Output May Be Stale</AlertTitle>

        {/* Description */}
        <AlertDescription>{reason}</AlertDescription>

        {/* Actions */}
        <div className={'mt-1 flex items-center gap-2'}>
          <Button className={'h-7 gap-1.5 px-2.5 text-xs'} onClick={handleRerunClick} variant={'outline'}>
            <RefreshCw className={'size-3'} />
            Re-run {stepName}
          </Button>
        </div>
      </div>

      {/* Dismiss Button */}
      <button
        aria-label={'Dismiss warning'}
        className={cn(
          'absolute top-2 right-2 rounded-sm p-1',
          'text-amber-600 opacity-70 transition-opacity hover:opacity-100',
          'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0 focus-visible:outline-none',
          'dark:text-amber-400'
        )}
        onClick={handleDismissClick}
        type={'button'}
      >
        <X className={'size-4'} />
      </button>
    </Alert>
  );
};
