'use client';

import type { ComponentPropsWithRef } from 'react';

import { Progress } from '@base-ui/react/progress';
import { CheckCircle2, FileSearch, Loader2, XCircle } from 'lucide-react';

import type { DiscoveryStatus } from '@/lib/validations/discovery';

import { CancelAiDialog } from '@/components/features/workflow/cancel-ai-dialog';
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ui/ai/reasoning';
import { StreamingAnalysis } from '@/components/ui/ai/streaming-analysis';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type DiscoveryProgressProps = ComponentPropsWithRef<'div'> & {
  /** Current step text describing what is happening */
  currentStep?: string;
  /** Total count of files discovered so far */
  filesDiscovered?: number;
  /** Whether the discovery process is currently running */
  isLoading: boolean;
  /** Whether reasoning output is currently being streamed */
  isReasoningStreaming?: boolean;
  /** Callback when cancel is confirmed */
  onCancel?: () => void;
  /** Overall progress percentage (0-100) */
  percentage?: number;
  /** Reasoning output from the AI model */
  reasoning?: string;
  /** Per-repository progress information */
  repositoryProgress?: Array<RepositoryProgress>;
  /** Current discovery workflow status */
  status: DiscoveryStatus;
  /** Streaming text output from the AI model */
  streamingText?: string;
};

/** Repository scanning status for progress display */
interface RepositoryProgress {
  /** Number of files discovered in this repository */
  filesDiscovered?: number;
  /** Repository name/path for display */
  name: string;
  /** Repository ID */
  repositoryId: number;
  /** Current status of this repository scan */
  status: 'completed' | 'error' | 'pending' | 'scanning';
}

/**
 * Displays progress during the AI discovery process.
 * Shows overall progress bar, current step text, per-repository status,
 * and real-time file count with cancel capability.
 */
export const DiscoveryProgress = ({
  className,
  currentStep,
  filesDiscovered = 0,
  isLoading,
  isReasoningStreaming = false,
  onCancel,
  percentage = 0,
  reasoning,
  ref,
  repositoryProgress = [],
  status,
  streamingText,
  ...props
}: DiscoveryProgressProps) => {
  const isActive = status === 'scanning' || status === 'analyzing';
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';
  const isIdle = status === 'idle';

  // Derived conditions for UI rendering
  const shouldShowFileCount = (isActive || isCompleted) && filesDiscovered > 0;
  const hasRepositoryFilesDiscovered = (repo: RepositoryProgress) =>
    repo.filesDiscovered !== undefined && repo.filesDiscovered > 0;
  const shouldRender = !isIdle || isLoading;
  const hasReasoning = !!reasoning && reasoning.length > 0;

  const handleCancelConfirm = () => {
    onCancel?.();
  };

  // Get status-specific text
  const getStatusText = (): string => {
    if (currentStep) return currentStep;

    switch (status) {
      case 'analyzing':
        return 'Analyzing files for relevance...';
      case 'completed':
        return 'Discovery complete';
      case 'failed':
        return 'Discovery failed';
      case 'scanning':
        return 'Scanning repositories...';
      default:
        return 'Ready to start';
    }
  };

  // Get status icon
  const renderStatusIcon = () => {
    if (isLoading) {
      return <Loader2 className={'size-4 animate-spin text-accent'} />;
    }
    if (isCompleted) {
      return <CheckCircle2 className={'size-4 text-green-600 dark:text-green-400'} />;
    }
    if (isFailed) {
      return <XCircle className={'size-4 text-destructive'} />;
    }
    return <FileSearch className={'size-4 text-muted-foreground'} />;
  };

  // Don't render if idle and not loading
  if (!shouldRender) {
    return null;
  }

  return (
    <div className={cn('flex flex-col gap-4', className)} ref={ref} {...props}>
      <div className={'rounded-md border border-border bg-muted/30 p-4'}>
        {/* Header Section */}
        <div className={'flex items-center justify-between gap-3'}>
          <div className={'flex items-center gap-2'}>
            {renderStatusIcon()}
            <span className={'text-sm font-medium text-foreground'}>{getStatusText()}</span>
          </div>

          {/* File Count Badge */}
          {shouldShowFileCount && (
            <span className={'rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent'}>
              {filesDiscovered} {filesDiscovered === 1 ? 'file' : 'files'} found
            </span>
          )}
        </div>

        {/* Progress Bar Section */}
        {isActive && (
          <div className={'mt-3'}>
            <Progress.Root className={'w-full'} value={percentage}>
              <div className={'mb-1 flex items-center justify-between'}>
                <Progress.Label className={'text-xs text-muted-foreground'}>Progress</Progress.Label>
                <Progress.Value className={'text-xs text-muted-foreground'} />
              </div>
              <Progress.Track className={'h-2 w-full overflow-hidden rounded-full bg-muted shadow-inner'}>
                <Progress.Indicator className={'block h-full bg-accent transition-all duration-300 ease-out'} />
              </Progress.Track>
            </Progress.Root>
          </div>
        )}

        {/* Repository Progress Section */}
        {repositoryProgress.length > 0 && (
          <div className={'mt-3 space-y-2'}>
            <span className={'text-xs font-medium text-muted-foreground'}>Repository Status</span>
            <div className={'space-y-1'}>
              {repositoryProgress.map((repo) => (
                <div
                  className={'flex items-center justify-between rounded-sm bg-background/50 px-2 py-1'}
                  key={repo.repositoryId}
                >
                  {/* Repository Name */}
                  <div className={'flex items-center gap-2'}>
                    {repo.status === 'scanning' && <Loader2 className={'size-3 animate-spin text-accent'} />}
                    {repo.status === 'completed' && (
                      <CheckCircle2 className={'size-3 text-green-600 dark:text-green-400'} />
                    )}
                    {repo.status === 'error' && <XCircle className={'size-3 text-destructive'} />}
                    {repo.status === 'pending' && (
                      <div className={'size-3 rounded-full border border-muted-foreground'} />
                    )}
                    <span className={'truncate text-xs text-foreground'}>{repo.name}</span>
                  </div>

                  {/* Repository File Count */}
                  {hasRepositoryFilesDiscovered(repo) && (
                    <span className={'text-xs text-muted-foreground'}>
                      {repo.filesDiscovered} {repo.filesDiscovered === 1 ? 'file' : 'files'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cancel Button Section */}
        {isActive && onCancel && (
          <div className={'mt-4'}>
            <CancelAiDialog onConfirm={handleCancelConfirm} stepName={'Discovery'}>
              <Button size={'sm'} variant={'outline'}>
                Cancel
              </Button>
            </CancelAiDialog>
          </div>
        )}
      </div>

      {/* Reasoning Output Section */}
      {hasReasoning && (
        <Reasoning isStreaming={isReasoningStreaming}>
          <ReasoningTrigger />
          <ReasoningContent className={'h-60'}>{reasoning}</ReasoningContent>
        </Reasoning>
      )}

      {/* Streaming Text Output Section */}
      <StreamingAnalysis
        isLoading={isLoading}
        placeholder={'Discovering relevant files...'}
        text={streamingText ?? ''}
      />
    </div>
  );
};
