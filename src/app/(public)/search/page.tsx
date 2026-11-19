import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchResults } from "@/components/features/search/SearchResults";
import { ProductGridSkeleton } from "@/components/features/home/SectionState";

export const metadata: Metadata = { title: "Search | ShopBD" };

export default function SearchPage() {
  return (
    // useSearchParams inside SearchResults needs a Suspense boundary
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1400px] px-4 pt-6 sm:px-6 lg:px-8">
          <ProductGridSkeleton count={10} />
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
