"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
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
 *
 * On mobile it is NON-modal and stops above the bottom navigation bar, so the
 * bar stays visible and its tabs stay clickable. On desktop (lg+) it keeps the
 * dimmed backdrop and closes when you click outside.
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
    <DialogPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      // Non-modal: nothing outside the drawer is blocked (the bottom bar).
      modal={false}
    >
      <DialogPrimitive.Portal>
        {/* Desktop only backdrop. Hidden on mobile so the bottom bar is free. */}
        {open && (
          <div
            aria-hidden="true"
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-50 hidden bg-black/50 lg:block"
          />
        )}
        <DialogPrimitive.Content
          aria-describedby={undefined}
          // Keep focus where it was; the bottom bar must stay usable.
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            // Tapping the bottom bar is navigation, not "outside": let the tab
            // work (the shell closes the drawer on route change) and don't
            // double-toggle the Notifications tab.
            const target = e.target as HTMLElement | null;
            if (target?.closest('[aria-label="Seller navigation"]')) {
              e.preventDefault();
            }
          }}
          className={
            "fixed right-0 top-0 z-50 flex w-full flex-col gap-0 border-l bg-background p-0 shadow-lg " +
            // Mobile: end above the bottom bar (bar height + safe area).
            "bottom-[calc(3.5rem+env(safe-area-inset-bottom))] " +
            "lg:bottom-0 sm:max-w-md " +
            "data-[state=open]:animate-in data-[state=closed]:animate-out " +
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right " +
            "data-[state=open]:duration-300 data-[state=closed]:duration-200 motion-reduce:animate-none"
          }
        >
          <DialogPrimitive.Title className="sr-only">
            Notifications
          </DialogPrimitive.Title>
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
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
