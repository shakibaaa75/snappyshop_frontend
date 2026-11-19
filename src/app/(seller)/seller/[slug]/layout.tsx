import { notFound, redirect } from "next/navigation";
import { requireSeller } from "@/lib/server/session";
import { SellerShell } from "./SellerShell";

export const dynamic = "force-dynamic";

export default async function SellerSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const me = await requireSeller(`/seller/${slug}/dashboard`);

  if (!me.storeSlug) redirect("/seller/setup");
  // A seller address that is not the seller's CURRENT one (for example the one
  // before a shop rename) is invalid: 404, never a redirect to the shop.
  if (slug !== me.storeSlug) notFound();

  return <SellerShell initialMe={me}>{children}</SellerShell>;
}
