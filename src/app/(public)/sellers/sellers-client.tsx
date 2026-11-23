"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  BadgeCheck,
  Star,
  Store as StoreIcon,
} from "lucide-react";
import { Pager } from "@/components/features/home/Pager";
import { useMarketplaceSellers } from "@/lib/query/marketplace";
import { storeHref } from "@/lib/query/marketplace-links";
import { img } from "@/lib/images";
import {
  sellingCategories,
  getSellingCategory,
  normalizeSellingCategory,
} from "@/lib/store-design/selling-categories";
import type { Store } from "@/types";

function DirectoryCard({ store }: { store: Store }) {
  const category = getSellingCategory(store.category);
  return (
    <Link
      href={storeHref(store)}
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground transition-colors hover:border-[#0C68F6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0C68F6]"
    >
      <div className="relative h-20 overflow-hidden bg-gradient-to-br from-indigo-100 via-blue-50 to-orange-100 sm:h-28">
        {store.banner ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            loading="lazy"
            src={img(store.banner, { width: 760, height: 224 })}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <StoreIcon
            aria-hidden
            className="absolute -bottom-4 right-6 size-20 -rotate-6 text-indigo-300/50"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col px-4 pb-4 sm:px-5 sm:pb-5">
        <div className="relative -mt-5 mb-2 flex items-end justify-between gap-3">
          <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-card bg-indigo-50 text-lg font-bold text-indigo-800 sm:size-14">
            {store.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={img(store.logo, { width: 112, height: 112 })}
                loading="lazy"
                alt=""
                className="size-full object-cover"
              />
            ) : (
              store.name.trim().charAt(0).toUpperCase()
            )}
          </span>
          <ArrowUpRight
            aria-hidden
            className="size-5 text-muted-foreground group-hover:text-[#0C68F6]"
          />
        </div>
        {category && (
          <p className="mb-1 text-xs font-semibold text-muted-foreground">
            {category.label}
          </p>
        )}
        <h2 className="flex items-start gap-1.5 text-lg font-semibold leading-tight tracking-tight">
          <span className="min-w-0 break-words">{store.name}</span>
          {store.isVerified && (
            <BadgeCheck
              aria-label="Verified seller"
              className="mt-0.5 size-4 shrink-0 text-blue-600"
            />
          )}
        </h2>
        {store.description && (
          <p className="mt-2 line-clamp-2 break-words text-sm text-muted-foreground">
            {store.description}
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-4 text-xs text-muted-foreground">
          {typeof store.productCount === "number" && (
            <span>
              {store.productCount}{" "}
              {store.productCount === 1 ? "product" : "products"}
            </span>
          )}
          {!!store.rating && (
            <span className="inline-flex items-center gap-1">
              <Star aria-label="Rating" className="size-3" />
              {store.rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function SellersClient() {
  const router = useRouter();
  const params = useSearchParams();
  const category = normalizeSellingCategory(params.get("category"));
  const rawPage = Number(params.get("page"));
  const page =
    Number.isInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, 10000) : 1;
  const query = useMarketplaceSellers({
    sort: "popular",
    sellingCategory: category || undefined,
    limit: 12,
    page,
  });
  const result = query.isPlaceholderData ? undefined : query.data;

  function navigate(nextCategory: string, nextPage: number) {
    const next = new URLSearchParams(params.toString());
    if (nextCategory) next.set("category", nextCategory);
    else next.delete("category");
    if (nextPage > 1) next.set("page", String(nextPage));
    else next.delete("page");
    router.push(next.size ? `/sellers?${next}` : "/sellers", {
      scroll: nextPage !== page,
    });
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b pb-5">
        <label className="grid w-full gap-1.5 text-sm font-semibold sm:max-w-xs">
          Store category
          <select
            className="h-12 w-full min-w-0 rounded-xl border bg-background px-3 text-base font-normal"
            value={category}
            onChange={(e) => navigate(e.target.value, 1)}
          >
            <option value="">All categories</option>
            {sellingCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        {result && (
          <p role="status" className="text-sm text-muted-foreground">
            {result.total} {result.total === 1 ? "seller" : "sellers"}
          </p>
        )}
      </div>
      {query.isError ? (
        <p role="alert">
          Couldn’t load sellers.{" "}
          <button className="underline" onClick={() => query.refetch()}>
            Try again
          </button>
        </p>
      ) : !result ? (
        <p role="status" className="py-8 text-muted-foreground">
          Loading sellers…
        </p>
      ) : result.items.length ? (
        <>
          <div className="grid min-w-0 grid-cols-1 gap-4 min-[560px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {result.items.map((store) => (
              <DirectoryCard key={store.id} store={store} />
            ))}
          </div>
          <div className="mt-5">
            <Pager {...result} onPage={(p) => navigate(category, p)} />
          </div>
        </>
      ) : (
        <div className="rounded-2xl border bg-muted/30 p-7 text-center">
          <h2 className="font-semibold">
            {page > 1
              ? "No sellers on this page"
              : category
                ? "No sellers in this category yet"
                : "No published sellers yet"}
          </h2>
          {(category || page > 1) && (
            <button
              className="mt-3 text-sm font-semibold underline"
              onClick={() => navigate(page > 1 ? category : "", 1)}
            >
              {page > 1 ? "Go to first page" : "Show all sellers"}
            </button>
          )}
        </div>
      )}
    </>
  );
}
