import { Suspense } from "react";
import type { Metadata } from "next";
import { ProductsClient } from "./products-client";
import { ProductGridSkeleton } from "@/components/features/home/SectionState";

export const metadata: Metadata = { title: "Products · ShopBD" };

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <ProductGridSkeleton count={12} />
        </div>
      }
    >
      <ProductsClient />
    </Suspense>
  );
}
