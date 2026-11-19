"use client";

import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useSellerNotifications,
} from "@/lib/query/notifications";
import { NotificationPanel } from "@/components/notifications/notification-ui";

export default function SellerNotificationsPage() {
  const q = useSellerNotifications(true);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
        <NotificationPanel
          items={q.data?.items ?? []}
          unread={q.data?.unread ?? 0}
          loading={q.isLoading}
          error={q.isError}
          onRetry={() => q.refetch()}
          onRead={(id) => markRead.mutate(id)}
          onReadAll={() => markAll.mutate()}
          readAllPending={markAll.isPending}
        />
      </div>
    </div>
  );
}
