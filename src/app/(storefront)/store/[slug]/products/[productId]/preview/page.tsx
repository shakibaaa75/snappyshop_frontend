"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Eye, Loader2, Pencil, X } from "lucide-react";
import { ApiError } from "@/lib/api/http";
import { fetchProducts, fetchPublicStore } from "@/lib/store-design/api";
import ProductClient from "../product-client";

/**
 * Owner-only preview. Shows a product the way customers will see it, even
 * when it is hidden or not published yet, so the seller does not have to
 * publish it and hunt for it on the live store.
 *
 * Products come from the seller's own list (needs the seller to be signed
 * in); the design and the rest of the store come from the public store.
 */
export default function ProductPreviewPage() {
  const { slug, productId } = useParams<{ slug: string; productId: string }>();

  const { data, error, isLoading } = useQuery({
    queryKey: ["product-preview", slug, productId],
    queryFn: async () => {
      const [store, mine] = await Promise.all([
        fetchPublicStore(slug),
        fetchProducts(slug),
      ]);
      const product = mine.find((p) => p.id === productId);
      if (!product) return null;
      const live = store.products.some((p) => p.id === productId);
      return {
        store: live
          ? store
          : { ...store, products: [...store.products, product] },
        product,
      };
    },
    // Always show the latest saved version, not a cached one.
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    const signedOut =
      error instanceof ApiError && (error.status === 401 || error.status === 403);
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-xl font-semibold">
          {signedOut ? "Sign in to preview" : "Product not found"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {signedOut
            ? "Only the store owner can preview products that are not live yet."
            : "This product could not be found. It may have been deleted."}
        </p>
        <Link
          href={`/seller/${slug}/products`}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Back to products
        </Link>
      </div>
    );
  }

  return (
    <>
      <ProductClient
        slug={slug}
        productId={productId}
        initialStore={data.store}
        initialProduct={data.product}
      />

      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex justify-center px-4">
        <div className="pointer-events-auto flex max-w-full items-center gap-2 rounded-full border bg-neutral-900 py-1.5 pl-3.5 pr-1.5 text-xs font-medium text-white shadow-lg">
          <Eye className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Preview · only you can see this</span>
          <Link
            href={`/seller/${slug}/products/${productId}/edit`}
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 transition hover:bg-white/25"
          >
            <Pencil className="h-3 w-3" /> Edit
          </Link>
          <Link
            href={`/seller/${slug}/products`}
            aria-label="Close preview"
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25"
          >
            <X className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </>
  );
}
