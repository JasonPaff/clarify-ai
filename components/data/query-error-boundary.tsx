'use client';

import type { ReactNode } from 'react';

import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

type QueryErrorBoundaryProps = RequiredChildren & {
  fallback?: ReactNode;
};

export function QueryErrorBoundary({ children, fallback }: QueryErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          fallbackRender={({ error, resetErrorBoundary }) =>
            fallback ?? (
              <EmptyState
                action={
                  <Button onClick={resetErrorBoundary} variant={'outline'}>
                    Try Again
                  </Button>
                }
                description={error instanceof Error ? error.message : 'An unexpected error occurred'}
                title={'Failed to load data'}
              />
            )
          }
          onReset={reset}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
