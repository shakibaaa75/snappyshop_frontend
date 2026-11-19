import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchStoreServer } from "@/lib/store-design/server";
import CartClient from "./cart-client";
import { StoreFontLink } from "@/components/store-design/StoreFontLink";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Cart",
    robots: { index: false, follow: false },
  };
}

export default async function CartPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const initialStore = await fetchStoreServer(slug);
  if (!initialStore) notFound();
  return (
    <>
      <StoreFontLink fontId={initialStore.design.fontFamily} />
      <CartClient initialStore={initialStore} />
    </>
  );
}
