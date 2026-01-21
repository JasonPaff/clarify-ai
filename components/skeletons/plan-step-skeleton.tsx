/**
 * Skeleton loader for the PlanStep component.
 * Provides visual feedback during initial configuration loading.
 */
export function PlanStepSkeleton() {
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

      {/* Plan Panel Content Skeleton */}
      <section className={'flex flex-col gap-3'}>
        {/* Plan Overview Card */}
        <div className={'rounded-lg border border-border bg-card p-4'}>
          {/* Card Header */}
          <div className={'mb-4 flex items-center justify-between'}>
            <div className={'flex items-center gap-2'}>
              <div className={'size-5 animate-pulse rounded-sm bg-muted'} />
              <div className={'h-5 w-40 animate-pulse rounded-sm bg-muted'} />
            </div>
            <div className={'h-8 w-24 animate-pulse rounded-md bg-muted'} />
          </div>

          {/* Summary Section */}
          <div className={'mb-4 space-y-2'}>
            <div className={'h-4 w-24 animate-pulse rounded-sm bg-muted'} />
            <div className={'h-4 w-full animate-pulse rounded-sm bg-muted'} />
            <div className={'h-4 w-5/6 animate-pulse rounded-sm bg-muted'} />
          </div>
        </div>

        {/* Implementation Steps Skeleton */}
        <div className={'space-y-3'}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div className={'rounded-lg border border-border bg-card p-4'} key={i}>
              {/* Step Header */}
              <div className={'mb-3 flex items-center gap-3'}>
                <div className={'size-8 animate-pulse rounded-full bg-muted'} />
                <div className={'flex flex-1 flex-col gap-1'}>
                  <div className={'h-5 w-48 animate-pulse rounded-sm bg-muted'} />
                  <div className={'h-3 w-24 animate-pulse rounded-sm bg-muted'} />
                </div>
              </div>

              {/* Step Content */}
              <div className={'ml-11 space-y-2'}>
                <div className={'h-4 w-full animate-pulse rounded-sm bg-muted'} />
                <div className={'h-4 w-4/5 animate-pulse rounded-sm bg-muted'} />

                {/* Files List */}
                <div className={'mt-3 flex flex-wrap gap-2'}>
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div className={'h-6 w-32 animate-pulse rounded-full bg-muted'} key={j} />
                  ))}
                </div>
              </div>
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
