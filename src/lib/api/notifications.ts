/**
 * Admin -> seller notifications.
 *
 *   sellerNotifications  /api/v1/seller/notifications   (what a seller reads)
 *   adminNotifications   /api/v1/admin/notifications    (what an admin sends)
 */
import { apiFetch } from "./http";

export type NotificationLevel = "info" | "success" | "warning" | "urgent";
export type NotificationAudience = "all" | "selected";

export interface SellerNotification {
  id: string;
  title: string;
  body: string;
  level: NotificationLevel;
  /** "/path" on this site, or a full https:// address. */
  linkUrl?: string;
  createdAt: string;
  read: boolean;
}

export interface AdminNotification {
  id: string;
  title: string;
  body: string;
  level: NotificationLevel;
  linkUrl?: string;
  audience: NotificationAudience;
  recipientIds?: string[];
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
  /** How many sellers have read it. */
  readCount: number;
  /** How many sellers it reaches (for "all", today's seller count). */
  recipientCount: number;
}

export interface SendNotificationInput {
  title: string;
  body: string;
  level: NotificationLevel;
  linkUrl?: string;
  audience: NotificationAudience;
  /** Required when audience is "selected". */
  sellerIds?: string[];
  /** ISO time; the notification disappears for sellers after it. */
  expiresAt?: string;
}

export const sellerNotifications = {
  list: () =>
    apiFetch<{ items: SellerNotification[]; unread: number }>(
      "/seller/notifications",
    ),
  markRead: (id: string) =>
    apiFetch<void>(`/seller/notifications/${id}/read`, { method: "POST" }),
  markAllRead: () =>
    apiFetch<void>("/seller/notifications/read-all", { method: "POST" }),
};

export const adminNotifications = {
  list: (params?: { limit?: number; skip?: number }) => {
    const sp = new URLSearchParams();
    if (params?.limit != null) sp.set("limit", String(params.limit));
    if (params?.skip != null) sp.set("skip", String(params.skip));
    const qs = sp.toString();
    return apiFetch<{
      notifications: AdminNotification[];
      total: number;
      limit: number;
      skip: number;
    }>(`/admin/notifications${qs ? `?${qs}` : ""}`);
  },
  send: (input: SendNotificationInput) =>
    apiFetch<{ notification: AdminNotification }>("/admin/notifications", {
      method: "POST",
      body: input,
    }),
  remove: (id: string) =>
    apiFetch<void>(`/admin/notifications/${id}`, { method: "DELETE" }),
};
