"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import {
  publicLooks,
  publicLooksKey,
  type PublicLookCard,
} from "@/lib/api/looks-public";
import { cn } from "@/lib/utils";

/** One look: tall model photo, name and a strip of the products worn. */
export function LookCard({
  look,
  className,
}: {
  look: PublicLookCard;
  className?: string;
}) {
  return (
    <Link
      href={`/looks/${look.id}`}
      className={cn("group block min-w-0", className)}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={look.modelImageUrl}
          alt={look.title}
          loading="lazy"
          className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="truncate text-sm font-semibold">{look.title}</p>
        <ArrowRight className="h-4 w-4 shrink-0 opacity-0 transition group-hover:opacity-100" />
      </div>
      <p className="mt-0.5 text-xs opacity-60">
        {look.itemCount} item{look.itemCount === 1 ? "" : "s"}
      </p>
      {look.thumbs.length > 0 && (
        <div className="mt-2 flex gap-1.5">
          {look.thumbs.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt=""
              loading="lazy"
              className="h-9 w-9 rounded-md bg-neutral-100 object-cover"
            />
          ))}
        </div>
      )}
    </Link>
  );
}

/**
 * Horizontal "Try the Look" row for the marketplace home (variant "market")
 * and a store's home (variant "store", takes the store's own colours).
 * Renders nothing while loading, on error, or when there are no looks, so a
 * page without looks looks exactly as it did before.
 */
export function LooksSection({
  store,
  limit = 10,
  variant = "market",
}: {
  store?: string;
  limit?: number;
  variant?: "market" | "store";
}) {
  const { data } = useQuery({
    queryKey: publicLooksKey.list(store, "", limit),
    queryFn: () => publicLooks.list({ store, limit }),
    staleTime: 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });
  if (!data || data.length === 0) return null;

  const isStore = variant === "store";
  const all = store ? `/looks?store=${encodeURIComponent(store)}` : "/looks";

  return (
    <section
      aria-label="Try the Look"
      className={cn(!isStore && "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8")}
      style={isStore ? { color: "var(--s-text)" } : undefined}
    >
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <div>
          <h2
            className={cn(
              "font-bold tracking-tight",
              isStore ? "text-xl" : "text-xl text-primary md:text-2xl dark:text-[#FF4D3D]",
            )}
          >
            Try the Look
          </h2>
          <p className="mt-0.5 text-xs opacity-60">
            Shop the full outfit, piece by piece.
          </p>
        </div>
        <Link
          href={all}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
        >
          View all looks <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 [scrollbar-width:none]">
        {data.map((l) => (
          <LookCard
            key={l.id}
            look={l}
            className="w-[44%] shrink-0 snap-start sm:w-[30%] md:w-[22%] lg:w-[18%]"
          />
        ))}
      </div>
    </section>
  );
}
