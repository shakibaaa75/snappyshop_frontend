import { SettingsShell } from "@/components/seller/settings/settings-shell";

// The seller layout above already checked the session and the shop address.
export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <SettingsShell storeSlug={slug}>{children}</SettingsShell>;
}
