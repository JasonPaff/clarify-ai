'use client';

import type { ComponentPropsWithRef } from 'react';

import { formatDistanceToNow } from 'date-fns';
import { Clock, History, ListX } from 'lucide-react';
import { useState } from 'react';

import type { FeatureRequestRun, FeatureRequestRunStep } from '@/db/schema/feature-request-runs.schema';

import {
  SelectGroup,
  SelectItem,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCurrentRun, useRunsByStep, useSetCurrentRun } from '@/hooks/queries/use-feature-request-runs';
import { cn } from '@/lib/utils';

import { RestoreRunDialog } from './restore-run-dialog';

interface RunHistoryDropdownProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  featureRequestId: number;
  onRunRestored?: () => void;
  step: FeatureRequestRunStep;
}

export const RunHistoryDropdown = ({
  className,
  featureRequestId,
  onRunRestored,
  ref,
  step,
  ...props
}: RunHistoryDropdownProps) => {
  const parseSqliteTimestamp = (value: string) => new Date(value.endsWith('Z') ? value : `${value}Z`);
  const [selectedRun, setSelectedRun] = useState<FeatureRequestRun | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: runs = [], isLoading: isLoadingRuns } = useRunsByStep(featureRequestId, step);
  const { data: currentRun } = useCurrentRun(featureRequestId, step);
  const setCurrentRunMutation = useSetCurrentRun();

  const handleRunSelect = (value: null | string) => {
    if (!value) {
      return;
    }

    const runId = parseInt(value, 10);
    const run = runs.find((r) => r.id === runId);

    if (!run || run.id === currentRun?.id) {
      return;
    }

    setSelectedRun(run);
    setIsDialogOpen(true);
  };

  const handleConfirmRestore = () => {
    if (!selectedRun) {
      return;
    }

    setCurrentRunMutation.mutate(
      {
        featureRequestId,
        runId: selectedRun.id,
        step,
      },
      {
        onSuccess: () => {
          onRunRestored?.();
        },
      }
    );

    setSelectedRun(null);
    setIsDialogOpen(false);
  };

  const handleDialogOpenChange = (isOpen: boolean) => {
    setIsDialogOpen(isOpen);
    if (!isOpen) {
      setSelectedRun(null);
    }
  };

  const isEmptyState = !isLoadingRuns && runs.length === 0;
  const hasRuns = runs.length > 0;

  return (
    <div className={cn('flex items-center', className)} ref={ref} {...props}>
      {/* Dropdown */}
      <SelectRoot onValueChange={handleRunSelect} value={currentRun?.id?.toString() ?? ''}>
        <SelectTrigger
          className={cn('min-w-[200px]', isEmptyState && 'cursor-not-allowed opacity-60')}
          disabled={isEmptyState}
          size={'sm'}
        >
          <div className={'flex items-center gap-2'}>
            {isEmptyState ? (
              <ListX aria-hidden={'true'} className={'size-4 text-muted-foreground'} />
            ) : (
              <History aria-hidden={'true'} className={'size-4 text-muted-foreground'} />
            )}
            <SelectValue placeholder={isEmptyState ? 'No run history yet' : 'Select version...'}>
              {currentRun ? (
                <span className={'flex items-center gap-2'}>
                  <Clock aria-hidden={'true'} className={'size-3.5 text-muted-foreground'} />
                  <span>{formatDistanceToNow(parseSqliteTimestamp(currentRun.createdAt), { addSuffix: true })}</span>
                  <span className={'rounded-full bg-accent/10 px-1.5 py-0.5 text-xs font-medium text-accent'}>
                    Current
                  </span>
                </span>
              ) : (
                <span className={'text-muted-foreground'}>
                  {isLoadingRuns
                    ? 'Loading...'
                    : isEmptyState
                      ? 'No run history yet'
                      : 'Select version...'}
                </span>
              )}
            </SelectValue>
          </div>
        </SelectTrigger>

        {hasRuns && (
          <SelectPortal>
            <SelectPositioner>
              <SelectPopup size={'sm'}>
                <SelectList>
                  <SelectGroup>
                    {runs.map((run) => {
                      const isCurrentRunItem = run.id === currentRun?.id;
                      const formattedTimestamp = formatDistanceToNow(parseSqliteTimestamp(run.createdAt), {
                        addSuffix: true,
                      });

                      return (
                        <SelectItem key={run.id} size={'sm'} value={run.id.toString()}>
                          <div className={'flex w-full items-center justify-between gap-3'}>
                            {/* Run Info */}
                            <div className={'flex items-center gap-2'}>
                              <Clock aria-hidden={'true'} className={'size-3.5 text-muted-foreground'} />
                              <span>{formattedTimestamp}</span>
                            </div>

                            {/* Status & Current Badge */}
                            <div className={'flex items-center gap-2'}>
                              <span
                                className={cn(
                                  'rounded-full px-1.5 py-0.5 text-xs font-medium capitalize',
                                  run.status === 'completed' &&
                                    'bg-green-500/15 text-green-700 dark:bg-green-500/20 dark:text-green-400',
                                  run.status === 'failed' &&
                                    'bg-red-500/15 text-red-700 dark:bg-red-500/20 dark:text-red-400',
                                  run.status === 'running' &&
                                    'bg-yellow-500/15 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400',
                                  run.status === 'pending' &&
                                    'bg-neutral-500/15 text-neutral-700 dark:bg-neutral-500/20 dark:text-neutral-400'
                                )}
                              >
                                {run.status}
                              </span>
                              {isCurrentRunItem && (
                                <span
                                  className={'rounded-full bg-accent/10 px-1.5 py-0.5 text-xs font-medium text-accent'}
                                >
                                  Current
                                </span>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                </SelectList>
              </SelectPopup>
            </SelectPositioner>
          </SelectPortal>
        )}
      </SelectRoot>

      {/* Restore Dialog */}
      {selectedRun && (
        <RestoreRunDialog
          onConfirm={handleConfirmRestore}
          onOpenChange={handleDialogOpenChange}
          open={isDialogOpen}
          run={selectedRun}
        />
      )}
    </div>
  );
};
