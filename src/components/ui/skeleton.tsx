import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

/** Row of KPI cards (dashboards). */
export function SkeletonKpiGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
          <Skeleton className="mt-3 h-7 w-28" />
          <Skeleton className="mt-2 h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

/** Row of small status tiles (Pending / Confirmed / Shipped / …). */
export function SkeletonStatusRow({ count = 5 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-xl border bg-card px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-3 w-6" />
        </div>
      ))}
    </div>
  );
}

/** Table-like skeleton for product / order lists. */
export function SkeletonTable({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="border-b bg-muted/40 px-6 py-3">
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4 max-w-xs" />
              <Skeleton className="h-3 w-1/2 max-w-[220px]" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Simple list skeleton for "recent orders" cards. */
export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <ul className="divide-y">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex items-center gap-4 px-5 py-3.5">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3 max-w-xs" />
            <Skeleton className="h-3 w-1/2 max-w-[200px]" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </li>
      ))}
    </ul>
  );
}

/** Generic block placeholder. */
export function SkeletonBlock({ className }: { className?: string }) {
  return <Skeleton className={cn("h-32 w-full rounded-2xl", className)} />;
}
