/**
 * Yuklanish paytidagi "skelet" bloki.
 */
function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200/70 ${className}`}
      aria-hidden="true"
    />
  );
}

/** Kurs kartasi shaklidagi skelet. */
export function CourseCardSkeleton() {
  return (
    <div className="card rounded-2xl p-4">
      <Skeleton className="h-40 w-full mb-4" />
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-4" />
      <Skeleton className="h-8 w-24" />
    </div>
  );
}

export default Skeleton;
