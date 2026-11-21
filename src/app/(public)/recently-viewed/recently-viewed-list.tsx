"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { RecentlyViewedCard } from "@/components/features/RecentlyViewedCard";
import {
  ProductCardSkeleton,
  chipClass,
} from "@/components/features/home/SectionState";
import { clearViewedProducts, useViewedProducts } from "@/lib/viewed-products";

const GRID =
  "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5";

// False while the server renders, true in the browser. The history only exists
// in the browser, so without this a returning visitor would first see the
// "nothing here" message for a moment.
const noopSubscribe = () => () => {};
const useHydrated = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

export function RecentlyViewedList() {
  const hydrated = useHydrated();
  const viewed = useViewedProducts();

  return (
    <div className="mx-auto w-full max-w-[var(--market-width)] space-y-6 px-[var(--gutter)] py-8 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Recently viewed
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Products you opened on this device, newest first.
          </p>
        </div>
        {hydrated && viewed.length > 0 && (
          <button
            type="button"
            onClick={clearViewedProducts}
            className={chipClass(false)}
          >
            Clear history
          </button>
        )}
      </div>

      {!hydrated ? (
        <div className={GRID} aria-busy="true" aria-label="Loading products">
          {Array.from({ length: 10 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : viewed.length === 0 ? (
        <div className="space-y-4">
          <p>Products you open will show up here.</p>
          <Link
            href="/products"
            className="inline-flex rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <div className={GRID}>
          {viewed.map((p) => (
            <RecentlyViewedCard key={`${p.slug}/${p.id}`} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
