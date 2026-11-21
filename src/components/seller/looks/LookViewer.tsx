"use client";

import { marketplaceProductHref } from "@/lib/query/marketplace-links";
import { useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { ApiError } from "@/lib/api/http";
import { formatBDT } from "@/lib/api/orders";
import {
  publicLooks,
  publicLooksKey,
  type PublicLookItem,
} from "@/lib/api/looks-public";
import { cn } from "@/lib/utils";

function StockBadge({ item }: { item: PublicLookItem }) {
  if (!item.inStock)
    return (
      <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
        Sold out
      </span>
    );
  if (item.stock > 0 && item.stock <= 5)
    return (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800">
        Only {item.stock} left
      </span>
    );
  return null;
}

function Price({ item }: { item: PublicLookItem }) {
  return (
    <p className="text-sm">
      <span className="font-semibold">{formatBDT(item.price)}</span>
      {item.comparePrice && item.comparePrice > item.price ? (
        <span className="ml-2 text-xs text-neutral-400 line-through">
          {formatBDT(item.comparePrice)}
        </span>
      ) : null}
    </p>
  );
}

/**
 * Buyer page for one look. Desktop: the model photo stays in view on the left
 * while the product list scrolls on the right. Mobile: the photo on top and the
 * products as a swipeable row of cards.
 */
export function LookViewer({ id }: { id: string }) {
  const {
    data: look,
    isLoading,
    error,
  } = useQuery({
    queryKey: publicLooksKey.one(id),
    queryFn: () => publicLooks.get(id),
    retry: (n, e) => !(e instanceof ApiError && e.status === 404) && n < 2,
    staleTime: 30_000,
  });
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-32 text-sm text-neutral-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  if (error || !look)
    return (
      <div className="mx-auto max-w-md px-6 py-32 text-center">
        <h1 className="text-xl font-semibold">Look not available</h1>
        <p className="mt-2 text-sm text-neutral-500">
          This look doesn&apos;t exist or is no longer available.
        </p>
        <Link
          href="/looks"
          className="mt-5 inline-block text-sm font-medium underline"
        >
          Browse all looks
        </Link>
      </div>
    );

  const href = (it: PublicLookItem) =>
    marketplaceProductHref(look.storeSlug, it.productId);
  const onScroll = () => {
    const el = track.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return;
    setActive(Math.round(el.scrollLeft / (card.offsetWidth + 12)));
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <header className="mb-6 lg:mb-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Try the Look.
        </h1>
        <p className="mt-1.5 text-sm text-neutral-500">
          {look.title} ·{" "}
          <Link
            href={`/store/${look.storeSlug}`}
            className="underline underline-offset-2"
          >
            Shop this store
          </Link>
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-14">
        {/* Model: sticky on desktop */}
        <div className="lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]">
          <div className="flex h-[62vh] items-end justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-neutral-50 to-neutral-100 lg:h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={look.modelImageUrl}
              alt={look.title}
              className="h-full w-full object-contain"
            />
          </div>
        </div>

        {/* Products */}
        <div className="min-w-0">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
              In this look
            </h2>
            <span className="text-xs text-neutral-400">
              {look.items.length} item{look.items.length === 1 ? "" : "s"}
            </span>
          </div>

          {/* Mobile: swipe */}
          <div className="lg:hidden">
            <div
              ref={track}
              onScroll={onScroll}
              className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none]"
            >
              {look.items.map((it) => (
                <Link
                  key={it.productId}
                  href={href(it)}
                  className="w-[68%] shrink-0 snap-start sm:w-[40%]"
                >
                  <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={it.imageUrl}
                      alt={it.name}
                      className={cn(
                        "h-full w-full object-cover",
                        !it.inStock && "opacity-60",
                      )}
                    />
                    <div className="absolute left-2 top-2">
                      <StockBadge item={it} />
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm font-medium">
                    {it.name}
                  </p>
                  <Price item={it} />
                </Link>
              ))}
            </div>
            {look.items.length > 1 && (
              <div className="mt-1 flex justify-center gap-1.5" aria-hidden>
                {look.items.map((it, i) => (
                  <span
                    key={it.productId}
                    className={cn(
                      "h-1.5 rounded-full bg-neutral-900 transition-all",
                      i === active ? "w-4" : "w-1.5 opacity-25",
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Desktop: scrolling list */}
          <ul className="hidden divide-y divide-neutral-200 lg:block">
            {look.items.map((it) => (
              <li key={it.productId}>
                <Link
                  href={href(it)}
                  className="group flex items-center gap-5 py-5"
                >
                  <div className="h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={it.imageUrl}
                      alt={it.name}
                      className={cn(
                        "h-full w-full object-cover transition duration-500 group-hover:scale-105",
                        !it.inStock && "opacity-60",
                      )}
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <StockBadge item={it} />
                    <p className="line-clamp-2 text-[15px] font-medium leading-snug">
                      {it.name}
                    </p>
                    <Price item={it} />
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-neutral-300 transition group-hover:text-neutral-900" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
