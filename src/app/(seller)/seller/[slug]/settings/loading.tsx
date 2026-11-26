import { Skeleton } from "@/components/ui/skeleton";

/** Settings-shaped placeholder (replaces the dashboard one for /settings/*). */
export default function SettingsLoading() {
  return (
    <div
      className="seller-delay-in w-full min-w-0"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading…</span>
      <Skeleton className="mb-8 h-10 w-48" />
      <div className="lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-10">
        <div className="hidden space-y-2 lg:block">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-full" />
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-56" />
          <div className="rounded-2xl border bg-card p-6">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="mt-4 h-5 w-1/2" />
            <Skeleton className="mt-4 h-5 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}
