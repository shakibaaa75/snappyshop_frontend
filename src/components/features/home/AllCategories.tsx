"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight, Search, X } from "lucide-react";
import { mainIcon } from "@/components/features/home/Homesidebar";
import {
  CategorySkeleton,
  SectionError,
} from "@/components/features/home/SectionState";
import {
  useMainTypes,
  useMarketplaceCategories,
} from "@/lib/query/marketplace";
import { homeHref } from "@/lib/query/category-nav";

export function AllCategories() {
  const { mains, isPending, isError, categoriesPending, refetch } =
    useMainTypes();
  // This subscription shares the live category request with useMainTypes.
  const live = useMarketplaceCategories();
  const [hydrated, setHydrated] = useState(false);
  const [search, setSearch] = useState("");
  useEffect(() => setHydrated(true), []);

  const query = search.trim().toLowerCase();
  const available = mains.filter((main) => main.categories.length > 0);
  const groups = available
    .map((main) => ({
      ...main,
      matches: main.name.toLowerCase().includes(query)
        ? main.categories
        : main.categories.filter((c) => c.name.toLowerCase().includes(query)),
    }))
    .filter((main) => main.matches.length > 0);
  const loading = !hydrated || isPending || categoriesPending;

  return (
    <section className="min-w-0 space-y-5 sm:space-y-7">
      <header className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between sm:pb-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Shop by category
        </h1>
        <div
          role="search"
          aria-label="Category directory"
          className="relative w-full sm:max-w-xs"
        >
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Find a category"
            placeholder="Find a category"
            className="h-11 w-full rounded-full border bg-background pl-10 pr-11 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0C68F6]"
          />
          {search && (
            <button
              type="button"
              aria-label="Clear category search"
              onClick={() => setSearch("")}
              className="absolute inset-y-0 right-1 grid w-10 place-items-center rounded-full"
            >
              <X aria-hidden className="size-4" />
            </button>
          )}
        </div>
      </header>
      {hydrated && (isError || (live.isError && !live.data)) ? (
        <SectionError
          message="We couldn’t load the category directory."
          onRetry={refetch}
        />
      ) : loading ? (
        <CategorySkeleton />
      ) : groups.length ? (
        <div className="space-y-4">
          <p className="sr-only" role="status">
            {groups.reduce((count, main) => count + main.matches.length, 0)}{" "}
            categories found
          </p>
          {groups.map((main) => {
            const Icon = mainIcon(main.id);
            return (
              <section
                key={main.id}
                aria-label={main.name}
                className="grid min-w-0 overflow-hidden rounded-2xl border bg-card md:grid-cols-[minmax(180px,24%)_minmax(0,1fr)]"
              >
                <div className="flex flex-wrap items-center gap-3 border-b bg-muted/50 px-4 py-4 sm:px-5 md:flex-col md:items-start md:justify-center md:border-b-0 md:border-r md:p-6">
                  <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-blue-100 text-blue-700 md:size-14 dark:bg-blue-950 dark:text-blue-300">
                    {main.image ? (
                      <Image
                        alt=""
                        src={main.image}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <Icon aria-hidden className="size-6 md:size-7" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1 md:flex-none">
                    <h2 className="break-words text-lg font-bold tracking-tight sm:text-xl">
                      {main.name}
                    </h2>
                    <Link
                      href={homeHref({ category: main.id })}
                      aria-label={`Shop all ${main.name}`}
                      className="inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-blue-700 hover:underline dark:text-blue-300"
                    >
                      Shop all <ArrowRight aria-hidden className="size-4" />
                    </Link>
                  </div>
                </div>
                <ul className="grid min-w-0 content-start gap-1 p-2 sm:grid-cols-2 sm:gap-2 sm:p-4">
                  {main.matches.map((c) => (
                    <li key={c.id} className="min-w-0">
                      <Link
                        href={homeHref({ category: c.slug })}
                        className="group flex h-full min-h-12 items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0C68F6]"
                      >
                        {c.image && (
                          <span className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                            <Image
                              alt=""
                              src={c.image}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </span>
                        )}
                        <span className="min-w-0 flex-1 break-words text-sm font-medium">
                          {c.name}
                        </span>
                        <ChevronRight
                          aria-hidden
                          className="size-4 shrink-0 text-muted-foreground group-hover:text-blue-600"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border px-4 py-9 text-center">
          <p role="status" className="font-semibold">
            {query
              ? "No matching categories"
              : "No categories with products yet"}
          </p>
          {query ? (
            <button
              type="button"
              className="mt-2 min-h-11 px-3 text-sm font-medium underline"
              onClick={() => setSearch("")}
            >
              Clear search
            </button>
          ) : (
            <Link
              className="mt-2 inline-flex min-h-11 items-center text-sm font-medium underline"
              href="/products"
            >
              Browse products
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
