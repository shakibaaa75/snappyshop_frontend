"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { TopSellingCard } from "@/components/features/TopSellingCard";
import { fetchPublicStore } from "@/lib/store-design/api";
import { toggleWishlistItem, useSavedIds, useSavedStores } from "@/lib/store-design/use-wishlist";

function SavedProducts({ slug }: { slug: string }) {
  const ids = useSavedIds(slug);
  const query = useQuery({
    queryKey: ["public-store", slug],
    queryFn: () => fetchPublicStore(slug),
    staleTime: 60_000,
  });
  if (query.isPending) return <p role="status">Loading saved products…</p>;
  if (!query.data) return <p>Couldn’t load products from {slug}. <button className="underline" onClick={() => query.refetch()}>Try again</button></p>;
  const { design, products } = query.data;
  const saved = products.filter(p => ids.has(p.id));
  const missing = [...ids].filter(id => !saved.some(p => p.id === id));
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">{design.storeName || slug}</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {saved.map(p => <TopSellingCard key={p.id} product={{
          id: p.id, title: p.name, price: p.price, compareAtPrice: p.comparePrice,
          images: p.imageUrl ? [p.imageUrl] : [], store: { slug, name: design.storeName },
          hasVariants: Boolean(p.combinations?.length),
          inStock: !design.vacationMode && (p.combinations?.length ? p.combinations.some(c => c.stock > 0) : p.stock > 0),
        }} />)}
      </div>
      {missing.length > 0 && <p className="text-sm">Some saved products are no longer available. <button className="underline" onClick={() => missing.forEach(id => toggleWishlistItem(slug, id))}>Remove unavailable items</button></p>}
    </section>
  );
}

export default function WishlistPage() {
  const slugs = useSavedStores();
  return (
    <div className="mx-auto w-full max-w-[var(--market-width)] px-[var(--gutter)] space-y-8 py-8 sm:py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Your wishlist</h1>
      {slugs.length ? slugs.map(slug => <SavedProducts key={slug} slug={slug} />) : (
        <div className="space-y-4">
          <p>Tap the heart on a product to save it here.</p>
          <Link href="/products" className="inline-flex rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground">Browse products</Link>
        </div>
      )}
    </div>
  );
}
