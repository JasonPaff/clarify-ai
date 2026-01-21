export function DiscoverySkeleton() {
  return (
    <div className={'flex flex-col gap-6'}>
      {/* Step Header: Settings Panel and Buttons */}
      <div className={'flex items-center justify-between gap-4'}>
        {/* Settings Panel Skeleton */}
        <div className={'h-10 flex-1 animate-pulse rounded-md bg-muted'} />

        {/* Cost Estimate and Run History Buttons */}
        <div className={'flex items-center gap-3'}>
          <div className={'h-9 w-24 animate-pulse rounded-md bg-muted'} />
          <div className={'size-9 animate-pulse rounded-md bg-muted'} />
        </div>
      </div>

      {/* Repository Context Section */}
      <section className={'flex flex-col gap-3'}>
        {/* Section Title */}
        <div className={'h-5 w-36 animate-pulse rounded-sm bg-muted'} />

        {/* Repository Overview Status Panel */}
        <div className={'h-20 animate-pulse rounded-md bg-muted'} />
      </section>

      {/* Scope Configuration Collapsible */}
      <div className={'h-12 animate-pulse rounded-md bg-muted'} />

      {/* Results Area Placeholder */}
      <section className={'flex flex-col gap-3'}>
        {/* Results Header */}
        <div className={'flex items-center justify-between'}>
          <div className={'h-5 w-28 animate-pulse rounded-sm bg-muted'} />
          <div className={'h-8 w-32 animate-pulse rounded-md bg-muted'} />
        </div>

        {/* File List Skeleton */}
        <div className={'flex flex-col gap-2'}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div className={'h-14 animate-pulse rounded-md bg-muted'} key={i} />
          ))}
        </div>
      </section>

      {/* Action Buttons */}
      <div className={'flex items-center gap-3'}>
        <div className={'h-9 w-32 animate-pulse rounded-md bg-muted'} />
      </div>
    </div>
  );
}
