"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { OPEN_NOTIFICATIONS_EVENT } from "@/components/seller/NotificationDrawer";

/**
 * Notifications no longer have their own page: they open in a drawer on the
 * right. Old links and bookmarks land here, go to the dashboard and open it.
 */
export default function SellerNotificationsPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();

  useEffect(() => {
    router.replace(`/seller/${slug}/dashboard`);
    const t = window.setTimeout(
      () => window.dispatchEvent(new Event(OPEN_NOTIFICATIONS_EVENT)),
      300,
    );
    return () => window.clearTimeout(t);
  }, [router, slug]);

  return null;
}
