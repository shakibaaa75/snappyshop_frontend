import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  sellerNotifications,
  type SellerNotification,
} from "@/lib/api/notifications";
import { qk } from "@/lib/query/keys";

type ListData = { items: SellerNotification[]; unread: number };

/**
 * The signed-in seller's notifications. Pass enabled=false for visitors who
 * are not sellers, so no request is made. Re-checks every 30 seconds and when
 * the tab regains focus, so a new admin message shows up without a reload.
 */
export function useSellerNotifications(enabled: boolean) {
  return useQuery({
    queryKey: qk.seller.notifications.list(),
    queryFn: sellerNotifications.list,
    enabled,
    staleTime: 10_000,
    refetchInterval: 30_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    retry: false,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  const key = qk.seller.notifications.list();
  return useMutation({
    mutationFn: (id: string) => sellerNotifications.markRead(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<ListData>(key);
      if (prev) {
        const wasUnread = prev.items.some((n) => n.id === id && !n.read);
        qc.setQueryData<ListData>(key, {
          items: prev.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
          unread: Math.max(0, prev.unread - (wasUnread ? 1 : 0)),
        });
      }
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  const key = qk.seller.notifications.list();
  return useMutation({
    mutationFn: () => sellerNotifications.markAllRead(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<ListData>(key);
      if (prev) {
        qc.setQueryData<ListData>(key, {
          items: prev.items.map((n) => ({ ...n, read: true })),
          unread: 0,
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}
