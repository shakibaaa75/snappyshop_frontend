"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductForm from "../../ProductForm";
import { sellerProducts } from "@/lib/api/products";
import { ApiError } from "@/lib/api/http";

export default function EditProductPage() {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const router = useRouter();

  const { data, isLoading, error } = useQuery({
    queryKey: ["seller", "products"],
    queryFn: sellerProducts.list,
    select: (list) => list.find((p) => p.id === id) ?? null,
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Link
          href={`/seller/${slug}/products`}
          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted"
          aria-label="Back to products"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Edit product
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {data?.name ?? "Loading…"}
          </p>
        </div>
      </header>

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading product…
        </div>
      )}

      {!isLoading && (error || !data) && (
        <div className="rounded-2xl border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {error instanceof ApiError
              ? error.message
              : "We couldn't find that product."}
          </p>
          <Button
            variant="outline"
            className="mt-4 h-11"
            onClick={() => router.push(`/seller/${slug}/products`)}
          >
            Back to products
          </Button>
        </div>
      )}

      {!isLoading && data && <ProductForm initial={data} productId={id} />}
    </div>
  );
}
