"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { publicLooks, publicLooksKey } from "@/lib/api/looks-public";

/**
 * Entry point on a store's home page. Shows a few of the store's looks and
 * opens the full-screen "Try the Look" page: /store/{slug}/try-the-look.
 * Renders nothing when the store has no published looks.
 */
export function StoreLooksTeaser({ store }: { store: string }) {
  const { data } = useQuery({
    queryKey: publicLooksKey.list(store, "", 4),
    queryFn: () => publicLooks.list({ store, limit: 4 }),
    staleTime: 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });
  if (!data || data.length === 0) return null;

  return (
    <section
      aria-label="Try the Look"
      className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"
      style={{ color: "var(--s-text)" }}
    >
      <Link
        href={`/store/${store}/try-the-look`}
        className="group grid items-center gap-6 overflow-hidden rounded-3xl p-6 sm:grid-cols-[1fr_auto] sm:p-10"
        style={{ background: "var(--s-surface)" }}
      >
        <div>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Try the Look.
          </h2>
          <p
            className="mt-2 max-w-md text-sm"
            style={{ color: "var(--s-muted)" }}
          >
            See complete outfits on real models, then shop each piece.
          </p>
          <span
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold transition group-hover:gap-3"
            style={{
              background: "var(--s-primary)",
              color: "var(--s-on-primary)",
            }}
          >
            Try the Look <ArrowRight className="h-4 w-4" />
          </span>
        </div>
        <div className="flex items-end justify-center -space-x-6 sm:justify-end">
          {data.slice(0, 4).map((l, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={l.id}
              src={l.modelImageUrl}
              alt=""
              loading="lazy"
              className="h-36 w-auto object-contain object-bottom transition duration-500 group-hover:-translate-y-1 sm:h-44"
              style={{ opacity: i === 0 ? 1 : 0.9 - i * 0.1 }}
            />
          ))}
        </div>
      </Link>
    </section>
  );
}
