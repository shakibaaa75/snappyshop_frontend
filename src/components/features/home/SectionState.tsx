import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Paged product grids (category view): 5 per row on wide screens. */
export const productGridClass =
  "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5";

/**
 * One pill style for every filter, sort and category chip on the home page,
 * so they stop drifting apart from file to file.
 */
export function chipClass(active: boolean) {
  return cn(
    "inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-xs font-medium outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#FF6845] focus-visible:ring-offset-2",
    active
      ? "border-[#17645F] dark:border-[#D93A2B] bg-[#17645F] dark:bg-[#D93A2B] text-white"
      : "border-border bg-card text-primary/80 hover:bg-muted hover:text-primary",
  );
}

/** Placeholder with the same shape as TopSellingCard. */
export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card",
        className,
      )}
    >
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-3 w-2/5" />
        <Skeleton className="h-3.5 w-4/5" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div
      className={productGridClass}
      aria-busy="true"
      aria-label="Loading products"
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function SellerGridSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-label="Loading sellers"
    >
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-44 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function CategorySkeleton({ count = 9 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9"
      aria-busy="true"
      aria-label="Loading categories"
    >
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function SectionError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-5 sm:flex-row sm:items-center"
    >
      <AlertCircle className="h-5 w-5 shrink-0 text-destructive" aria-hidden />
      <p className="flex-1 text-sm">{message}</p>
      <Button type="button" size="sm" variant="outline" onClick={onRetry}>
        <RefreshCw /> Try again
      </Button>
    </div>
  );
}

export function SectionEmpty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-muted px-4 py-8 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}
