'use client';

import type { FallbackProps } from 'react-error-boundary';

import { AlertCircle, RefreshCw } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface StreamingErrorFallbackProps extends FallbackProps {
  stepName: string;
}

export const StreamingErrorFallback = ({ error, resetErrorBoundary, stepName }: StreamingErrorFallbackProps) => {
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

  return (
    <Alert variant={'destructive'}>
      <AlertCircle className={'size-4'} />
      <div className={'flex flex-1 flex-col gap-3'}>
        {/* Error Header */}
        <AlertTitle>{stepName} Error</AlertTitle>
        <AlertDescription>{errorMessage}</AlertDescription>

        {/* Retry Action */}
        <div className={'flex items-center gap-2'}>
          <Button onClick={resetErrorBoundary} size={'sm'} variant={'outline'}>
            <RefreshCw className={'mr-2 size-3'} />
            Retry
          </Button>
        </div>
      </div>
    </Alert>
  );
};
