import { requireSeller } from "@/lib/server/session";

export const dynamic = "force-dynamic";

// Covers every /seller/* route (setup and the legacy /seller/dashboard
// redirect included): only a signed-in seller gets any of it.
export default async function SellerAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSeller("/seller/dashboard");
  return <>{children}</>;
}
