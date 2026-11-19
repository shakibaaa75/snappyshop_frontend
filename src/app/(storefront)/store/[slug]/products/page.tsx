import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchStoreServer } from "@/lib/store-design/server";
import ProductsClient from "./products-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `All products · ${slug}`,
    robots: { index: true, follow: true },
  };
}

export default async function StoreProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { slug } = await params;
  const { category } = await searchParams;

  // Fetch on the server (3 requests in parallel, next to the API) so the
  // first HTML already contains the store. Without this the browser had to
  // download the JS bundle, hydrate, and only then start the API requests.
  const initialData = await fetchStoreServer(slug);
  if (!initialData) notFound();

  return (
    <ProductsClient
      slug={slug}
      initialCategory={category}
      initialData={initialData}
    />
  );
}
