import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchStoreServer } from "@/lib/store-design/server";
import { StoreFontLink } from "@/components/store-design/StoreFontLink";
import TryTheLookClient from "./try-the-look-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const store = await fetchStoreServer(slug);
  const name = store?.design.storeName || slug.replace(/-/g, " ");
  return {
    title: `Try the Look · ${name}`,
    robots: { index: true, follow: true },
  };
}

export default async function TryTheLookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const initialData = await fetchStoreServer(slug);
  if (!initialData) notFound();
  return (
    <>
      <StoreFontLink fontId={initialData.design.fontFamily} />
      <TryTheLookClient slug={slug} initialData={initialData} />
    </>
  );
}
