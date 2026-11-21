"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  BellRing,
  CheckCheck,
  CheckCircle2,
  Info,
  Loader2,
  X,
} from "lucide-react";
import type {
  NotificationLevel,
  SellerNotification,
} from "@/lib/api/notifications";
import { cn } from "@/lib/utils";

export const LEVEL_LABEL: Record<NotificationLevel, string> = {
  info: "Info",
  success: "Good news",
  warning: "Warning",
  urgent: "Urgent",
};

export const LEVEL_STYLE: Record<
  NotificationLevel,
  {
    box: string;
    icon: string;
    chip: string;
    /** Soft avatar background. */
    tint: string;
    /** Solid small badge on the avatar corner. */
    badge: string;
    Icon: typeof Info;
  }
> = {
  info: {
    box: "border-primary/20 bg-primary/5",
    icon: "text-primary",
    chip: "bg-primary/10 text-primary",
    tint: "bg-primary/10",
    badge: "bg-primary",
    Icon: Info,
  },
  success: {
    box: "border-emerald-200 bg-emerald-50",
    icon: "text-emerald-600",
    chip: "bg-emerald-100 text-emerald-800",
    tint: "bg-emerald-100",
    badge: "bg-primary",
    Icon: CheckCircle2,
  },
  warning: {
    box: "border-amber-200 bg-amber-50",
    icon: "text-amber-600",
    chip: "bg-amber-100 text-amber-800",
    tint: "bg-amber-100",
    badge: "bg-amber-500",
    Icon: AlertTriangle,
  },
  urgent: {
    box: "border-red-200 bg-red-50",
    icon: "text-red-600",
    chip: "bg-red-100 text-red-800",
    tint: "bg-red-100",
    badge: "bg-red-500",
    Icon: BellRing,
  },
};

export function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

/* ------------------------------------------------------------------ */
/* One row                                                             */
/* ------------------------------------------------------------------ */

function Avatar({ n }: { n: SellerNotification }) {
  const style = LEVEL_STYLE[n.level] ?? LEVEL_STYLE.info;
  const Icon = style.Icon;
  return (
    <span
      className={cn(
        "relative grid h-11 w-11 shrink-0 place-items-center rounded-full sm:h-12 sm:w-12",
        n.read ? "bg-muted" : style.tint,
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 sm:h-6 sm:w-6",
          n.read ? "text-muted-foreground" : style.icon,
        )}
        strokeWidth={1.8}
      />
      <span
        className={cn(
          "absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full text-white ring-2 ring-card",
          n.read ? "bg-muted-foreground/40" : style.badge,
        )}
      >
        <Bell className="h-2.5 w-2.5" strokeWidth={2.4} />
      </span>
    </span>
  );
}

const pillDark =
  "inline-flex h-9 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90";
const pillLight =
  "inline-flex h-9 items-center justify-center rounded-full bg-muted px-5 text-sm font-semibold text-foreground transition hover:bg-border";

/**
 * A notification, flat (no box) so it can sit in a list. Left: avatar with a
 * small badge. Right: bold title + time, message, then pill buttons.
 * A green dot marks unread.
 */
export function NotificationRow({
  n,
  onRead,
  onNavigate,
  compact,
}: {
  n: SellerNotification;
  /** Mark this notification read. */
  onRead?: (id: string) => void;
  /** Called after a link is followed (e.g. close the panel). */
  onNavigate?: () => void;
  /** Tighter spacing + 2-line message (for the header panel). */
  compact?: boolean;
}) {
  const markRead = () => {
    if (!n.read) onRead?.(n.id);
  };
  const follow = () => {
    markRead();
    onNavigate?.();
  };
  const external = !!n.linkUrl && !n.linkUrl.startsWith("/");

  return (
    <div
      className={cn(
        "relative flex gap-3 px-4 sm:gap-4 sm:px-5",
        compact ? "py-3.5" : "py-4 sm:py-5",
      )}
    >
      <Avatar n={n} />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "min-w-0 text-[15px] leading-snug",
              n.read
                ? "font-medium text-muted-foreground"
                : "font-semibold text-foreground",
            )}
          >
            {n.title}
          </p>
          {!n.read && (
            <span
              aria-label="Unread"
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
            />
          )}
        </div>

        <p className="mt-0.5 text-xs text-muted-foreground">
          {timeAgo(n.createdAt)}
        </p>

        <p
          className={cn(
            "mt-1.5 whitespace-pre-line break-words text-sm leading-relaxed",
            n.read ? "text-muted-foreground" : "text-muted-foreground",
            compact && "line-clamp-2",
          )}
        >
          {n.body}
        </p>

        {(n.linkUrl || (!n.read && onRead)) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {n.linkUrl &&
              (external ? (
                <a
                  href={n.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={follow}
                  className={pillDark}
                >
                  View details
                </a>
              ) : (
                <Link href={n.linkUrl} onClick={follow} className={pillDark}>
                  View details
                </Link>
              ))}
            {!n.read && onRead && (
              <button type="button" onClick={markRead} className={pillLight}>
                Mark as read
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Card (home page + dashboard banners)                                */
/* ------------------------------------------------------------------ */

export function NotificationCard({
  n,
  onRead,
  dismissible,
}: {
  n: SellerNotification;
  onRead?: (id: string) => void;
  /** Show an X that marks the notification read (used by the banners). */
  dismissible?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <NotificationRow n={n} onRead={onRead} compact />
      {dismissible && !n.read && (
        <button
          type="button"
          onClick={() => onRead?.(n.id)}
          aria-label="Dismiss notification"
          title="Mark as read"
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Panel: title, All / Unread toggle, list                             */
/* ------------------------------------------------------------------ */

export function NotificationPanel({
  items,
  unread,
  loading,
  error,
  onRetry,
  onRead,
  onReadAll,
  readAllPending,
  onNavigate,
  footer,
  compact,
  className,
  listClassName,
  onBack,
}: {
  items: SellerNotification[];
  unread: number;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  onRead: (id: string) => void;
  onReadAll: () => void;
  readAllPending?: boolean;
  onNavigate?: () => void;
  footer?: React.ReactNode;
  compact?: boolean;
  className?: string;
  /** Classes for the scrolling list (e.g. a max height). */
  listClassName?: string;
  /** Shows a back arrow before the title (full-screen phone view). */
  onBack?: () => void;
}) {
  const [tab, setTab] = useState<"all" | "unread">("all");
  const shown = tab === "unread" ? items.filter((n) => !n.read) : items;

  const tabBtn = (id: "all" | "unread", label: string) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      aria-pressed={tab === id}
      className={cn(
        "rounded-full px-3.5 py-1.5 text-sm font-medium transition",
        tab === id
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
      {id === "unread" && unread > 0 && (
        <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </button>
  );

  return (
    <div className={cn("flex min-h-0 flex-col bg-card", className)}>
      <div className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back"
              className="-ml-1.5 grid h-9 w-9 shrink-0 place-items-center rounded-full text-foreground transition hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <h2 className="truncate text-lg font-semibold tracking-tight text-foreground">
            Notifications
          </h2>
        </div>
        <div className="flex items-center gap-1">
          {tabBtn("all", "All")}
          {tabBtn("unread", "Unread")}
        </div>
      </div>
      <div className="border-t border-border" />

      <div className={cn("min-h-0 flex-1 overflow-y-auto", listClassName)}>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-14 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : error ? (
          <div className="px-5 py-10 text-center text-sm text-destructive">
            Could not load notifications.{" "}
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="font-semibold underline"
              >
                Try again
              </button>
            )}
          </div>
        ) : shown.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-14 text-center">
            <Bell className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground">
              {tab === "unread"
                ? "No unread messages"
                : "You are all caught up"}
            </p>
            <p className="text-xs text-muted-foreground">
              Messages from the ShopBD team will show up here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {shown.map((n) => (
              <li key={n.id}>
                <NotificationRow
                  n={n}
                  onRead={onRead}
                  onNavigate={onNavigate}
                  compact={compact}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {(unread > 0 || footer) && (
        <div className="border-t border-border">
          {unread > 0 && (
            <button
              type="button"
              onClick={onReadAll}
              disabled={readAllPending}
              className="flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-60"
            >
              <CheckCheck className="h-4 w-4" /> Mark all as read
            </button>
          )}
          {footer}
        </div>
      )}
    </div>
  );
}
