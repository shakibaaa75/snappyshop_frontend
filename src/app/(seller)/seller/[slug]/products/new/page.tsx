"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import ProductForm from "@/app/(seller)/seller/[slug]/products/ProductForm";
import { UpgradeNotice } from "@/components/seller/plan-lock";
import { sellerProducts } from "@/lib/api/products";
import { useEntitlements } from "@/lib/query/entitlements";
import { qk } from "@/lib/query/keys";

export default function NewProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { entitlements } = useEntitlements();
  const { data } = useQuery({
    queryKey: qk.seller.products.list(),
    queryFn: sellerProducts.list,
  });

  // The form is replaced, not just disabled. The server refuses the request
  // as well, so this only saves the seller from filling in a form for nothing.
  const atLimit = !!data && data.length >= entitlements.maxProducts;

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
            Add a product
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            It goes live on your storefront as soon as you save.
          </p>
        </div>
      </header>

      {atLimit ? (
        <UpgradeNotice
          title={`Product limit reached (${data?.length}/${entitlements.maxProducts})`}
        >
          Your plan allows up to {entitlements.maxProducts} products. Upgrade to
          add more.
        </UpgradeNotice>
      ) : (
        <ProductForm />
      )}
    </div>
  );
}
