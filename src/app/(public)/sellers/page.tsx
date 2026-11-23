import { Suspense } from "react";
import type { Metadata } from "next";
import { SellersClient } from "./sellers-client";

export const metadata: Metadata = { title: "Explore sellers · SnappyShop" };

export default function SellersPage() {
  return (
    <section className="mx-auto w-full min-w-0 max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight sm:mb-8 sm:text-5xl">
        Explore sellers
      </h1>
      <Suspense fallback={<p role="status">Loading sellers…</p>}>
        <SellersClient />
      </Suspense>
    </section>
  );
}
