'use client';

import { AlertCircle } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface SaveErrorAlertProps {
  error: Error | null;
  onRetry?: () => void;
}

export const SaveErrorAlert = ({ error, onRetry }: SaveErrorAlertProps) => {
  const isVisible = error !== null;

  if (!isVisible) {
    return null;
  }

  return (
    <Alert variant={'destructive'}>
      {/* Icon */}
      <AlertCircle className={'size-4'} />

      {/* Message */}
      <AlertDescription className={'flex flex-1 items-center justify-between gap-2'}>
        <span>Failed to save changes. Your content is preserved locally and will be retried automatically.</span>

        {/* Retry Action */}
        {onRetry && (
          <Button onClick={onRetry} size={'sm'} variant={'outline'}>
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};
