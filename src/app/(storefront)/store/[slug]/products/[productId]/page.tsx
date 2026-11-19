import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchProductServer } from "@/lib/store-design/server";
import ProductClient from "./product-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>;
}): Promise<Metadata> {
  const { slug, productId } = await params;
  const data = await fetchProductServer(slug, productId);
  return {
    title: data ? `${data.product.name} · ${slug}` : `${slug} · ShopBD`,
    description: data?.product.description?.slice(0, 160),
    robots: { index: true, follow: true },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>;
}) {
  const { slug, productId } = await params;
  const data = await fetchProductServer(slug, productId);

  if (!data) {
    notFound();
  }

  return (
    <ProductClient
      slug={slug}
      productId={productId}
      initialStore={data.store}
      initialProduct={data.product}
    />
  );
}
