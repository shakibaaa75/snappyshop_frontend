"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useSellerNotifications,
} from "@/lib/query/notifications";
import { NotificationPanel } from "@/components/notifications/notification-ui";

/** Event any seller page can fire to open the notifications drawer. */
export const OPEN_NOTIFICATIONS_EVENT = "seller:open-notifications";

/**
 * Notifications panel that slides in from the right, over the current page.
 * Replaces the old full "Notifications" page, so the seller never leaves
 * what they were doing.
 */
export function NotificationDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const q = useSellerNotifications(true);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        // The panel has its own title row, so the default X is hidden.
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md [&>button]:hidden"
      >
        <SheetTitle className="sr-only">Notifications</SheetTitle>
        <SheetDescription className="sr-only">
          Messages from the ShopBD team
        </SheetDescription>
        <NotificationPanel
          className="h-full flex-1"
          listClassName="overscroll-contain"
          // Only the latest messages, so the panel opens without a stall.
          items={(q.data?.items ?? []).slice(0, 50)}
          unread={q.data?.unread ?? 0}
          loading={q.isLoading}
          error={q.isError}
          onRetry={() => q.refetch()}
          onRead={(id) => markRead.mutate(id)}
          onReadAll={() => markAll.mutate()}
          readAllPending={markAll.isPending}
          onNavigate={() => onOpenChange(false)}
          onBack={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
