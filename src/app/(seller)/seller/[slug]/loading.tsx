import {
  SkeletonBlock,
  SkeletonKpiGrid,
  SkeletonList,
  SkeletonStatusRow,
} from "@/components/ui/skeleton";

/**
 * Shown inside the seller shell (sidebar and header stay) while the next seller
 * page loads, so a click gives instant feedback instead of a frozen screen.
 */
export default function SellerPageLoading() {
  return (
    <div
      className="seller-delay-in w-full min-w-0 max-w-full space-y-5"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading…</span>
      <SkeletonKpiGrid count={4} />
      <SkeletonStatusRow count={5} />
      <SkeletonBlock className="h-56" />
      <div className="overflow-hidden rounded-2xl border bg-card">
        <SkeletonList rows={4} />
      </div>
    </div>
  );
}
