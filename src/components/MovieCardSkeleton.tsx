const MovieCardSkeleton = () => (
  <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/80 dark:bg-neutral-900 dark:ring-white/10">
    <div className="skeleton aspect-[2/3] w-full" />
    <div className="p-3.5 space-y-2.5">
      <div className="skeleton h-4 w-full rounded-lg" />
      <div className="skeleton h-3.5 w-2/3 rounded-lg" />
      <div className="skeleton h-3 w-1/2 rounded-lg" />
    </div>
  </div>
);

export default MovieCardSkeleton;
