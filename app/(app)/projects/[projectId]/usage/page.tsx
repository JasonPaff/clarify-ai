'use client';

import { AlertDialog } from '@base-ui/react/alert-dialog';
import { format } from 'date-fns';
import { Activity, CheckCircle2, Clock, Coins, Hash, Loader2, Trash2, XCircle, Zap } from 'lucide-react';
import { withParamValidation } from 'next-typesafe-url/app/hoc';
import { use, useState } from 'react';

import type { AiUsageLog } from '@/db/schema/ai-usage-logs.schema';

import { PageProps, Route } from '@/app/(app)/projects/[projectId]/usage/route-type';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAiUsageLogs, useAiUsageLogsTotals, useDeleteAiUsageLogs } from '@/hooks/queries/use-ai-usage-logs';
import { formatCost } from '@/lib/ai/pricing';
import { cn } from '@/lib/utils';

interface DeleteUsageDialogProps {
  isOpen: boolean;
  isPending: boolean;
  onConfirm: () => void;
  onOpenChange: (isOpen: boolean) => void;
}

interface UsageDashboardContentProps {
  projectId: number;
}

interface UsageLogRowProps {
  log: AiUsageLog;
}

type UsagePageProps = PageProps;

function DeleteUsageDialog({ isOpen, isPending, onConfirm, onOpenChange }: DeleteUsageDialogProps) {
  return (
    <AlertDialog.Root onOpenChange={onOpenChange} open={isOpen}>
      <AlertDialog.Portal>
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
          <AlertDialog.Title className={'text-lg font-semibold text-foreground'}>Clear Usage History</AlertDialog.Title>
          <AlertDialog.Description className={'mt-2 text-sm text-muted-foreground'}>
            Are you sure you want to clear all usage history for this project?
          </AlertDialog.Description>
          <p className={'mt-4 text-sm text-destructive'}>
            This action cannot be undone. All AI usage logs will be permanently deleted.
          </p>
          <div className={'mt-6 flex justify-end gap-3'}>
            <AlertDialog.Close render={<Button variant={'outline'} />}>Cancel</AlertDialog.Close>
            <Button disabled={isPending} onClick={onConfirm} variant={'destructive'}>
              {isPending ? 'Clearing...' : 'Clear History'}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

function formatDuration(durationMs: number): string {
  if (durationMs >= 60000) {
    return `${(durationMs / 60000).toFixed(1)}m`;
  }
  if (durationMs >= 1000) {
    return `${(durationMs / 1000).toFixed(1)}s`;
  }
  return `${durationMs}ms`;
}

function formatOperationType(operationType: string): string {
  return operationType
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatTokenCount(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k`;
  }
  return tokens.toLocaleString();
}

function getModelDisplayName(modelId: string): string {
  const modelNames: Record<string, string> = {
    'claude-3-5-haiku-20241022': 'Claude 3.5 Haiku',
    'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
    'claude-3-haiku-20240307': 'Claude 3 Haiku',
    'claude-3-opus-20240229': 'Claude 3 Opus',
    'claude-3-sonnet-20240229': 'Claude 3 Sonnet',
    'claude-opus-4-5-20251101': 'Claude Opus 4.5',
    'claude-sonnet-4-5-20250929': 'Claude Sonnet 4.5',
    'claude-sonnet-4-20250514': 'Claude Sonnet 4',
    'gemini-1.5-flash': 'Gemini 1.5 Flash',
    'gemini-1.5-pro': 'Gemini 1.5 Pro',
    'gemini-2.0-flash': 'Gemini 2.0 Flash',
    'gemini-2.5-flash': 'Gemini 2.5 Flash',
    'gemini-2.5-pro': 'Gemini 2.5 Pro',
    'gpt-3.5-turbo': 'GPT-3.5 Turbo',
    'gpt-4': 'GPT-4',
    'gpt-4-turbo': 'GPT-4 Turbo',
    'gpt-4o': 'GPT-4o',
    'gpt-4o-mini': 'GPT-4o Mini',
    'gpt-5': 'GPT-5',
    'gpt-5-mini': 'GPT-5 Mini',
    o1: 'o1',
    'o3-mini': 'o3-mini',
  };

  return modelNames[modelId] || modelId;
}

function UsageDashboardContent({ projectId }: UsageDashboardContentProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: logs, error: logsError, isLoading: isLoadingLogs } = useAiUsageLogs(projectId);
  const { data: totals, error: totalsError, isLoading: isLoadingTotals } = useAiUsageLogsTotals(projectId);
  const deleteUsageLogs = useDeleteAiUsageLogs();

  const isLoading = isLoadingLogs || isLoadingTotals;
  const error = logsError || totalsError;

  const hasLogs = logs && logs.length > 0;
  const averageCost = totals && totals.operationCount > 0 ? totals.totalCostUsd / totals.operationCount : 0;

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    await deleteUsageLogs.mutateAsync(projectId);
    setIsDeleteDialogOpen(false);
  };

  const handleDeleteDialogOpenChange = (isOpen: boolean) => {
    setIsDeleteDialogOpen(isOpen);
  };

  if (isLoading) {
    return (
      <div className={'flex items-center justify-center py-12'}>
        <Loader2 className={'size-6 animate-spin text-muted-foreground'} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={'py-12 text-center'}>
        <p className={'text-sm text-destructive'}>{error.message}</p>
      </div>
    );
  }

  return (
    <div className={'space-y-6'}>
      {/* Summary Stats */}
      <div className={'grid gap-4 sm:grid-cols-2 lg:grid-cols-4'}>
        {/* Total Operations */}
        <Card>
          <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
            <CardDescription>Total Operations</CardDescription>
            <Activity className={'size-4 text-muted-foreground'} />
          </CardHeader>
          <CardContent>
            <div className={'text-2xl font-bold'}>{totals?.operationCount.toLocaleString() || '0'}</div>
          </CardContent>
        </Card>

        {/* Total Tokens */}
        <Card>
          <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
            <CardDescription>Total Tokens</CardDescription>
            <Hash className={'size-4 text-muted-foreground'} />
          </CardHeader>
          <CardContent>
            <div className={'text-2xl font-bold'}>{formatTokenCount(totals?.totalTokens || 0)}</div>
          </CardContent>
        </Card>

        {/* Total Cost */}
        <Card>
          <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
            <CardDescription>Total Cost</CardDescription>
            <Coins className={'size-4 text-muted-foreground'} />
          </CardHeader>
          <CardContent>
            <div className={'text-2xl font-bold'}>{formatCost(totals?.totalCostUsd || 0)}</div>
          </CardContent>
        </Card>

        {/* Average Cost */}
        <Card>
          <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
            <CardDescription>Avg. Cost / Operation</CardDescription>
            <Zap className={'size-4 text-muted-foreground'} />
          </CardHeader>
          <CardContent>
            <div className={'text-2xl font-bold'}>{formatCost(averageCost)}</div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Usage History */}
      <div>
        <div className={'mb-4 flex items-center justify-between'}>
          <div>
            <h2 className={'text-lg font-semibold'}>Usage History</h2>
            <p className={'text-sm text-muted-foreground'}>Recent AI operations for this project</p>
          </div>
          {hasLogs && (
            <Button onClick={handleDeleteClick} size={'sm'} variant={'outline'}>
              <Trash2 className={'size-4'} />
              Clear History
            </Button>
          )}
        </div>

        {hasLogs ? (
          <div className={'space-y-2'}>
            {logs.map((log) => (
              <UsageLogRow key={log.id} log={log} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className={'py-12'}>
              <div className={'flex flex-col items-center justify-center text-center'}>
                <div className={'mb-4 rounded-full bg-muted p-3'}>
                  <Activity className={'size-6 text-muted-foreground'} />
                </div>
                <h3 className={'text-lg font-semibold'}>No AI usage recorded yet</h3>
                <p className={'mt-2 max-w-sm text-sm text-muted-foreground'}>
                  Usage data will appear here after you run AI operations like feature analysis or repository overviews.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteUsageDialog
        isOpen={isDeleteDialogOpen}
        isPending={deleteUsageLogs.isPending}
        onConfirm={handleDeleteConfirm}
        onOpenChange={handleDeleteDialogOpenChange}
      />
    </div>
  );
}

function UsageLogRow({ log }: UsageLogRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-4 transition-colors',
        'hover:border-accent/50'
      )}
    >
      {/* Main Row */}
      <div className={'flex items-center justify-between gap-4'}>
        {/* Left: Status, Operation, Model */}
        <div className={'flex min-w-0 flex-1 items-center gap-3'}>
          {/* Status Icon */}
          {log.success ? (
            <CheckCircle2 className={'size-4 shrink-0 text-green-500'} />
          ) : (
            <XCircle className={'size-4 shrink-0 text-destructive'} />
          )}

          {/* Operation Type */}
          <div className={'min-w-0 flex-1'}>
            <p className={'truncate text-sm font-medium'}>{formatOperationType(log.operationType)}</p>
            <p className={'truncate text-xs text-muted-foreground'}>{getModelDisplayName(log.modelId)}</p>
          </div>
        </div>

        {/* Right: Stats */}
        <div className={'flex items-center gap-4'}>
          {/* Tokens */}
          <button
            className={cn(
              'flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs text-muted-foreground',
              'cursor-pointer transition-colors hover:bg-muted'
            )}
            onClick={handleToggleExpand}
            title={'Click to see token breakdown'}
            type={'button'}
          >
            <Hash className={'size-3'} />
            <span>{formatTokenCount(log.totalTokens)}</span>
          </button>

          {/* Duration */}
          <div className={'flex items-center gap-1.5 text-xs text-muted-foreground'}>
            <Clock className={'size-3'} />
            <span>{formatDuration(log.durationMs)}</span>
          </div>

          {/* Cost */}
          <div className={'flex items-center gap-1.5 text-xs font-medium'}>
            <Coins className={'size-3 text-amber-500'} />
            <span>{formatCost(log.estimatedCostUsd)}</span>
          </div>

          {/* Timestamp */}
          <div className={'text-xs text-muted-foreground'}>
            {format(new Date(log.createdAt), 'MMM d, h:mm a')}
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className={'mt-3 border-t border-border pt-3'}>
          <div className={'grid grid-cols-3 gap-4 text-xs'}>
            <div>
              <p className={'text-muted-foreground'}>Input Tokens</p>
              <p className={'font-medium'}>{log.inputTokens.toLocaleString()}</p>
            </div>
            <div>
              <p className={'text-muted-foreground'}>Output Tokens</p>
              <p className={'font-medium'}>{log.outputTokens.toLocaleString()}</p>
            </div>
            <div>
              <p className={'text-muted-foreground'}>Total Tokens</p>
              <p className={'font-medium'}>{log.totalTokens.toLocaleString()}</p>
            </div>
          </div>
          {log.errorMessage && (
            <div className={'mt-3'}>
              <p className={'text-xs text-muted-foreground'}>Error</p>
              <p className={'mt-1 text-xs text-destructive'}>{log.errorMessage}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function UsagePage({ routeParams }: UsagePageProps) {
  const { projectId } = use(routeParams);

  return <UsageDashboardContent projectId={projectId} />;
}

export default withParamValidation(UsagePage, Route);
