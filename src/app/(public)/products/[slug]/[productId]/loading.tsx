/**
 * Instant feedback while a marketplace product page loads.
 *
 * Without a loading.tsx, clicking a product leaves the old page frozen until
 * the server has loaded the whole store, then swaps everything at once. With
 * it, Next shows this shell on the first frame and also prefetches it ahead of
 * the click (when the product link scrolls into view), so opening a product
 * feels immediate. The layout mirrors marketplace-product.tsx (photo left,
 * details right) so nothing jumps when the real page arrives.
 */
export default function MarketplaceProductLoading() {
  return (
    <div
      className="mx-auto max-w-[1160px] px-[clamp(16px,4vw,54px)] pb-16"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading product…</span>
      <div className="mx-auto mb-[clamp(30px,4vw,52px)] mt-[clamp(16px,2.5vw,32px)] grid grid-cols-2 items-start gap-[clamp(28px,5vw,66px)] max-[740px]:grid-cols-1">
        <div className="aspect-square w-full animate-pulse rounded-[14px] bg-muted" />
        <div className="space-y-4">
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          <div className="h-8 w-4/5 animate-pulse rounded bg-muted" />
          <div className="h-6 w-28 animate-pulse rounded bg-muted" />
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="h-3 w-11/12 animate-pulse rounded bg-muted" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-12 w-full animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}
