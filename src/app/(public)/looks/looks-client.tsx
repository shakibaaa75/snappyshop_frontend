"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { publicLooks, publicLooksKey } from "@/lib/api/looks-public";
import { LookCard } from "@/components/seller/looks/LooksSection";
import { cn } from "@/lib/utils";

const FILTERS = [
  { id: "", label: "All" },
  { id: "female", label: "Women" },
  { id: "male", label: "Men" },
] as const;

export default function LooksClient() {
  const store = useSearchParams().get("store") ?? "";
  const [gender, setGender] = useState<"" | "male" | "female">("");

  const { data, isLoading, isError } = useQuery({
    queryKey: publicLooksKey.list(store, gender, 60),
    queryFn: () =>
      publicLooks.list({
        store: store || undefined,
        gender: gender || undefined,
        limit: 60,
      }),
    staleTime: 60_000,
    retry: false,
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Try the Look.
      </h1>
      <p className="mt-1.5 text-sm text-neutral-500">
        {store ? (
          <>
            Looks from this store ·{" "}
            <Link href="/looks" className="underline underline-offset-2">
              See all looks
            </Link>
          </>
        ) : (
          "Complete outfits from ShopBD sellers. Tap a look to shop each piece."
        )}
      </p>

      <div className="mt-5 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setGender(f.id)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm transition",
              gender === f.id
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "hover:bg-neutral-100",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-24 text-neutral-500">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}
      {isError && (
        <p className="py-16 text-center text-sm text-red-600">
          Couldn&apos;t load looks.
        </p>
      )}
      {data && data.length === 0 && (
        <p className="py-20 text-center text-sm text-neutral-500">
          No looks to show yet.
        </p>
      )}
      {data && data.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {data.map((l) => (
            <LookCard key={l.id} look={l} />
          ))}
        </div>
      )}
    </div>
  );
}
