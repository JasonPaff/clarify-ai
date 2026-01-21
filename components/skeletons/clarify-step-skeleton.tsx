/**
 * Skeleton loader for the ClarifyStep component.
 * Provides visual feedback during initial configuration loading.
 */
export function ClarifyStepSkeleton() {
  return (
    <div className={'flex flex-col gap-6'}>
      {/* Step Header: Settings Panel, Cost Estimate, and Run History */}
      <div className={'flex items-center justify-between gap-4'}>
        {/* Settings Panel Skeleton */}
        <div className={'h-10 flex-1 animate-pulse rounded-md bg-muted'} />

        {/* Cost Estimate and Run History Buttons */}
        <div className={'flex items-center gap-3'}>
          <div className={'h-9 w-24 animate-pulse rounded-md bg-muted'} />
          <div className={'size-9 animate-pulse rounded-md bg-muted'} />
        </div>
      </div>

      {/* Clarification Panel Content Skeleton */}
      <section className={'flex flex-col gap-3'}>
        {/* Analysis Summary Card */}
        <div className={'rounded-lg border border-border bg-card p-4'}>
          {/* Card Header */}
          <div className={'mb-3 flex items-center gap-2'}>
            <div className={'size-5 animate-pulse rounded-sm bg-muted'} />
            <div className={'h-5 w-32 animate-pulse rounded-sm bg-muted'} />
          </div>

          {/* Analysis Content Lines */}
          <div className={'space-y-2'}>
            <div className={'h-4 w-full animate-pulse rounded-sm bg-muted'} />
            <div className={'h-4 w-4/5 animate-pulse rounded-sm bg-muted'} />
            <div className={'h-4 w-3/4 animate-pulse rounded-sm bg-muted'} />
          </div>
        </div>

        {/* Questions List Skeleton */}
        <div className={'space-y-3'}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div className={'rounded-lg border border-border bg-card p-4'} key={i}>
              {/* Question Header */}
              <div className={'mb-3 flex items-center justify-between'}>
                <div className={'h-5 w-3/4 animate-pulse rounded-sm bg-muted'} />
                <div className={'size-5 animate-pulse rounded-full bg-muted'} />
              </div>

              {/* Answer Input Area */}
              <div className={'h-20 animate-pulse rounded-md bg-muted'} />
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className={'flex items-center gap-3'}>
          <div className={'h-9 w-36 animate-pulse rounded-md bg-muted'} />
        </div>
      </section>
    </div>
  );
}
