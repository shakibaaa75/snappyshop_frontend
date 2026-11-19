import { Suspense } from "react";
import type { Metadata } from "next";
import { SellersClient } from "./sellers-client";
import { SellerGridSkeleton } from "@/components/features/home/SectionState";

export const metadata: Metadata = { title: "Sellers · ShopBD" };

export default function SellersPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-5">
      <h1 className="text-2xl font-bold text-primary">Sellers</h1>
      <Suspense fallback={<SellerGridSkeleton />}>
        <SellersClient />
      </Suspense>
    </div>
  );
}
