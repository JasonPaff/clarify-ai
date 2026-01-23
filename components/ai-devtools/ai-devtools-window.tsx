'use client';

import type { KeyboardEvent } from 'react';

import { Activity, Bug, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { AiLog } from '@/db/schema/ai-logs.schema';
import type { AiLogEntry } from '@/types/ai-log';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAiLogs, useAiLogsCount } from '@/hooks/queries/use-ai-logs';
import { cn } from '@/lib/utils';

import type { LogFilterState } from './log-filter-toolbar';

import { ExportControls } from './export-controls';
import { LogDetailView } from './log-detail-view';
import { LogEntry } from './log-entry';
import { DEFAULT_FILTER_STATE, LogFilterToolbar, toAiLogFilterParams } from './log-filter-toolbar';

/**
 * Refetch interval for real-time updates (in milliseconds).
 */
const REFETCH_INTERVAL_MS = 3000;

/**
 * Maps database workflow step names to the interface workflow step names.
 * Database uses short names (clarify, plan) while interface uses full names (clarification, planning).
 */
const mapDbWorkflowStep = (dbStep: AiLog['workflowStep']): AiLogEntry['workflowStep'] => {
  if (!dbStep) return 'planning';
  const stepMap: Record<string, AiLogEntry['workflowStep']> = {
    clarify: 'clarification',
    describe: 'overview',
    discover: 'discovery',
    other: 'planning',
    plan: 'planning',
  };
  return stepMap[dbStep] ?? 'planning';
};

/**
 * Maps database status to interface status.
 * Database has 'cancelled' which maps to 'failed' in the interface.
 */
const mapDbStatus = (dbStatus: AiLog['status']): AiLogEntry['status'] => {
  if (dbStatus === 'cancelled') return 'failed';
  return dbStatus as AiLogEntry['status'];
};

/**
 * Transforms a database AiLog entry (with null values) to AiLogEntry (with undefined values).
 * This is necessary because SQLite/Drizzle uses null for optional fields while
 * the TypeScript interface uses undefined.
 */
const transformDbLogToEntry = (dbLog: AiLog): AiLogEntry => ({
  completedAt: dbLog.completedAt ?? undefined,
  createdAt: dbLog.createdAt,
  durationMs: dbLog.durationMs ?? undefined,
  errorMessage: dbLog.errorMessage ?? undefined,
  featureRequestId: dbLog.featureRequestId ?? undefined,
  id: dbLog.id,
  inputTokens: dbLog.inputTokens ?? undefined,
  modelId: dbLog.modelId,
  outputTokens: dbLog.outputTokens ?? undefined,
  projectId: dbLog.projectId ?? undefined,
  reasoningTokens: dbLog.reasoningTokens ?? undefined,
  requestBody: dbLog.requestBody ?? undefined,
  requestId: dbLog.requestId,
  responseBody: dbLog.responseBody ?? undefined,
  startedAt: dbLog.startedAt ?? undefined,
  status: mapDbStatus(dbLog.status),
  streamChunks: dbLog.streamChunks ?? undefined,
  toolCalls: dbLog.toolCalls ?? undefined,
  updatedAt: dbLog.updatedAt,
  workflowStep: mapDbWorkflowStep(dbLog.workflowStep),
});

/**
 * Main DevTools window component for viewing AI debug logs.
 * Combines filter toolbar, log list, detail panel, and export controls
 * into a complete DevTools experience with real-time updates.
 */
export const AiDevtoolsWindow = () => {
  const [filters, setFilters] = useState<LogFilterState>(DEFAULT_FILTER_STATE);
  const [selectedLogId, setSelectedLogId] = useState<null | number>(null);
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);

  const logListRef = useRef<HTMLDivElement>(null);
  const selectedLogRef = useRef<HTMLDivElement>(null);

  const filterParams = useMemo(() => toAiLogFilterParams(filters), [filters]);

  const {
    data: logsResult,
    isLoading: isLoadingLogs,
    refetch: refetchLogs,
  } = useAiLogs({
    ...filterParams,
    limit: 100,
  });

  const { data: totalCount } = useAiLogsCount(filterParams);

  // Set up real-time refetching
  useEffect(() => {
    if (!isAutoRefreshEnabled) return;

    const intervalId = setInterval(() => {
      void refetchLogs();
    }, REFETCH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [isAutoRefreshEnabled, refetchLogs]);

  const logs = useMemo(
    () => (logsResult?.entries ?? []).map(transformDbLogToEntry),
    [logsResult?.entries]
  );
  const displayedCount = logs.length;
  const totalLogCount = totalCount ?? 0;

  const selectedLog = useMemo(() => {
    if (selectedLogId === null) return null;
    return logs.find((log) => log.id === selectedLogId) ?? null;
  }, [logs, selectedLogId]);

  const selectedLogs = useMemo(() => {
    return selectedLog ? [selectedLog] : [];
  }, [selectedLog]);

  // Extract unique model IDs for filter dropdown
  const availableModels = useMemo(() => {
    const modelIds = new Set<string>();
    for (const log of logs) {
      modelIds.add(log.modelId);
    }
    return Array.from(modelIds).sort();
  }, [logs]);

  const handleFilterChange = useCallback((newFilters: LogFilterState) => {
    setFilters(newFilters);
    setSelectedLogId(null);
  }, []);

  const handleLogSelect = useCallback((log: AiLogEntry) => {
    setSelectedLogId((prevId) => (prevId === log.id ? null : log.id));
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedLogId(null);
  }, []);

  const handleRefreshClick = useCallback(() => {
    void refetchLogs();
  }, [refetchLogs]);

  const handleToggleAutoRefreshClick = useCallback(() => {
    setIsAutoRefreshEnabled((prev) => !prev);
  }, []);

  const handleClearLogs = useCallback(() => {
    setSelectedLogId(null);
    void refetchLogs();
  }, [refetchLogs]);

  // Keyboard navigation for log list
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (logs.length === 0) return;

      const currentIndex = selectedLogId !== null ? logs.findIndex((log) => log.id === selectedLogId) : -1;

      switch (event.key) {
        case 'ArrowDown': {
          event.preventDefault();
          const nextIndex = currentIndex < logs.length - 1 ? currentIndex + 1 : 0;
          const nextLog = logs[nextIndex];
          if (nextLog) {
            setSelectedLogId(nextLog.id);
          }
          break;
        }
        case 'ArrowUp': {
          event.preventDefault();
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : logs.length - 1;
          const prevLog = logs[prevIndex];
          if (prevLog) {
            setSelectedLogId(prevLog.id);
          }
          break;
        }
        case 'Enter': {
          event.preventDefault();
          // Toggle detail view
          if (selectedLogId !== null) {
            // Already selected, do nothing special - detail view is already shown
          }
          break;
        }
        case 'Escape': {
          event.preventDefault();
          setSelectedLogId(null);
          break;
        }
      }
    },
    [logs, selectedLogId]
  );

  // Scroll selected log into view
  useEffect(() => {
    if (selectedLogRef.current) {
      selectedLogRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedLogId]);

  const hasLogs = logs.length > 0;
  const isShowDetailPanel = selectedLog !== null;
  const isShowEmptyState = !isLoadingLogs && !hasLogs;
  const hasActiveFilters =
    filters.selectedStatuses.length > 0 || filters.selectedWorkflowSteps.length > 0 || Boolean(filters.searchQuery);
  const isShowLoadMoreIndicator = hasLogs && displayedCount < totalLogCount;

  return (
    <div className={'flex h-full flex-col overflow-hidden bg-background'}>
      {/* Header Bar */}
      <div className={'flex items-center justify-between border-b border-border px-4 py-3'}>
        {/* Title and Status */}
        <div className={'flex items-center gap-3'}>
          <div className={'flex items-center gap-2'}>
            <Bug className={'size-5 text-accent'} />
            <h1 className={'text-lg font-semibold'}>AI Debug Logs</h1>
          </div>
          <Badge size={'sm'} variant={'default'}>
            {displayedCount} / {totalLogCount.toLocaleString()} logs
          </Badge>
          {isAutoRefreshEnabled && (
            <div className={'flex items-center gap-1.5 text-xs text-muted-foreground'}>
              <Activity className={'size-3 animate-pulse text-green-500'} />
              Live
            </div>
          )}
        </div>

        {/* Refresh Controls */}
        <div className={'flex items-center gap-2'}>
          <Button
            aria-label={isAutoRefreshEnabled ? 'Disable auto-refresh' : 'Enable auto-refresh'}
            onClick={handleToggleAutoRefreshClick}
            size={'sm'}
            variant={isAutoRefreshEnabled ? 'default' : 'outline'}
          >
            <Activity className={'size-4'} />
            {isAutoRefreshEnabled ? 'Auto' : 'Manual'}
          </Button>
          <Button aria-label={'Refresh logs'} onClick={handleRefreshClick} size={'sm'} variant={'outline'}>
            <RefreshCw className={cn('size-4', isLoadingLogs && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className={'border-b border-border px-4 py-3'}>
        <LogFilterToolbar
          availableModels={availableModels}
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* Main Content Area */}
      <div className={'flex min-h-0 flex-1'}>
        {/* Log List Panel */}
        <div
          className={cn(
            'flex min-h-0 flex-1 flex-col overflow-hidden border-r border-border',
            isShowDetailPanel && 'max-w-[50%]'
          )}
        >
          {/* Export Controls Bar */}
          <div className={'border-b border-border px-3 py-2'}>
            <ExportControls logs={logs} onClear={handleClearLogs} selectedLogs={selectedLogs} />
          </div>

          {/* Log List */}
          <div
            aria-label={'Log entries list'}
            className={'flex-1 overflow-y-auto p-3 focus:outline-none'}
            onKeyDown={handleKeyDown}
            ref={logListRef}
            role={'listbox'}
            tabIndex={0}
          >
            {/* Loading State */}
            {isLoadingLogs && !hasLogs && (
              <div className={'flex flex-col items-center justify-center py-12 text-muted-foreground'}>
                <RefreshCw className={'size-8 animate-spin'} />
                <p className={'mt-3 text-sm'}>Loading logs...</p>
              </div>
            )}

            {/* Empty State */}
            {isShowEmptyState && (
              <div className={'flex flex-col items-center justify-center py-12 text-center'}>
                <Bug className={'size-12 text-muted-foreground/50'} />
                <h3 className={'mt-4 text-lg font-medium text-foreground'}>No AI Logs Found</h3>
                <p className={'mt-2 max-w-sm text-sm text-muted-foreground'}>
                  AI operations will appear here when debug logging is enabled. Try running an AI
                  workflow or adjusting your filters.
                </p>
                {hasActiveFilters && (
                  <Button
                    className={'mt-4'}
                    onClick={() => handleFilterChange(DEFAULT_FILTER_STATE)}
                    size={'sm'}
                    variant={'outline'}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            )}

            {/* Log Entries */}
            {hasLogs && (
              <div className={'space-y-2'}>
                {logs.map((log) => {
                  const isSelected = selectedLogId === log.id;
                  return (
                    <div
                      aria-selected={isSelected}
                      key={log.id}
                      ref={isSelected ? selectedLogRef : undefined}
                      role={'option'}
                    >
                      <LogEntry
                        className={cn(
                          'cursor-pointer transition-all',
                          isSelected && 'ring-2 ring-accent ring-offset-2 ring-offset-background'
                        )}
                        log={log}
                        onClick={() => handleLogSelect(log)}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Load More Indicator */}
            {isShowLoadMoreIndicator && (
              <div className={'mt-4 text-center text-sm text-muted-foreground'}>
                Showing {displayedCount} of {totalLogCount.toLocaleString()} logs. Apply filters to narrow
                results.
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        {isShowDetailPanel && selectedLog && (
          <div className={'flex min-h-0 w-1/2 flex-col overflow-hidden'}>
            <LogDetailView className={'h-full'} log={selectedLog} onClose={handleCloseDetail} />
          </div>
        )}
      </div>
    </div>
  );
};
