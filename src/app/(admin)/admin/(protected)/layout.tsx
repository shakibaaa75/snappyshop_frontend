import { requireAdmin } from "@/lib/server/session";
import { AdminShell } from "./AdminShell";

// Everything under /admin except /admin/login lives in this route group. The
// check runs on the server before anything below is rendered, so the admin UI
// is never sent to a visitor who isn't a signed-in admin past the 2FA gate.
export const dynamic = "force-dynamic";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin("/admin/login");
  return <AdminShell>{children}</AdminShell>;
}
