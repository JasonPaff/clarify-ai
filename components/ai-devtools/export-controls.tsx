'use client';

import type { ComponentPropsWithRef } from 'react';

import { format, subDays, subHours, subMonths, subWeeks } from 'date-fns';
import { Check, Copy, Download, FileJson, FileSpreadsheet, Loader2, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import type { AiLogEntry } from '@/types/ai-log';

import { Button } from '@/components/ui/button';
import {
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  SelectItem,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePurgeAiLogs } from '@/hooks/queries/use-ai-logs';
import { useElectronDb, useElectronDialog, useElectronFs } from '@/hooks/useElectron';
import { cn } from '@/lib/utils';

/**
 * Retention period options for purging old logs.
 */
const RETENTION_OPTIONS = [
  { label: 'Older than 1 hour', value: '1h' },
  { label: 'Older than 24 hours', value: '24h' },
  { label: 'Older than 7 days', value: '7d' },
  { label: 'Older than 30 days', value: '30d' },
  { label: 'Older than 3 months', value: '3m' },
] as const;

type RetentionValue = (typeof RETENTION_OPTIONS)[number]['value'];

/**
 * Calculates the cutoff date for purging logs based on the retention period.
 */
const getRetentionCutoffDate = (retention: RetentionValue): Date => {
  const now = new Date();
  switch (retention) {
    case '1h':
      return subHours(now, 1);
    case '3m':
      return subMonths(now, 3);
    case '7d':
      return subWeeks(now, 1);
    case '24h':
      return subDays(now, 1);
    case '30d':
      return subMonths(now, 1);
  }
};

/**
 * Converts a log entry to CSV row format.
 */
const logToCSVRow = (log: AiLogEntry): string => {
  const escapeCsv = (value: number | string | undefined): string => {
    if (value === undefined || value === null) return '';
    const str = String(value);
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  return [
    escapeCsv(log.id),
    escapeCsv(log.createdAt),
    escapeCsv(log.workflowStep),
    escapeCsv(log.modelId),
    escapeCsv(log.status),
    escapeCsv(log.durationMs),
    escapeCsv(log.inputTokens),
    escapeCsv(log.outputTokens),
    escapeCsv(log.reasoningTokens),
    escapeCsv(log.requestId),
  ].join(',');
};

/**
 * Generates CSV content from log entries.
 */
const generateCSV = (logs: Array<AiLogEntry>): string => {
  const headers = [
    'ID',
    'Timestamp',
    'Workflow Step',
    'Model',
    'Status',
    'Duration (ms)',
    'Input Tokens',
    'Output Tokens',
    'Reasoning Tokens',
    'Request ID',
  ].join(',');

  const rows = logs.map(logToCSVRow);
  return [headers, ...rows].join('\n');
};

/**
 * Generates JSON content from log entries.
 */
const generateJSON = (logs: Array<AiLogEntry>): string => {
  return JSON.stringify(logs, null, 2);
};

/**
 * Copies text to clipboard and returns success status.
 */
const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

interface ExportControlsProps extends ComponentPropsWithRef<'div'> {
  /** All logs to export (for full export) */
  logs: Array<AiLogEntry>;
  /** Callback when logs are cleared */
  onClear?: () => void;
  /** Currently selected log entries (for copy selected) */
  selectedLogs?: Array<AiLogEntry>;
}

export const ExportControls = ({
  className,
  logs,
  onClear,
  ref,
  selectedLogs = [],
  ...props
}: ExportControlsProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isExportingJson, setIsExportingJson] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [isPurgeDialogOpen, setIsPurgeDialogOpen] = useState(false);
  const [retentionPeriod, setRetentionPeriod] = useState<RetentionValue>('7d');

  const { saveFile } = useElectronDialog();
  const { aiLogs } = useElectronDb();
  const { writeFile } = useElectronFs();
  const purgeMutation = usePurgeAiLogs();

  const hasLogs = logs.length > 0;
  const hasSelectedLogs = selectedLogs.length > 0;

  const retentionLabel = useMemo(() => {
    return RETENTION_OPTIONS.find((opt) => opt.value === retentionPeriod)?.label ?? 'Select period';
  }, [retentionPeriod]);

  const handleExportJson = useCallback(async () => {
    if (!hasLogs) return;

    setIsExportingJson(true);
    try {
      const jsonContent = generateJSON(logs);
      const defaultFileName = `ai-logs-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;

      const filePath = await saveFile(defaultFileName, [{ extensions: ['json'], name: 'JSON' }]);

      if (filePath) {
        await writeFile(filePath, jsonContent);
      }
    } finally {
      setIsExportingJson(false);
    }
  }, [hasLogs, logs, saveFile, writeFile]);

  const handleExportCsv = useCallback(async () => {
    if (!hasLogs) return;

    setIsExportingCsv(true);
    try {
      const csvContent = generateCSV(logs);
      const defaultFileName = `ai-logs-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`;

      const filePath = await saveFile(defaultFileName, [{ extensions: ['csv'], name: 'CSV' }]);

      if (filePath) {
        await writeFile(filePath, csvContent);
      }
    } finally {
      setIsExportingCsv(false);
    }
  }, [hasLogs, logs, saveFile, writeFile]);

  const handleCopySelected = useCallback(async () => {
    if (!hasSelectedLogs) return;

    const jsonContent = generateJSON(selectedLogs);
    const isSuccess = await copyToClipboard(jsonContent);

    if (isSuccess) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  }, [hasSelectedLogs, selectedLogs]);

  const handleClearAll = useCallback(async () => {
    try {
      // Delete all logs one by one
      for (const log of logs) {
        await aiLogs.delete(log.id);
      }
      setIsClearDialogOpen(false);
      onClear?.();
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }, [aiLogs, logs, onClear]);

  const handlePurgeOldLogs = useCallback(async () => {
    const cutoffDate = getRetentionCutoffDate(retentionPeriod);
    const cutoffIso = cutoffDate.toISOString();

    try {
      await purgeMutation.mutateAsync(cutoffIso);
      setIsPurgeDialogOpen(false);
      onClear?.();
    } catch (error) {
      console.error('Failed to purge logs:', error);
    }
  }, [onClear, purgeMutation, retentionPeriod]);

  const handleRetentionChange = useCallback((value: null | string) => {
    if (value) {
      setRetentionPeriod(value as RetentionValue);
    }
  }, []);

  const isExporting = isExportingJson || isExportingCsv;
  const isPurging = purgeMutation.isPending;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)} ref={ref} {...props}>
      {/* Export Controls */}
      <div className={'flex items-center gap-2'}>
        {/* Export to JSON */}
        <Button
          aria-label={'Export all logs to JSON'}
          disabled={!hasLogs || isExporting}
          onClick={handleExportJson}
          size={'sm'}
          variant={'outline'}
        >
          {isExportingJson ? (
            <Loader2 className={'size-4 animate-spin'} />
          ) : (
            <FileJson className={'size-4'} />
          )}
          Export JSON
        </Button>

        {/* Export to CSV */}
        <Button
          aria-label={'Export summary to CSV'}
          disabled={!hasLogs || isExporting}
          onClick={handleExportCsv}
          size={'sm'}
          variant={'outline'}
        >
          {isExportingCsv ? (
            <Loader2 className={'size-4 animate-spin'} />
          ) : (
            <FileSpreadsheet className={'size-4'} />
          )}
          Export CSV
        </Button>

        {/* Copy Selected */}
        <Button
          aria-label={'Copy selected logs to clipboard'}
          disabled={!hasSelectedLogs}
          onClick={handleCopySelected}
          size={'sm'}
          variant={'outline'}
        >
          {isCopied ? <Check className={'size-4'} /> : <Copy className={'size-4'} />}
          {isCopied ? 'Copied!' : `Copy Selected (${selectedLogs.length})`}
        </Button>
      </div>

      {/* Destructive Controls */}
      <div className={'flex items-center gap-2'}>
        {/* Clear All Dialog */}
        <DialogRoot onOpenChange={setIsClearDialogOpen} open={isClearDialogOpen}>
          <DialogTrigger>
            <Button
              aria-label={'Clear all logs'}
              disabled={!hasLogs}
              size={'sm'}
              variant={'destructive'}
            >
              <Trash2 className={'size-4'} />
              Clear All
            </Button>
          </DialogTrigger>
          <DialogPortal>
            <DialogBackdrop />
            <DialogPopup>
              <DialogTitle>Clear All Logs</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete all {logs.length} log entries? This action cannot be
                undone.
              </DialogDescription>

              {/* Actions */}
              <div className={'mt-6 flex justify-end gap-3'}>
                <DialogClose>
                  <Button size={'sm'} variant={'outline'}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button onClick={handleClearAll} size={'sm'} variant={'destructive'}>
                  <Trash2 className={'size-4'} />
                  Delete All Logs
                </Button>
              </div>
            </DialogPopup>
          </DialogPortal>
        </DialogRoot>

        {/* Purge Old Logs Dialog */}
        <DialogRoot onOpenChange={setIsPurgeDialogOpen} open={isPurgeDialogOpen}>
          <DialogTrigger>
            <Button
              aria-label={'Purge old logs'}
              disabled={!hasLogs || isPurging}
              size={'sm'}
              variant={'outline'}
            >
              <Download className={'size-4 rotate-180'} />
              Purge Old
            </Button>
          </DialogTrigger>
          <DialogPortal>
            <DialogBackdrop />
            <DialogPopup>
              <DialogTitle>Purge Old Logs</DialogTitle>
              <DialogDescription>
                Delete log entries older than a specified time period. This action cannot be undone.
              </DialogDescription>

              {/* Retention Period Selector */}
              <div className={'mt-4'}>
                <label className={'mb-2 block text-sm font-medium text-foreground'}>
                  Delete logs:
                </label>
                <SelectRoot<string> onValueChange={handleRetentionChange} value={retentionPeriod}>
                  <SelectTrigger aria-label={'Select retention period'}>
                    <SelectValue placeholder={retentionLabel} />
                  </SelectTrigger>
                  <SelectPortal>
                    <SelectPositioner>
                      <SelectPopup>
                        <SelectList>
                          {RETENTION_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectList>
                      </SelectPopup>
                    </SelectPositioner>
                  </SelectPortal>
                </SelectRoot>
              </div>

              {/* Actions */}
              <div className={'mt-6 flex justify-end gap-3'}>
                <DialogClose>
                  <Button size={'sm'} variant={'outline'}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  disabled={isPurging}
                  onClick={handlePurgeOldLogs}
                  size={'sm'}
                  variant={'destructive'}
                >
                  {isPurging && <Loader2 className={'size-4 animate-spin'} />}
                  <Trash2 className={'size-4'} />
                  Purge Logs
                </Button>
              </div>
            </DialogPopup>
          </DialogPortal>
        </DialogRoot>
      </div>
    </div>
  );
};
