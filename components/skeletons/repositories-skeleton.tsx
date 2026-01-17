export function RepositoriesSkeleton() {
  return (
    <div className={'flex flex-col gap-4'}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div className={'h-24 animate-pulse rounded-lg bg-muted'} key={i} />
      ))}
    </div>
  );
}
