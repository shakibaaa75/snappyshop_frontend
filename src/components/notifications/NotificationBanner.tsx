"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api/auth";
import { qk } from "@/lib/query/keys";
import {
  useMarkNotificationRead,
  useSellerNotifications,
} from "@/lib/query/notifications";
import { NotificationCard } from "./notification-ui";

const MAX_SHOWN = 3;

/**
 * Unread admin notifications for a signed-in seller. Renders nothing for
 * visitors, buyers, admins, and sellers with nothing unread.
 *
 * Used on the home page and the seller dashboard. Dismissing (X) or opening
 * the link marks the notification read, so it stops showing in both places.
 */
export function NotificationBanner() {
  // Same key and options as the header's session query, so no extra request.
  const { data: me } = useQuery({
    queryKey: qk.auth.me,
    queryFn: authApi.me,
    retry: false,
    staleTime: 30_000,
  });
  const isSeller = me?.role === "SELLER";
  const { data } = useSellerNotifications(isSeller);
  const markRead = useMarkNotificationRead();

  if (!isSeller) return null;
  const unread = (data?.items ?? []).filter((n) => !n.read);
  if (unread.length === 0) return null;

  const shown = unread.slice(0, MAX_SHOWN);
  const more = unread.length - shown.length;

  return (
    <section aria-label="Notifications from ShopBD" className="space-y-2">
      {shown.map((n) => (
        <NotificationCard
          key={n.id}
          n={n}
          dismissible
          onRead={(id) => markRead.mutate(id)}
        />
      ))}
      {me?.storeSlug && (
        <div className="flex justify-end">
          <Link
            href={`/seller/${me.storeSlug}/notifications`}
            className="text-sm font-medium text-emerald-700 underline-offset-2 hover:underline"
          >
            {more > 0 ? `${more} more · ` : ""}View all notifications
          </Link>
        </div>
      )}
    </section>
  );
}
