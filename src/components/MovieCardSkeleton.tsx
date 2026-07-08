const MovieCardSkeleton = () => (
  <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80 dark:bg-neutral-900 dark:ring-white/10">
    <div className="aspect-[2/3] animate-pulse bg-slate-200 dark:bg-neutral-800" />
    <div className="space-y-3 p-4">
      <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200 dark:bg-neutral-800" />
      <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-neutral-800" />
    </div>
  </div>
);

export default MovieCardSkeleton;
