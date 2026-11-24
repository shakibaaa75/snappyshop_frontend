import { notFound } from "next/navigation";
import { CartProvider } from "@/lib/store-design/cart";
import { fetchProductServer } from "@/lib/store-design/server";
import MarketplaceProduct from "./marketplace-product";

type PageProps = { params: Promise<{ slug: string; productId: string }> };

// Once a product page has been built it is reused for every visitor for up to
// a minute, instead of being rebuilt on each click. A product or publish
// change clears it at once (the Go API calls /internal/revalidate).
//
// This needs STORE_DESIGN_CACHE_SECONDS to be set (see lib/store-design/
// server.ts). Without it the store is fetched uncached, which makes Next build
// the page on every request, exactly as before, so this line is safe to ship
// first. It must stay a plain number: Next rejects values from an import.
export const revalidate = 60;

export async function generateMetadata({ params }: PageProps) {
  const { slug, productId } = await params;
  const data = await fetchProductServer(slug, productId);
  return { title: data ? `${data.product.name} · ShopBD` : "Product · ShopBD" };
}

export default async function MarketplaceProductPage({ params }: PageProps) {
  const { slug, productId } = await params;
  const data = await fetchProductServer(slug, productId);
  if (!data) notFound();

  const category = data.store.categories.find(
    (c) => c.id === data.product.categoryId,
  );
  const related = data.store.products
    .filter(
      (p) =>
        p.id !== productId &&
        p.categoryId &&
        p.categoryId === data.product.categoryId,
    )
    .slice(0, 4)
    .map((p) => ({
      id: p.id,
      title: p.name,
      price: p.price,
      compareAtPrice: p.comparePrice,
      images: p.imageUrl ? [p.imageUrl] : [],
      store: { slug, name: data.store.design.storeName },
      hasVariants: Boolean(p.combinations?.length),
      inStock:
        !data.store.design.vacationMode &&
        (p.combinations?.length
          ? p.combinations.some((c) => c.stock > 0)
          : p.stock > 0),
    }));

  return (
    <CartProvider key={slug} slug={slug}>
      <MarketplaceProduct
        key={productId}
        slug={slug}
        seller={data.store.design.storeName}
        paused={data.store.design.vacationMode}
        category={category?.name}
        related={related}
        product={data.product}
      />
    </CartProvider>
  );
}
