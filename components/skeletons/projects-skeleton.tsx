export function ProjectsSkeleton() {
  return (
    <div
      className={`
        grid gap-4
        sm:grid-cols-2
        lg:grid-cols-3
      `}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          className={"h-32 animate-pulse rounded-lg bg-muted"}
          key={i}
        />
      ))}
    </div>
  );
}
