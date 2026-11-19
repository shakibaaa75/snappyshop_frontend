"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { mainIcon } from "@/components/features/home/Homesidebar";
import {
  CategorySkeleton,
  SectionError,
} from "@/components/features/home/SectionState";
import { useMainTypes } from "@/lib/query/marketplace";
import { homeHref } from "@/lib/query/category-nav";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

/** Picture chosen by the admin, or a calm icon tile when there is none yet. */
function Thumb({
  src,
  Icon,
  sizes,
  className,
}: {
  src?: string;
  Icon: LucideIcon;
  sizes: string;
  className?: string;
}) {
  return (
    <span className={cn("relative block overflow-hidden bg-muted", className)}>
      {src ? (
        <Image src={src} alt="" fill sizes={sizes} className="object-cover" />
      ) : (
        <span className="absolute inset-0 grid place-items-center text-primary/45">
          <Icon className="h-1/2 w-1/2" strokeWidth={1.5} />
        </span>
      )}
    </span>
  );
}

/**
 * "All categories" page: every Main Type (Fashion, Electronics, ...) as a card
 * with its picture, and under it the categories that have products, each with
 * its picture. Pictures are chosen by the admin in Category management.
 */
export function AllCategories() {
  const { mains, isPending, isError, categoriesPending, refetch } =
    useMainTypes();

  // Same hydration guard as the sidebar: the server renders "loading", so the
  // first client render must too, even if the data is already cached.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  if (!hydrated || isPending) return <CategorySkeleton />;
  if (isError) {
    return (
      <SectionError
        message="We couldn’t load categories."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {mains.map((m) => {
        const MainIcon = mainIcon(m.id);
        return (
          <section
            key={m.id}
            className="rounded-2xl border border-border bg-card p-5 sm:p-7"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <Thumb
                src={m.image}
                Icon={MainIcon}
                sizes="64px"
                className="h-14 w-14 shrink-0 rounded-2xl sm:h-16 sm:w-16"
              />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-semibold tracking-tight sm:text-lg">
                  {m.name}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {categoriesPending
                    ? "Loading…"
                    : m.categories.length > 0
                      ? `${m.categories.length} ${m.categories.length === 1 ? "category" : "categories"}`
                      : "No products yet"}
                </p>
              </div>
              <Link
                href={homeHref({ category: m.id })}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[#17645F] dark:bg-[#D93A2B] px-4 text-sm font-medium text-white transition-colors hover:bg-[#17645F]/90 dark:hover:bg-[#D93A2B]/90"
              >
                <span className="hidden sm:inline">View all</span>
                <span className="sm:hidden">View</span>
                <ArrowRight className="h-4 w-4 text-[#FF6845]" />
              </Link>
            </div>

            {m.categories.length > 0 && (
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
                {m.categories.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={homeHref({ category: c.slug })}
                      className="group flex h-full flex-col items-center gap-2 rounded-2xl border border-transparent bg-muted/40 p-3 transition-colors hover:border-border hover:bg-muted sm:p-4"
                    >
                      <Thumb
                        src={c.image}
                        Icon={MainIcon}
                        sizes="(min-width:1280px) 140px, (min-width:640px) 120px, 30vw"
                        className="aspect-[4/3] w-full rounded-xl transition-transform duration-200 group-hover:scale-[1.03] motion-reduce:transition-none"
                      />
                      <span className="line-clamp-2 text-center text-xs font-medium leading-tight">
                        {c.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
