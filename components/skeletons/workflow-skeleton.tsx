import { cn } from '@/lib/utils';

interface WorkflowSkeletonProps {
  /** Variant of the skeleton to render */
  variant: 'full' | 'progress' | 'results' | 'settings';
}

/**
 * Skeleton loader for workflow step sections.
 * Provides visual feedback during async TanStack Query operations.
 */
export function WorkflowSkeleton({ variant }: WorkflowSkeletonProps) {
  if (variant === 'settings') {
    return <SettingsPanelSkeleton />;
  }

  if (variant === 'progress') {
    return <ProgressSkeleton />;
  }

  if (variant === 'results') {
    return <ResultsSkeleton />;
  }

  // Full variant - combines all sections
  return (
    <div className={'flex flex-col gap-6'}>
      <SettingsPanelSkeleton />
      <ProgressSkeleton />
      <ResultsSkeleton />
    </div>
  );
}

/**
 * Skeleton for workflow step header with settings and cost estimate.
 * Used in step components that have a header row with multiple controls.
 */
export function WorkflowStepHeaderSkeleton() {
  return (
    <div className={'flex items-center justify-between gap-4'}>
      {/* Settings panel skeleton */}
      <div className={'flex-1'}>
        <SettingsPanelSkeleton />
      </div>

      {/* Cost estimate and controls */}
      <div className={'flex items-center gap-3'}>
        <div className={'h-8 w-24 animate-pulse rounded-md bg-muted'} />
        <div className={'size-8 animate-pulse rounded-md bg-muted'} />
      </div>
    </div>
  );
}

/**
 * Skeleton for the workflow steps sidebar.
 * Mimics the vertical step list with indicators and labels.
 */
export function WorkflowStepsSkeleton() {
  return (
    <div className={'flex flex-col rounded-lg border border-border/50 bg-muted/30 p-4'}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div className={'flex flex-col'} key={i}>
          {/* Step row */}
          <div className={'flex items-center gap-3'}>
            {/* Step indicator */}
            <div className={'size-10 animate-pulse rounded-full bg-muted'} />

            {/* Step labels */}
            <div className={'flex flex-col gap-1'}>
              <div className={'h-4 w-16 animate-pulse rounded-sm bg-muted'} />
              <div className={'h-3 w-32 animate-pulse rounded-sm bg-muted'} />
            </div>
          </div>

          {/* Connector line */}
          {i < 3 && (
            <div className={'my-2 ml-[19px]'}>
              <div className={'h-5 w-0.5 animate-pulse bg-muted'} />
            </div>
          )}
        </div>
      ))}

      {/* Navigation */}
      <div className={'mt-4 flex flex-col gap-3 border-t border-border/50 pt-4'}>
        <div className={'mx-auto h-3 w-16 animate-pulse rounded-sm bg-muted'} />
        <div className={'flex gap-2'}>
          <div className={'h-8 flex-1 animate-pulse rounded-md bg-muted'} />
          <div className={'h-8 flex-1 animate-pulse rounded-md bg-muted'} />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for progress indicators.
 * Mimics the DiscoveryProgress component structure with header, progress bar, and status.
 */
function ProgressSkeleton() {
  return (
    <div className={'rounded-md border border-border bg-muted/30 p-4'}>
      {/* Header */}
      <div className={'flex items-center justify-between gap-3'}>
        <div className={'flex items-center gap-2'}>
          <div className={'size-4 animate-pulse rounded-sm bg-muted'} />
          <div className={'h-4 w-40 animate-pulse rounded-sm bg-muted'} />
        </div>

        {/* File count badge */}
        <div className={'h-5 w-20 animate-pulse rounded-full bg-muted'} />
      </div>

      {/* Progress bar */}
      <div className={'mt-3'}>
        <div className={'mb-1 flex items-center justify-between'}>
          <div className={'h-3 w-14 animate-pulse rounded-sm bg-muted'} />
          <div className={'h-3 w-8 animate-pulse rounded-sm bg-muted'} />
        </div>
        <div className={'h-2 w-full animate-pulse rounded-full bg-muted'} />
      </div>

      {/* Repository status */}
      <div className={'mt-3 space-y-2'}>
        <div className={'h-3 w-24 animate-pulse rounded-sm bg-muted'} />
        <div className={'space-y-1'}>
          {Array.from({ length: 2 }).map((_, i) => (
            <div className={'flex items-center justify-between rounded-sm bg-background/50 px-2 py-1'} key={i}>
              <div className={'flex items-center gap-2'}>
                <div className={'size-3 animate-pulse rounded-full bg-muted'} />
                <div className={'h-3 w-28 animate-pulse rounded-sm bg-muted'} />
              </div>
              <div className={'h-3 w-12 animate-pulse rounded-sm bg-muted'} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for results/content sections.
 * Generic placeholder for step output content like clarification cards, file lists, or plan content.
 */
function ResultsSkeleton() {
  return (
    <div className={'flex flex-col gap-4'}>
      {/* Action button area */}
      <div className={'flex items-center justify-between'}>
        <div className={'h-9 w-36 animate-pulse rounded-md bg-muted'} />
        <div className={'h-5 w-24 animate-pulse rounded-sm bg-muted'} />
      </div>

      {/* Content cards */}
      <div className={'space-y-3'}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div className={'rounded-lg border border-border bg-card p-4'} key={i}>
            {/* Card header */}
            <div className={'mb-3 flex items-center gap-2'}>
              <div className={'size-5 animate-pulse rounded-sm bg-muted'} />
              <div className={'h-5 w-48 animate-pulse rounded-sm bg-muted'} />
            </div>

            {/* Card content lines */}
            <div className={'space-y-2'}>
              <div className={'h-4 w-full animate-pulse rounded-sm bg-muted'} />
              <div className={'h-4 w-3/4 animate-pulse rounded-sm bg-muted'} />
              <div className={'h-4 w-5/6 animate-pulse rounded-sm bg-muted'} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for StepSettingsPanel collapsible trigger.
 * Mimics the collapsed state with icon, title, and chevron.
 */
function SettingsPanelSkeleton() {
  return (
    <div
      className={cn(
        'flex w-full items-center justify-between rounded-md border border-border bg-card px-3 py-2',
        'animate-pulse'
      )}
    >
      {/* Icon and title */}
      <div className={'flex items-center gap-2'}>
        <div className={'size-4 rounded-sm bg-muted'} />
        <div className={'h-4 w-32 rounded-sm bg-muted'} />
      </div>

      {/* Chevron placeholder */}
      <div className={'size-4 rounded-sm bg-muted'} />
    </div>
  );
}
