/**
 * Instant feedback while a storefront route streams in.
 *
 * Without a loading.tsx, clicking a link leaves the old page frozen until the
 * server finishes, then swaps everything at once, which is the "static HTML"
 * feel. With it, Next shows this shell immediately (and prefetches it ahead of
 * the click), so navigation responds on the first frame.
 *
 * Kept theme-neutral on purpose: the seller's colors aren't known yet.
 */
export default function StoreLoading() {
  return (
    <div
      className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading…</span>
      <div className="h-10 w-48 animate-pulse rounded-xl bg-muted" />
      <div className="mt-6 h-56 w-full animate-pulse rounded-3xl bg-muted sm:h-72" />
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-square w-full animate-pulse rounded-2xl bg-muted" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
