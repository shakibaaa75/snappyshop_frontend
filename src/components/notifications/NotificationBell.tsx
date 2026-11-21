"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { qk } from "@/lib/query/keys";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useSellerNotifications,
} from "@/lib/query/notifications";
import { NotificationPanel } from "./notification-ui";
import { cn } from "@/lib/utils";

const SLIDE_CSS = `
@keyframes nb-slide-in { from { transform: translateX(100%); } to { transform: none; } }
.nb-slide-in { animation: nb-slide-in 260ms cubic-bezier(0.22, 1, 0.36, 1); }
@media (prefers-reduced-motion: reduce) { .nb-slide-in { animation: none; } }
`;

/**
 * Bell for the main header (signed in only).
 *  - sellers: unread count + panel. Bottom sheet on phones, dropdown on larger screens.
 *  - admins: shortcut to the notification composer.
 *  - buyers / visitors: nothing.
 */
export function NotificationBell({ className }: { className?: string }) {
  const { data: me } = useQuery({
    queryKey: qk.auth.me,
    queryFn: authApi.me,
    retry: false,
    staleTime: 30_000,
  });
  const isSeller = me?.role === "SELLER";
  const isAdmin = me?.role === "ADMIN";
  const q = useSellerNotifications(isSeller);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const [open, setOpen] = useState(false);
  // Phone = bottom sheet. It is portaled to <body> because the sticky header
  // uses backdrop-filter, which would make `fixed` children relative to it.
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setPhone(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      // On phones the sheet has its own backdrop; this covers desktop.
      if (phone) return;
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    // Lock page scroll behind the phone sheet.
    const prev = document.body.style.overflow;
    if (phone) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, phone]);

  if (isAdmin) {
    return (
      <Link
        href="/admin/notifications"
        aria-label="Send notifications"
        className={className}
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={1.9} />
      </Link>
    );
  }
  if (!isSeller) return null;

  const items = q.data?.items ?? [];
  const unread = q.data?.unread ?? 0;
  const allHref = me?.storeSlug
    ? `/seller/${me.storeSlug}/notifications`
    : null;

  const footer = allHref && (
    <Link
      href={allHref}
      onClick={() => setOpen(false)}
      className="block border-t border-border px-4 py-3 text-center text-sm font-semibold text-primary transition hover:bg-muted"
    >
      View all notifications
    </Link>
  );

  const panel = (extra: { onBack?: () => void; className: string }) => (
    <NotificationPanel
      items={items}
      unread={unread}
      loading={q.isLoading}
      error={q.isError}
      onRetry={() => q.refetch()}
      onRead={(id) => markRead.mutate(id)}
      onReadAll={() => markAll.mutate()}
      readAllPending={markAll.isPending}
      onNavigate={() => setOpen(false)}
      compact
      footer={footer}
      {...extra}
    />
  );

  // Phone: full-screen page that slides in from the right.
  const phoneView = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Notifications"
      className="nb-slide-in fixed inset-0 z-[70] flex flex-col bg-card pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]"
    >
      <style>{SLIDE_CSS}</style>
      {panel({ onBack: () => setOpen(false), className: "h-full flex-1" })}
    </div>
  );

  // Tablet / desktop: dropdown under the bell.
  const desktopView = (
    <div
      role="dialog"
      aria-label="Notifications"
      className="absolute right-0 top-full z-[70] mt-2 w-[400px] overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
    >
      {panel({ className: "max-h-[min(70vh,560px)]" })}
    </div>
  );

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={
          unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
        }
        className={cn("relative", className)}
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={1.9} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground ring-2 ring-background">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open &&
        (phone
          ? typeof document !== "undefined" &&
            createPortal(
              phoneView,
              wrap.current?.closest<HTMLElement>(".marketplace-public") ??
                document.body,
            )
          : desktopView)}
    </div>
  );
}
