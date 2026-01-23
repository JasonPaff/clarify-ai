'use client';

import type { ComponentPropsWithRef, ReactNode } from 'react';

import { format, formatDistanceStrict } from 'date-fns';
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Hash,
  Hourglass,
  Loader2,
  Zap,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import type {
  AiLogEntry,
  AiLogStatus,
  AiLogWorkflowStep,
  ParsedStreamChunks,
  ParsedToolCalls,
} from '@/types/ai-log';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { IconButton } from '@/components/ui/icon-button';
import { Tooltip } from '@/components/ui/tooltip';
import {
  SENSITIVE_DATA_PATTERNS,
  STATUS_DISPLAY_CONFIG,
  TRUNCATION_THRESHOLDS,
  WORKFLOW_STEP_DISPLAY_NAMES,
} from '@/lib/ai/debug-logging/constants';
import { cn } from '@/lib/utils';

/**
 * Masks sensitive data in content for display purposes.
 */
const maskSensitiveData = (content: string): string => {
  let maskedContent = content;
  for (const { pattern, replacement } of SENSITIVE_DATA_PATTERNS) {
    maskedContent = maskedContent.replace(pattern, replacement);
  }
  return maskedContent;
};

/**
 * Truncates content if it exceeds the threshold.
 */
const truncateContent = (content: string, threshold: number): { isTruncated: boolean; text: string } => {
  if (content.length <= threshold) {
    return { isTruncated: false, text: content };
  }
  return { isTruncated: true, text: content.slice(0, threshold) };
};

/**
 * Safely parses JSON with error handling.
 */
const safeJsonParse = <T,>(jsonString: null | string | undefined): null | T => {
  if (!jsonString) return null;
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return null;
  }
};

/**
 * Formats JSON content for display with proper indentation and syntax highlighting markers.
 */
const formatJsonContent = (content: string): string => {
  try {
    const parsed = JSON.parse(content) as unknown;
    return JSON.stringify(parsed, null, 2);
  } catch {
    return content;
  }
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

/**
 * Format a duration in milliseconds to a human-readable string.
 */
const formatDuration = (ms: number): string => {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  return `${(ms / 60000).toFixed(2)}m`;
};

interface MetadataRowProps {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
}

const MetadataRow = ({ icon, label, value }: MetadataRowProps) => {
  return (
    <div className={'flex items-center gap-2 text-sm'}>
      {icon && <span className={'text-muted-foreground'}>{icon}</span>}
      <span className={'text-muted-foreground'}>{label}:</span>
      <span className={'font-medium'}>{value}</span>
    </div>
  );
};

interface StatusIndicatorLargeProps {
  status: AiLogStatus;
}

const StatusIndicatorLarge = ({ status }: StatusIndicatorLargeProps) => {
  const statusConfig = STATUS_DISPLAY_CONFIG[status];
  const iconClass = 'size-5';

  const icon = useMemo(() => {
    switch (status) {
      case 'completed':
        return <Check className={iconClass} />;
      case 'failed':
        return <AlertCircle className={iconClass} />;
      case 'pending':
        return <Hourglass className={iconClass} />;
      case 'streaming':
        return <Loader2 className={cn(iconClass, 'animate-spin')} />;
      default:
        return <Clock className={iconClass} />;
    }
  }, [status]);

  const colorClass = useMemo(() => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
      case 'pending':
        return 'text-muted-foreground';
      case 'streaming':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-muted-foreground';
    }
  }, [status]);

  return (
    <div className={'flex items-center gap-2'}>
      <span className={colorClass}>{icon}</span>
      <span className={cn('font-medium', colorClass)}>{statusConfig.label}</span>
    </div>
  );
};

interface CollapsibleSectionProps {
  children: ReactNode;
  isDefaultOpen?: boolean;
  onCopy?: () => void;
  title: string;
}

const CollapsibleSection = ({ children, isDefaultOpen = false, onCopy, title }: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(isDefaultOpen);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyClick = useCallback(() => {
    onCopy?.();
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [onCopy]);

  return (
    <Collapsible onOpenChange={setIsOpen} open={isOpen}>
      <div className={'flex items-center justify-between border-b border-border pb-2'}>
        <CollapsibleTrigger className={'flex items-center gap-2 text-sm font-medium text-foreground hover:text-accent'}>
          {isOpen ? <ChevronDown className={'size-4'} /> : <ChevronRight className={'size-4'} />}
          {title}
        </CollapsibleTrigger>
        {onCopy && (
          <Tooltip content={isCopied ? 'Copied!' : 'Copy to clipboard'}>
            <IconButton
              aria-label={'Copy to clipboard'}
              className={'size-7'}
              onClick={handleCopyClick}
              type={'button'}
            >
              {isCopied ? <Check className={'size-4'} /> : <Copy className={'size-4'} />}
            </IconButton>
          </Tooltip>
        )}
      </div>
      <CollapsibleContent>
        <div className={'mt-3'}>{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
};

interface TruncatedJsonContentProps {
  content: string;
  isShowFullByDefault?: boolean;
  threshold?: number;
}

const TruncatedJsonContent = ({
  content,
  isShowFullByDefault = false,
  threshold = TRUNCATION_THRESHOLDS.DETAILED,
}: TruncatedJsonContentProps) => {
  const [isShowFull, setIsShowFull] = useState(isShowFullByDefault);

  const formattedContent = formatJsonContent(content);
  const { isTruncated, text } = truncateContent(formattedContent, threshold);
  const maskedContent = maskSensitiveData(isShowFull ? formattedContent : text);

  const handleToggleClick = () => {
    setIsShowFull(!isShowFull);
  };

  return (
    <div className={'rounded-md bg-muted/50 p-3'}>
      <pre className={'overflow-x-auto font-mono text-xs/relaxed break-all whitespace-pre-wrap'}>
        {maskedContent}
      </pre>
      {isTruncated && (
        <div className={'mt-2 border-t border-border pt-2'}>
          <Button className={'h-7 px-3 text-xs'} onClick={handleToggleClick} variant={'ghost'}>
            {isShowFull ? 'Show less' : `Show more (${formattedContent.length.toLocaleString()} chars total)`}
          </Button>
        </div>
      )}
    </div>
  );
};

interface ToolCallTimelineItemProps {
  toolCall: ParsedToolCalls[number];
}

const ToolCallTimelineItem = ({ toolCall }: ToolCallTimelineItemProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isArgsExpanded, setIsArgsExpanded] = useState(false);
  const [isResultExpanded, setIsResultExpanded] = useState(false);

  const handleCopyClick = useCallback(async () => {
    const success = await copyToClipboard(JSON.stringify(toolCall, null, 2));
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  }, [toolCall]);

  const handleToggleArgsClick = () => {
    setIsArgsExpanded(!isArgsExpanded);
  };

  const handleToggleResultClick = () => {
    setIsResultExpanded(!isResultExpanded);
  };

  const statusColor =
    toolCall.status === 'completed'
      ? 'bg-green-500'
      : toolCall.status === 'failed'
        ? 'bg-red-500'
        : toolCall.status === 'running'
          ? 'bg-blue-500'
          : 'bg-muted-foreground';

  const statusTextColor =
    toolCall.status === 'completed'
      ? 'text-green-600 dark:text-green-400'
      : toolCall.status === 'failed'
        ? 'text-red-600 dark:text-red-400'
        : toolCall.status === 'running'
          ? 'text-blue-600 dark:text-blue-400'
          : 'text-muted-foreground';

  const formattedArgs = toolCall.args ? formatJsonContent(toolCall.args) : null;
  const formattedResult = toolCall.result ? formatJsonContent(toolCall.result) : null;

  const isArgsLong = formattedArgs && formattedArgs.length > TRUNCATION_THRESHOLDS.PREVIEW;
  const isResultLong = formattedResult && formattedResult.length > TRUNCATION_THRESHOLDS.PREVIEW;

  return (
    <div className={'relative flex gap-4 pb-4 last:pb-0'}>
      {/* Timeline Line */}
      <div className={'absolute top-6 bottom-0 left-[7px] w-0.5 bg-border last:hidden'} />

      {/* Timeline Dot */}
      <div className={'relative z-10 flex size-4 shrink-0 items-center justify-center'}>
        <div className={cn('size-3 rounded-full', statusColor)} />
      </div>

      {/* Content */}
      <div className={'flex-1 rounded-md border border-border bg-card p-3'}>
        {/* Tool Call Header */}
        <div className={'flex items-center justify-between'}>
          <div className={'flex items-center gap-2'}>
            <Zap className={'size-4 text-muted-foreground'} />
            <span className={'font-mono text-sm font-medium'}>{toolCall.toolName}</span>
            <Badge className={statusTextColor} size={'sm'} variant={'default'}>
              {toolCall.status}
            </Badge>
            {toolCall.durationMs !== undefined && (
              <span className={'text-xs text-muted-foreground'}>{formatDuration(toolCall.durationMs)}</span>
            )}
          </div>
          <Tooltip content={isCopied ? 'Copied!' : 'Copy tool call JSON'}>
            <IconButton
              aria-label={'Copy tool call'}
              className={'size-7'}
              onClick={handleCopyClick}
              type={'button'}
            >
              {isCopied ? <Check className={'size-4'} /> : <Copy className={'size-4'} />}
            </IconButton>
          </Tooltip>
        </div>

        {/* Arguments */}
        {formattedArgs && (
          <div className={'mt-3'}>
            <div className={'flex items-center justify-between'}>
              <span className={'text-xs font-medium text-muted-foreground'}>Arguments</span>
              {isArgsLong && (
                <Button className={'h-6 px-2 text-xs'} onClick={handleToggleArgsClick} variant={'ghost'}>
                  {isArgsExpanded ? 'Collapse' : 'Expand'}
                </Button>
              )}
            </div>
            <div className={'mt-1 rounded-md bg-muted/50 p-2'}>
              <pre className={'overflow-x-auto font-mono text-xs break-all whitespace-pre-wrap'}>
                {maskSensitiveData(
                  isArgsExpanded || !isArgsLong
                    ? formattedArgs
                    : formattedArgs.slice(0, TRUNCATION_THRESHOLDS.PREVIEW) + '...'
                )}
              </pre>
            </div>
          </div>
        )}

        {/* Result */}
        {formattedResult && (
          <div className={'mt-3'}>
            <div className={'flex items-center justify-between'}>
              <span className={'text-xs font-medium text-muted-foreground'}>Result</span>
              {isResultLong && (
                <Button className={'h-6 px-2 text-xs'} onClick={handleToggleResultClick} variant={'ghost'}>
                  {isResultExpanded ? 'Collapse' : 'Expand'}
                </Button>
              )}
            </div>
            <div className={'mt-1 rounded-md bg-muted/50 p-2'}>
              <pre className={'overflow-x-auto font-mono text-xs break-all whitespace-pre-wrap'}>
                {maskSensitiveData(
                  isResultExpanded || !isResultLong
                    ? formattedResult
                    : formattedResult.slice(0, TRUNCATION_THRESHOLDS.PREVIEW) + '...'
                )}
              </pre>
            </div>
          </div>
        )}

        {/* Error */}
        {toolCall.error && (
          <div className={'mt-3'}>
            <span className={'text-xs font-medium text-red-600 dark:text-red-400'}>Error</span>
            <div className={'mt-1 rounded-md bg-red-500/10 p-2'}>
              <pre className={'font-mono text-xs whitespace-pre-wrap text-red-600 dark:text-red-400'}>
                {toolCall.error}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface StreamChunkListProps {
  chunks: ParsedStreamChunks;
}

const StreamChunkList = ({ chunks }: StreamChunkListProps) => {
  const [isShowAll, setIsShowAll] = useState(false);

  const displayedChunks = isShowAll ? chunks : chunks.slice(0, 10);
  const hasMore = chunks.length > 10;

  const handleToggleClick = () => {
    setIsShowAll(!isShowAll);
  };

  return (
    <div className={'space-y-2'}>
      {displayedChunks.map((chunk, index) => {
        const typeColor =
          chunk.type === 'text'
            ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
            : chunk.type === 'reasoning'
              ? 'bg-purple-500/15 text-purple-700 dark:text-purple-400'
              : chunk.type === 'tool-call'
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                : 'bg-green-500/15 text-green-700 dark:text-green-400';

        return (
          <div
            className={'flex items-start gap-3 rounded-md border border-border bg-card p-2'}
            key={`${chunk.timestamp}-${index}`}
          >
            <span className={'shrink-0 font-mono text-xs text-muted-foreground'}>[{chunk.index}]</span>
            <Badge className={cn('shrink-0', typeColor)} size={'sm'}>
              {chunk.type}
            </Badge>
            <span className={'line-clamp-3 flex-1 font-mono text-xs'}>{chunk.content}</span>
          </div>
        );
      })}
      {hasMore && (
        <div className={'pt-2'}>
          <Button className={'h-7 px-3 text-xs'} onClick={handleToggleClick} variant={'ghost'}>
            {isShowAll ? 'Show fewer chunks' : `Show all ${chunks.length.toLocaleString()} chunks`}
          </Button>
        </div>
      )}
    </div>
  );
};

interface LogDetailViewProps extends ComponentPropsWithRef<'div'> {
  log: AiLogEntry;
  onClose?: () => void;
}

/**
 * Detailed view panel for a selected AI log entry.
 * Displays full log information with proper formatting including:
 * - Request metadata (ID, timestamps, duration, tokens)
 * - Request body with JSON formatting
 * - Response body with truncation and "Show more" for large content
 * - Tool calls in timeline format
 * - Stream chunks (collapsed by default)
 * - Copy-all functionality
 */
export const LogDetailView = ({ className, log, onClose, ref, ...props }: LogDetailViewProps) => {
  const [isCopied, setIsCopied] = useState(false);

  const parsedToolCalls = useMemo(() => safeJsonParse<ParsedToolCalls>(log.toolCalls) ?? [], [log.toolCalls]);

  const parsedStreamChunks = useMemo(
    () => safeJsonParse<ParsedStreamChunks>(log.streamChunks) ?? [],
    [log.streamChunks]
  );

  const handleCopyAllClick = useCallback(async () => {
    const logData = {
      completedAt: log.completedAt,
      createdAt: log.createdAt,
      durationMs: log.durationMs,
      errorMessage: log.errorMessage,
      featureRequestId: log.featureRequestId,
      id: log.id,
      inputTokens: log.inputTokens,
      modelId: log.modelId,
      outputTokens: log.outputTokens,
      projectId: log.projectId,
      reasoningTokens: log.reasoningTokens,
      requestBody: log.requestBody ? safeJsonParse(log.requestBody) : null,
      requestId: log.requestId,
      responseBody: log.responseBody ? safeJsonParse(log.responseBody) : null,
      startedAt: log.startedAt,
      status: log.status,
      streamChunks: parsedStreamChunks,
      toolCalls: parsedToolCalls,
      workflowStep: log.workflowStep,
    };

    const success = await copyToClipboard(JSON.stringify(logData, null, 2));
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  }, [log, parsedToolCalls, parsedStreamChunks]);

  const handleCopyRequestBody = useCallback(async () => {
    if (log.requestBody) {
      await copyToClipboard(formatJsonContent(log.requestBody));
    }
  }, [log.requestBody]);

  const handleCopyResponseBody = useCallback(async () => {
    if (log.responseBody) {
      await copyToClipboard(formatJsonContent(log.responseBody));
    }
  }, [log.responseBody]);

  const formattedCreatedAt = useMemo(() => {
    try {
      return format(new Date(log.createdAt), 'MMM d, yyyy HH:mm:ss.SSS');
    } catch {
      return log.createdAt;
    }
  }, [log.createdAt]);

  const formattedStartedAt = useMemo(() => {
    if (!log.startedAt) return null;
    try {
      return format(new Date(log.startedAt), 'HH:mm:ss.SSS');
    } catch {
      return log.startedAt;
    }
  }, [log.startedAt]);

  const formattedCompletedAt = useMemo(() => {
    if (!log.completedAt) return null;
    try {
      return format(new Date(log.completedAt), 'HH:mm:ss.SSS');
    } catch {
      return log.completedAt;
    }
  }, [log.completedAt]);

  const formattedDuration = useMemo(() => {
    if (log.durationMs === null || log.durationMs === undefined) return null;
    return formatDuration(log.durationMs);
  }, [log.durationMs]);

  const timeSinceCreated = useMemo(() => {
    try {
      return formatDistanceStrict(new Date(log.createdAt), new Date(), { addSuffix: true });
    } catch {
      return null;
    }
  }, [log.createdAt]);

  const workflowStepName = log.workflowStep
    ? WORKFLOW_STEP_DISPLAY_NAMES[log.workflowStep as AiLogWorkflowStep]
    : null;

  const hasRequestBody = Boolean(log.requestBody);
  const hasResponseBody = Boolean(log.responseBody);
  const hasToolCalls = parsedToolCalls.length > 0;
  const hasStreamChunks = parsedStreamChunks.length > 0;
  const hasTokenUsage = Boolean(log.inputTokens || log.outputTokens || log.reasoningTokens);
  const hasReasoningTokens = log.reasoningTokens !== undefined && log.reasoningTokens > 0;
  const hasInputAndOutputTokens = log.inputTokens !== undefined && log.outputTokens !== undefined;

  return (
    <div
      className={cn('flex h-full flex-col overflow-hidden rounded-lg border border-border bg-background', className)}
      ref={ref}
      {...props}
    >
      {/* Header */}
      <div className={'flex items-center justify-between border-b border-border px-4 py-3'}>
        <div className={'flex items-center gap-3'}>
          <StatusIndicatorLarge status={log.status as AiLogStatus} />
          {workflowStepName && (
            <Badge size={'sm'} variant={'default'}>
              {workflowStepName}
            </Badge>
          )}
        </div>
        <div className={'flex items-center gap-2'}>
          <Tooltip content={isCopied ? 'Copied!' : 'Copy entire log entry'}>
            <IconButton
              aria-label={'Copy entire log entry'}
              className={'size-8'}
              onClick={handleCopyAllClick}
              type={'button'}
            >
              {isCopied ? <Check className={'size-4'} /> : <Copy className={'size-4'} />}
            </IconButton>
          </Tooltip>
          {onClose && (
            <Button className={'h-8 px-3'} onClick={onClose} size={'sm'} variant={'ghost'}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={'flex-1 space-y-6 overflow-y-auto p-4'}>
        {/* Error Banner */}
        {log.errorMessage && (
          <div className={'rounded-md bg-red-500/10 p-4'}>
            <div className={'flex items-center gap-2'}>
              <AlertCircle className={'size-5 text-red-600 dark:text-red-400'} />
              <span className={'font-medium text-red-600 dark:text-red-400'}>Error</span>
            </div>
            <p className={'mt-2 text-sm text-red-600 dark:text-red-400'}>{log.errorMessage}</p>
          </div>
        )}

        {/* Metadata Section */}
        <div className={'space-y-3'}>
          <h3 className={'text-sm font-semibold text-foreground'}>Metadata</h3>
          <div className={'grid grid-cols-2 gap-3 rounded-md bg-muted/30 p-4'}>
            <MetadataRow icon={<Hash className={'size-4'} />} label={'Request ID'} value={log.requestId} />
            <MetadataRow label={'Model'} value={<Badge size={'sm'}>{log.modelId}</Badge>} />
            <MetadataRow label={'Created'} value={`${formattedCreatedAt} (${timeSinceCreated})`} />
            {formattedStartedAt && <MetadataRow label={'Started'} value={formattedStartedAt} />}
            {formattedCompletedAt && <MetadataRow label={'Completed'} value={formattedCompletedAt} />}
            {formattedDuration && (
              <MetadataRow icon={<Clock className={'size-4'} />} label={'Duration'} value={formattedDuration} />
            )}
          </div>
        </div>

        {/* Token Usage Section */}
        {hasTokenUsage && (
          <div className={'space-y-3'}>
            <h3 className={'text-sm font-semibold text-foreground'}>Token Usage</h3>
            <div className={'flex flex-wrap gap-4 rounded-md bg-muted/30 p-4'}>
              {log.inputTokens !== undefined && (
                <div className={'flex flex-col'}>
                  <span className={'text-xs text-muted-foreground'}>Input</span>
                  <span className={'text-lg font-semibold'}>{log.inputTokens.toLocaleString()}</span>
                </div>
              )}
              {log.outputTokens !== undefined && (
                <div className={'flex flex-col'}>
                  <span className={'text-xs text-muted-foreground'}>Output</span>
                  <span className={'text-lg font-semibold'}>{log.outputTokens.toLocaleString()}</span>
                </div>
              )}
              {hasReasoningTokens && (
                <div className={'flex flex-col'}>
                  <span className={'text-xs text-muted-foreground'}>Reasoning</span>
                  <span className={'text-lg font-semibold'}>{log.reasoningTokens?.toLocaleString()}</span>
                </div>
              )}
              {hasInputAndOutputTokens && (
                <div className={'ml-auto flex flex-col'}>
                  <span className={'text-xs text-muted-foreground'}>Total</span>
                  <span className={'text-lg font-semibold'}>
                    {(log.inputTokens! + log.outputTokens! + (log.reasoningTokens ?? 0)).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Request Body Section */}
        {hasRequestBody && (
          <CollapsibleSection isDefaultOpen onCopy={handleCopyRequestBody} title={'Request Body'}>
            <TruncatedJsonContent content={log.requestBody!} />
          </CollapsibleSection>
        )}

        {/* Response Body Section */}
        {hasResponseBody && (
          <CollapsibleSection isDefaultOpen onCopy={handleCopyResponseBody} title={'Response Body'}>
            <TruncatedJsonContent content={log.responseBody!} />
          </CollapsibleSection>
        )}

        {/* Tool Calls Section */}
        {hasToolCalls && (
          <CollapsibleSection isDefaultOpen title={`Tool Calls (${parsedToolCalls.length})`}>
            <div className={'space-y-0'}>
              {parsedToolCalls.map((toolCall) => (
                <ToolCallTimelineItem key={toolCall.id} toolCall={toolCall} />
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Stream Chunks Section */}
        {hasStreamChunks && (
          <CollapsibleSection title={`Stream Chunks (${parsedStreamChunks.length})`}>
            <StreamChunkList chunks={parsedStreamChunks} />
          </CollapsibleSection>
        )}

        {/* Correlation IDs */}
        {(log.projectId || log.featureRequestId) && (
          <div className={'space-y-3'}>
            <h3 className={'text-sm font-semibold text-foreground'}>Correlation</h3>
            <div className={'flex gap-4 rounded-md bg-muted/30 p-4'}>
              {log.projectId && <MetadataRow label={'Project ID'} value={log.projectId} />}
              {log.featureRequestId && <MetadataRow label={'Feature Request ID'} value={log.featureRequestId} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
