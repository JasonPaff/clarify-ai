export function FeatureRequestsSkeleton() {
  return (
    <div className={'flex flex-col gap-4'}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div className={'h-28 animate-pulse rounded-lg bg-muted'} key={i} />
      ))}
    </div>
  );
}
