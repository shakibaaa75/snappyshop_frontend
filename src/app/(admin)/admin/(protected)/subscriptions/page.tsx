import { redirect } from "next/navigation";

// Old address of the plans editor. Per-seller subscriptions are managed on each
// seller's page (Admin > Sellers).
export default function AdminSubscriptionsPage() {
  redirect("/admin/plans");
}
