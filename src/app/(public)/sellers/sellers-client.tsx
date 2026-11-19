"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FeaturedSellersSection } from "@/components/features/home/HomeSections";
import { Pager } from "@/components/features/home/Pager";
import { useMarketplaceSellers } from "@/lib/query/marketplace";

const LIMIT = 12;

export function SellersClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const page = Math.max(1, Number(sp.get("page")) || 1);
  // Same query key as the section below, so this adds no extra request.
  const q = useMarketplaceSellers({ sort: "popular", limit: LIMIT, page });
  return (
    <>
      <div className="-mx-4 sm:-mx-6 lg:-mx-8">
        <FeaturedSellersSection limit={LIMIT} page={page} paged />
      </div>
      {q.data && (
        <Pager
          page={q.data.page}
          limit={q.data.limit}
          total={q.data.total}
          onPage={(p) => router.push(`/sellers?page=${p}`)}
        />
      )}
    </>
  );
}
