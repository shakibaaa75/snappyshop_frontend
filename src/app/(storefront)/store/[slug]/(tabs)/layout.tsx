import { notFound } from "next/navigation";
import { fetchStoreServer } from "@/lib/store-design/server";
import { StoreTabsShell } from "./tabs-shell";
import { StoreFontLink } from "@/components/store-design/StoreFontLink";

/**
 * Persistent shell for Shop / About / Contact / Wishlist.
 *
 * Next.js keeps a layout mounted while its child pages change, so the header,
 * profile card, dock and react-query cache survive tab switches. The store is
 * fetched once here; the pages below only provide metadata.
 */
export default async function StoreTabsLayout({
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const initialData = await fetchStoreServer(slug);
  if (!initialData) notFound();
  return (
    <>
      <StoreFontLink fontId={initialData.design.fontFamily} />
      <StoreTabsShell initialData={initialData} />
    </>
  );
}
