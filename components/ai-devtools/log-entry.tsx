'use client';

import type { ComponentPropsWithRef, MouseEvent, ReactNode } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import { format } from 'date-fns';
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Hourglass,
  Loader2,
  XCircle,
  Zap,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import type { AiLogEntry, AiLogStatus, AiLogWorkflowStep, ParsedStreamChunks, ParsedToolCalls } from '@/types/ai-log';

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
 * Status indicator variants for log entry states.
 */
export const statusIndicatorVariants = cva(
  `
    inline-flex items-center justify-center rounded-full
  `,
  {
    defaultVariants: {
      size: 'default',
      status: 'pending',
    },
    variants: {
      size: {
        default: 'size-5',
        sm: 'size-4',
      },
      status: {
        cancelled: 'text-amber-600 dark:text-amber-400',
        completed: 'text-green-600 dark:text-green-400',
        failed: 'text-red-600 dark:text-red-400',
        pending: 'text-muted-foreground',
        streaming: 'text-blue-600 dark:text-blue-400',
      },
    },
  }
);

/**
 * Workflow step badge variants for visual differentiation.
 */
export const workflowStepBadgeVariants = cva(
  `
    inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium
  `,
  {
    defaultVariants: {
      step: 'clarify',
    },
    variants: {
      step: {
        clarify: 'bg-yellow-500/15 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400',
        describe: 'bg-cyan-500/15 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400',
        discover: 'bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
        other: 'bg-gray-500/15 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400',
        plan: 'bg-purple-500/15 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
      },
    },
  }
);

type StatusIndicatorProps = ComponentPropsWithRef<'span'> & VariantProps<typeof statusIndicatorVariants>;

const StatusIndicator = ({ className, ref, size, status, ...props }: StatusIndicatorProps) => {
  const iconClass = size === 'sm' ? 'size-3' : 'size-4';

  const icon = useMemo(() => {
    switch (status) {
      case 'cancelled':
        return <XCircle className={iconClass} />;
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
  }, [status, iconClass]);

  return (
    <span className={cn(statusIndicatorVariants({ className, size, status }))} ref={ref} {...props}>
      {icon}
    </span>
  );
};

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
 * Formats JSON content for display with proper indentation.
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

interface ExpandableSectionProps {
  children: ReactNode;
  isDefaultOpen?: boolean;
  onCopy?: () => void;
  title: string;
}

const ExpandableSection = ({ children, isDefaultOpen = false, onCopy, title }: ExpandableSectionProps) => {
  const [isOpen, setIsOpen] = useState(isDefaultOpen);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyClick = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation();
      onCopy?.();
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    },
    [onCopy]
  );

  return (
    <Collapsible onOpenChange={setIsOpen} open={isOpen}>
      <div className={'flex items-center justify-between'}>
        <CollapsibleTrigger
          className={'flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground'}
          isHideChevron
        >
          {isOpen ? <ChevronDown className={'size-3'} /> : <ChevronRight className={'size-3'} />}
          {title}
        </CollapsibleTrigger>
        {onCopy && (
          <Tooltip content={isCopied ? 'Copied!' : 'Copy to clipboard'}>
            <IconButton aria-label={'Copy to clipboard'} className={'size-6'} onClick={handleCopyClick} type={'button'}>
              {isCopied ? <Check className={'size-3'} /> : <Copy className={'size-3'} />}
            </IconButton>
          </Tooltip>
        )}
      </div>
      <CollapsibleContent>
        <div className={'rounded-md bg-muted/50 p-2'}>{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
};

interface TruncatedContentProps {
  content: string;
  isShowFullByDefault?: boolean;
  threshold?: number;
}

const TruncatedContent = ({
  content,
  isShowFullByDefault = false,
  threshold = TRUNCATION_THRESHOLDS.PREVIEW,
}: TruncatedContentProps) => {
  const [isShowFull, setIsShowFull] = useState(isShowFullByDefault);
  const { isTruncated, text } = truncateContent(content, threshold);
  const maskedContent = maskSensitiveData(isShowFull ? content : text);

  const handleToggleClick = () => {
    setIsShowFull(!isShowFull);
  };

  return (
    <div>
      <pre className={'overflow-x-auto font-mono text-xs break-all whitespace-pre-wrap'}>{maskedContent}</pre>
      {isTruncated && (
        <Button className={'mt-1 h-6 px-2 text-xs'} onClick={handleToggleClick} variant={'ghost'}>
          {isShowFull ? 'Show less' : `Show more (${content.length.toLocaleString()} chars)`}
        </Button>
      )}
    </div>
  );
};

interface ToolCallDisplayProps {
  toolCall: ParsedToolCalls[number];
}

const ToolCallDisplay = ({ toolCall }: ToolCallDisplayProps) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyClick = useCallback(async () => {
    const success = await copyToClipboard(JSON.stringify(toolCall, null, 2));
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  }, [toolCall]);

  const statusColor =
    toolCall.status === 'completed'
      ? 'text-green-600 dark:text-green-400'
      : toolCall.status === 'failed'
        ? 'text-red-600 dark:text-red-400'
        : 'text-muted-foreground';

  return (
    <div className={'rounded-md border border-border bg-background p-2'}>
      {/* Tool Call Header */}
      <div className={'flex items-center justify-between'}>
        <div className={'flex items-center gap-2'}>
          <Zap className={'size-3 text-muted-foreground'} />
          <span className={'font-mono text-xs font-medium'}>{toolCall.toolName}</span>
          <span className={cn('text-xs', statusColor)}>{toolCall.status}</span>
          {toolCall.durationMs && <span className={'text-xs text-muted-foreground'}>{toolCall.durationMs}ms</span>}
        </div>
        <Tooltip content={isCopied ? 'Copied!' : 'Copy tool call'}>
          <IconButton aria-label={'Copy tool call'} className={'size-6'} onClick={handleCopyClick} type={'button'}>
            {isCopied ? <Check className={'size-3'} /> : <Copy className={'size-3'} />}
          </IconButton>
        </Tooltip>
      </div>

      {/* Arguments */}
      {toolCall.args && (
        <div className={'mt-2'}>
          <span className={'text-xs text-muted-foreground'}>Arguments:</span>
          <TruncatedContent content={formatJsonContent(toolCall.args)} threshold={TRUNCATION_THRESHOLDS.PREVIEW} />
        </div>
      )}

      {/* Result */}
      {toolCall.result && (
        <div className={'mt-2'}>
          <span className={'text-xs text-muted-foreground'}>Result:</span>
          <TruncatedContent content={formatJsonContent(toolCall.result)} threshold={TRUNCATION_THRESHOLDS.PREVIEW} />
        </div>
      )}

      {/* Error */}
      {toolCall.error && (
        <div className={'mt-2'}>
          <span className={'text-xs text-red-600 dark:text-red-400'}>Error:</span>
          <pre className={'mt-1 font-mono text-xs whitespace-pre-wrap text-red-600 dark:text-red-400'}>
            {toolCall.error}
          </pre>
        </div>
      )}
    </div>
  );
};

interface StreamChunkDisplayProps {
  chunks: ParsedStreamChunks;
}

const StreamChunkDisplay = ({ chunks }: StreamChunkDisplayProps) => {
  const [isShowAll, setIsShowAll] = useState(false);
  const displayedChunks = isShowAll ? chunks : chunks.slice(0, 5);
  const hasMore = chunks.length > 5;

  const handleToggleClick = () => {
    setIsShowAll(!isShowAll);
  };

  return (
    <div className={'space-y-1'}>
      {displayedChunks.map((chunk, index) => (
        <div className={'flex items-start gap-2 text-xs'} key={`${chunk.timestamp}-${index}`}>
          <span className={'shrink-0 text-muted-foreground'}>[{chunk.index}]</span>
          <Badge className={'shrink-0'} size={'sm'} variant={'default'}>
            {chunk.type}
          </Badge>
          <span className={'line-clamp-2 font-mono'}>{chunk.content}</span>
        </div>
      ))}
      {hasMore && (
        <Button className={'h-6 px-2 text-xs'} onClick={handleToggleClick} variant={'ghost'}>
          {isShowAll ? 'Show fewer chunks' : `Show all ${chunks.length} chunks`}
        </Button>
      )}
    </div>
  );
};

interface LogEntryProps extends ComponentPropsWithRef<'div'> {
  isExpanded?: boolean;
  log: AiLogEntry;
  onToggleExpand?: () => void;
}

export const LogEntry = ({ className, isExpanded = false, log, onToggleExpand, ref, ...props }: LogEntryProps) => {
  const [isLocalExpanded, setIsLocalExpanded] = useState(isExpanded);

  const isControlled = onToggleExpand !== undefined;
  const isCurrentlyExpanded = isControlled ? isExpanded : isLocalExpanded;

  const handleToggleClick = useCallback(() => {
    if (isControlled) {
      onToggleExpand?.();
    } else {
      setIsLocalExpanded(!isLocalExpanded);
    }
  }, [isControlled, onToggleExpand, isLocalExpanded]);

  const handleCopyRequestBody = useCallback(async () => {
    if (log.requestBody) {
      await copyToClipboard(log.requestBody);
    }
  }, [log.requestBody]);

  const handleCopyResponseBody = useCallback(async () => {
    if (log.responseBody) {
      await copyToClipboard(log.responseBody);
    }
  }, [log.responseBody]);

  const parsedToolCalls = useMemo(() => safeJsonParse<ParsedToolCalls>(log.toolCalls) ?? [], [log.toolCalls]);

  const parsedStreamChunks = useMemo(
    () => safeJsonParse<ParsedStreamChunks>(log.streamChunks) ?? [],
    [log.streamChunks]
  );

  const formattedTimestamp = useMemo(() => {
    try {
      return format(new Date(log.createdAt), 'HH:mm:ss.SSS');
    } catch {
      return log.createdAt;
    }
  }, [log.createdAt]);

  const statusConfig = STATUS_DISPLAY_CONFIG[log.status as keyof typeof STATUS_DISPLAY_CONFIG];
  const workflowStepName = log.workflowStep ? WORKFLOW_STEP_DISPLAY_NAMES[log.workflowStep as AiLogWorkflowStep] : null;

  const hasRequestBody = Boolean(log.requestBody);
  const hasResponseBody = Boolean(log.responseBody);
  const hasToolCalls = parsedToolCalls.length > 0;
  const hasStreamChunks = parsedStreamChunks.length > 0;
  const hasExpandableContent = hasRequestBody || hasResponseBody || hasToolCalls || hasStreamChunks;
  const hasDuration = log.durationMs !== null && log.durationMs !== undefined;
  const hasTokenUsage = Boolean(log.inputTokens || log.outputTokens);
  const isShowExpandedContent = isCurrentlyExpanded && hasExpandableContent;

  return (
    <div
      className={cn('rounded-md border border-border bg-card transition-colors hover:bg-card/80', className)}
      ref={ref}
      {...props}
    >
      {/* Summary Row */}
      <button
        className={cn('flex w-full items-center gap-3 px-3 py-2 text-left', hasExpandableContent && 'cursor-pointer')}
        disabled={!hasExpandableContent}
        onClick={handleToggleClick}
        type={'button'}
      >
        {/* Expand Chevron */}
        {hasExpandableContent && (
          <span className={'shrink-0 text-muted-foreground'}>
            {isCurrentlyExpanded ? <ChevronDown className={'size-4'} /> : <ChevronRight className={'size-4'} />}
          </span>
        )}

        {/* Timestamp */}
        <span className={'shrink-0 font-mono text-xs text-muted-foreground'}>{formattedTimestamp}</span>

        {/* Workflow Step Badge */}
        {workflowStepName && (
          <span className={workflowStepBadgeVariants({ step: log.workflowStep as AiLogWorkflowStep })}>
            {workflowStepName}
          </span>
        )}

        {/* Model Badge */}
        <Badge size={'sm'} variant={'default'}>
          {log.modelId}
        </Badge>

        {/* Status Indicator */}
        <Tooltip content={statusConfig?.label ?? log.status}>
          <StatusIndicator size={'sm'} status={log.status as AiLogStatus} />
        </Tooltip>

        {/* Duration */}
        {hasDuration && <span className={'shrink-0 text-xs text-muted-foreground'}>{log.durationMs}ms</span>}

        {/* Token Usage */}
        {hasTokenUsage && (
          <span className={'ml-auto shrink-0 text-xs text-muted-foreground'}>
            {log.inputTokens?.toLocaleString() ?? 0} / {log.outputTokens?.toLocaleString() ?? 0} tokens
          </span>
        )}
      </button>

      {/* Expanded Content */}
      {isShowExpandedContent && (
        <div className={'space-y-2 border-t border-border px-3 py-2'}>
          {/* Error Message */}
          {log.errorMessage && (
            <div className={'rounded-md bg-red-500/10 p-2'}>
              <span className={'text-xs font-medium text-red-600 dark:text-red-400'}>Error: </span>
              <span className={'text-xs text-red-600 dark:text-red-400'}>{log.errorMessage}</span>
            </div>
          )}

          {/* Request Body Section */}
          {hasRequestBody && (
            <ExpandableSection onCopy={handleCopyRequestBody} title={'Request Body'}>
              <TruncatedContent
                content={formatJsonContent(log.requestBody!)}
                threshold={TRUNCATION_THRESHOLDS.DETAILED}
              />
            </ExpandableSection>
          )}

          {/* Response Body Section */}
          {hasResponseBody && (
            <ExpandableSection onCopy={handleCopyResponseBody} title={'Response Body'}>
              <TruncatedContent
                content={formatJsonContent(log.responseBody!)}
                threshold={TRUNCATION_THRESHOLDS.DETAILED}
              />
            </ExpandableSection>
          )}

          {/* Tool Calls Section */}
          {hasToolCalls && (
            <ExpandableSection title={`Tool Calls (${parsedToolCalls.length})`}>
              <div className={'space-y-2'}>
                {parsedToolCalls.map((toolCall) => (
                  <ToolCallDisplay key={toolCall.id} toolCall={toolCall} />
                ))}
              </div>
            </ExpandableSection>
          )}

          {/* Stream Chunks Section */}
          {hasStreamChunks && (
            <ExpandableSection title={`Stream Chunks (${parsedStreamChunks.length})`}>
              <StreamChunkDisplay chunks={parsedStreamChunks} />
            </ExpandableSection>
          )}
        </div>
      )}
    </div>
  );
};
