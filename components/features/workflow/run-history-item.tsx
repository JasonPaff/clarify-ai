'use client';

import type { ComponentPropsWithRef } from 'react';

import { cva } from 'class-variance-authority';
import { formatDistanceToNow } from 'date-fns';

import type { FeatureRequestRun } from '@/db/schema/feature-request-runs.schema';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const runStatusBadgeVariants = cva(
  `
    inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium
    whitespace-nowrap
  `,
  {
    defaultVariants: {
      status: 'pending',
    },
    variants: {
      status: {
        completed: `
          bg-green-500/15 text-green-700
          dark:bg-green-500/20 dark:text-green-400
        `,
        failed: `
          bg-red-500/15 text-red-700
          dark:bg-red-500/20 dark:text-red-400
        `,
        pending: `
          bg-neutral-500/15 text-neutral-700
          dark:bg-neutral-500/20 dark:text-neutral-400
        `,
        running: `
          bg-yellow-500/15 text-yellow-700
          dark:bg-yellow-500/20 dark:text-yellow-400
        `,
      },
    },
  }
);

const STATUS_LABELS: Record<FeatureRequestRun['status'], string> = {
  completed: 'Completed',
  failed: 'Failed',
  pending: 'Pending',
  running: 'Running',
};

interface RunHistoryItemProps extends Omit<ComponentPropsWithRef<'div'>, 'onSelect'> {
  isCurrentRun: boolean;
  onRunSelect: (run: FeatureRequestRun) => void;
  run: FeatureRequestRun;
}

export const RunHistoryItem = ({
  className,
  isCurrentRun,
  onRunSelect,
  ref,
  run,
  ...props
}: RunHistoryItemProps) => {
  const handleSelectClick = () => {
    onRunSelect(run);
  };

  const formattedTimestamp = formatDistanceToNow(new Date(run.createdAt), { addSuffix: true });
  const statusLabel = STATUS_LABELS[run.status];

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-md border border-border bg-card p-3',
        isCurrentRun && 'border-accent/50 bg-accent/5',
        className
      )}
      ref={ref}
      {...props}
    >
      {/* Run Info */}
      <div className={'flex flex-col gap-1'}>
        <div className={'flex items-center gap-2'}>
          {/* Timestamp */}
          <span className={'text-sm font-medium'}>{formattedTimestamp}</span>

          {/* Current Label */}
          {isCurrentRun && (
            <span className={'rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent'}>
              Current
            </span>
          )}
        </div>

        {/* Status Badge */}
        <div className={'flex items-center gap-2'}>
          <span className={runStatusBadgeVariants({ status: run.status })}>{statusLabel}</span>
          {run.durationMs && (
            <span className={'text-xs text-muted-foreground'}>
              {(run.durationMs / 1000).toFixed(1)}s
            </span>
          )}
        </div>
      </div>

      {/* Action */}
      {!isCurrentRun && (
        <Button onClick={handleSelectClick} size={'sm'} variant={'outline'}>
          Use this version
        </Button>
      )}
    </div>
  );
};
