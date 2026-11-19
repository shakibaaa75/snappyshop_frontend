import { notFound } from "next/navigation";
import { DeviceHintProvider } from "@/lib/store-design/device-hint";
import { getMobileHint } from "@/lib/store-design/device-hint-server";
import { fetchStoreServer } from "@/lib/store-design/server";
import StoreShell from "./store-shell";

export default async function StoreSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  // Every storefront route (home, products, cart, checkout, order, wishlist)
  // goes through this check, so a retired or unknown address is a plain 404.
  // fetchStoreServer is memoized per request, so this adds no extra call for
  // pages that load the store anyway.
  const { slug } = await params;
  const store = await fetchStoreServer(slug);
  if (!store) notFound();

  const mobile = await getMobileHint();
  return (
    <DeviceHintProvider value={mobile}>
      <StoreShell>{children}</StoreShell>
    </DeviceHintProvider>
  );
}
