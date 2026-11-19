"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Loader2,
  PackageOpen,
  Search,
  ShieldCheck,
  Truck,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/http";
import { qk } from "@/lib/query/keys";
import {
  sellerOrders,
  type OrderStatus,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_COLOR,
  PAYMENT_LABEL,
  formatBDT,
} from "@/lib/api/orders";
import { sellerCouriers } from "@/lib/api/couriers";
import {
  MAX_BULK_SHIP,
  SHIPMENTS_KEY,
  canShip,
  sellerShipping,
  type Shipment,
} from "@/lib/api/shipping";
import { FRAUD_STATUS_KEY, fraudSavedKey, sellerFraud } from "@/lib/api/froud";
import { ShipCourierModal } from "@/components/seller/ship-courier-modal";
import { FraudCheckPanel } from "@/components/seller/fraud-check-panel";

type Filter = "all" | OrderStatus;

// The order list API does not include `shipment`; it is merged in below from
// GET /seller/shipments (and set directly right after shipping).
type OrderRow = NonNullable<
  Awaited<ReturnType<typeof sellerOrders.list>>
>[number] & { shipment?: Shipment | null };

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

const AVATAR_COLORS = [
  "bg-emerald-600",
  "bg-amber-500",
  "bg-sky-600",
  "bg-rose-500",
  "bg-violet-600",
  "bg-teal-600",
];

const COURIER_PREF_KEY = "shopbd.preferredCourierConnection";

function avatarColor(name: string) {
  let n = 0;
  for (let i = 0; i < name.length; i++) n += name.charCodeAt(i);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : fallback;
}

type Notice = {
  type: "success" | "error";
  text: string;
  details?: string[];
};

const FRAUD_OPEN_EVENT = "orders:open-fraud";

/**
 * The fraud popup. It keeps its own state and listens for an event, so opening
 * it does not re-render the whole order list (that re-render is what made taps
 * feel slow on phones).
 */
function FraudPopupHost({ enabled }: { enabled: boolean }) {
  const [target, setTarget] = useState<{
    id: string;
    number: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    const onOpen = (e: Event) =>
      setTarget(
        (e as CustomEvent<{ id: string; number: string; name: string }>).detail,
      );
    window.addEventListener(FRAUD_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(FRAUD_OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTarget(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [target]);

  if (!enabled || !target) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onClick={() => setTarget(null)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Fraud check for order ${target.number}`}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:max-w-md sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-medium">Fraud check</h2>
            <p className="truncate text-xs text-neutral-500">
              {target.number} · {target.name}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setTarget(null)}
            className="-m-1 shrink-0 rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <FraudCheckPanel orderId={target.id} />
      </div>
    </div>
  );
}

export default function SellerOrdersPage() {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preferredId, setPreferredId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  // "Choose a courier" step: which orders it is for, the pick, and any error.
  const [shipIds, setShipIds] = useState<string[] | null>(null);
  const [selectedCourierId, setSelectedCourierId] = useState<string | null>(
    null,
  );
  const [shipError, setShipError] = useState<string | null>(null);

  // Same query key as the dashboard + layout prefetch, so it's usually instant.
  const { data, isLoading, error } = useQuery({
    queryKey: qk.seller.orders.list("all"),
    queryFn: () => sellerOrders.list({ status: "all", limit: 100 }),
  });

  const couriers = useQuery({
    queryKey: qk.seller.couriers.list(),
    queryFn: sellerCouriers.list,
    // Always re-check when this page opens: a courier can flip to
    // "needs reconnection" at any time (for example after the courier
    // rejects a booking), and a stale list would still offer it.
    staleTime: 0,
    refetchOnMount: "always",
  });

  const shipments = useQuery({
    queryKey: SHIPMENTS_KEY,
    queryFn: sellerShipping.list,
    staleTime: 15_000,
  });

  // The fraud check only appears when the admin has switched it on.
  const fraudStatus = useQuery({
    queryKey: FRAUD_STATUS_KEY,
    queryFn: sellerFraud.enabled,
    staleTime: 5 * 60_000,
  });
  const fraudEnabled = fraudStatus.data === true;

  /**
   * Start loading an order's saved result as soon as the finger or mouse is on
   * the shield, so the popup opens with the data already there.
   */
  function prefetchFraud(orderId: string) {
    if (!fraudEnabled) return;
    queryClient.prefetchQuery({
      queryKey: fraudSavedKey(orderId),
      queryFn: () => sellerFraud.saved(orderId),
      staleTime: Infinity,
    });
  }

  /** Open the popup without re-rendering this page. */
  function openFraud(o: { id: string; number: string; customerName: string }) {
    window.dispatchEvent(
      new CustomEvent(FRAUD_OPEN_EVENT, {
        detail: { id: o.id, number: o.number, name: o.customerName },
      }),
    );
  }

  // Render only the layout that fits the screen (cards on phones, table on
  // larger screens) instead of keeping both in the page.
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const orders = useMemo(() => {
    const byOrder = new Map(
      (shipments.data ?? []).map((s) => [s.orderId, s] as const),
    );
    return ((data ?? []) as OrderRow[]).map((o) =>
      o.shipment ? o : { ...o, shipment: byOrder.get(o.id) ?? null },
    );
  }, [data, shipments.data]);

  // Only working connections can ship. "Needs Reconnection" and "Failed" cannot.
  const usable = useMemo(
    () => (couriers.data ?? []).filter((c) => c.status === "connected"),
    [couriers.data],
  );

  // Remember the seller's last courier choice in this browser.
  useEffect(() => {
    try {
      setPreferredId(localStorage.getItem(COURIER_PREF_KEY));
    } catch {
      /* storage unavailable */
    }
  }, []);

  function rememberCourier(id: string) {
    setPreferredId(id);
    try {
      localStorage.setItem(COURIER_PREF_KEY, id);
    } catch {
      /* storage unavailable */
    }
  }

  useEffect(() => {
    if (!notice) return;
    // Keep bulk failure details on screen longer.
    const t = setTimeout(() => setNotice(null), notice.details ? 15000 : 6000);
    return () => clearTimeout(t);
  }, [notice]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [orders]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter !== "all" && o.status !== filter) return false;
      if (q && !`${o.number} ${o.customerName}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [orders, filter, search]);

  const visibleShippable = useMemo(
    () => visible.filter((o) => canShip(o)),
    [visible],
  );
  const selectedShippable = useMemo(
    () => orders.filter((o) => selected.has(o.id) && canShip(o)),
    [orders, selected],
  );
  const allVisibleSelected =
    visibleShippable.length > 0 &&
    visibleShippable.every((o) => selected.has(o.id));

  /** Show the new status and tracking right away, then confirm in the background. */
  function applyShipped(orderId: string, shipment: Shipment) {
    queryClient.setQueryData<OrderRow[]>(qk.seller.orders.list("all"), (old) =>
      old?.map((o) =>
        o.id === orderId
          ? { ...o, status: "shipped" as OrderStatus, shipment }
          : o,
      ),
    );
    queryClient.setQueryData<Shipment[]>(SHIPMENTS_KEY, (old) => [
      shipment,
      ...(old ?? []).filter((s) => s.orderId !== orderId),
    ]);
  }

  function refreshAfterShipping() {
    queryClient.invalidateQueries({ queryKey: qk.seller.stats() });
    queryClient.invalidateQueries({ queryKey: qk.seller.orders.all });
    queryClient.invalidateQueries({ queryKey: SHIPMENTS_KEY });
    // A failed booking can flip a courier's status; keep the list honest.
    queryClient.invalidateQueries({ queryKey: qk.seller.couriers.list() });
  }

  const shipOne = useMutation({
    mutationFn: (v: { orderId: string; connectionId: string }) =>
      sellerShipping.ship(v.orderId, v.connectionId),
    onSuccess: (shipment, v) => {
      applyShipped(v.orderId, shipment);
      setSelected((s) => {
        const next = new Set(s);
        next.delete(v.orderId);
        return next;
      });
      setShipIds(null);
      setShipError(null);
      setNotice(
        shipment.warning
          ? { type: "error", text: shipment.warning }
          : {
              type: "success",
              text: `Shipped with ${shipment.providerName}. Tracking: ${shipment.trackingCode}`,
            },
      );
      refreshAfterShipping();
    },
    onError: (err) => {
      // Keep the courier window open so the seller sees why and can retry.
      setShipError(errorMessage(err, "Could not create the shipment."));
      refreshAfterShipping();
    },
  });

  const shipMany = useMutation({
    mutationFn: (v: { orderIds: string[]; connectionId: string }) =>
      sellerShipping.shipMany(v.orderIds, v.connectionId),
    onSuccess: (results) => {
      const done = new Set<string>();
      const failed: string[] = [];
      for (const r of results) {
        if (r.ok && r.shipment) {
          applyShipped(r.orderId, r.shipment);
          done.add(r.orderId);
        } else {
          const num =
            orders.find((o) => o.id === r.orderId)?.number ?? r.orderId;
          failed.push(`${num}: ${r.error || "Could not ship."}`);
        }
      }
      setSelected((s) => {
        const next = new Set(s);
        done.forEach((id) => next.delete(id));
        return next;
      });
      setShipIds(null);
      setShipError(null);
      setNotice(
        failed.length === 0
          ? {
              type: "success",
              text: `${done.size} ${done.size === 1 ? "order" : "orders"} shipped.`,
            }
          : {
              type: "error",
              text: `${done.size} shipped, ${failed.length} failed.`,
              details: failed,
            },
      );
      refreshAfterShipping();
    },
    onError: (err) => {
      // The whole request was refused (for example the courier is not usable).
      setShipError(errorMessage(err, "Could not ship the selected orders."));
      refreshAfterShipping();
    },
  });

  const anyBusy = shipOne.isPending || shipMany.isPending;

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelected((s) => {
      const next = new Set(s);
      if (allVisibleSelected)
        visibleShippable.forEach((o) => next.delete(o.id));
      else visibleShippable.forEach((o) => next.add(o.id));
      return next;
    });
  }

  /** Open the "choose a courier" step for one or several orders. */
  function openShip(ids: string[]) {
    if (anyBusy || ids.length === 0) return;
    if (ids.length > MAX_BULK_SHIP) {
      setNotice({
        type: "error",
        text: `You can ship up to ${MAX_BULK_SHIP} orders at once. Deselect some and try again.`,
      });
      return;
    }
    setShipError(null);
    setNotice(null);
    setSelectedCourierId(
      (usable.find((c) => c.id === preferredId) ?? usable[0])?.id ?? null,
    );
    setShipIds(ids);
  }

  /** The courier window is the confirmation: choosing and pressing Ship books it. */
  function submitShip() {
    if (!shipIds || anyBusy) return;
    const chosen = usable.find((c) => c.id === selectedCourierId);
    if (!chosen) return;
    rememberCourier(chosen.id);
    setShipError(null);
    if (shipIds.length === 1) {
      shipOne.mutate({ orderId: shipIds[0], connectionId: chosen.id });
    } else {
      shipMany.mutate({ orderIds: shipIds, connectionId: chosen.id });
    }
  }

  const shipSubtitle = (() => {
    if (!shipIds) return "";
    if (shipIds.length === 1) {
      const o = orders.find((x) => x.id === shipIds[0]);
      if (!o) return "";
      const cod = o.paymentMethod === "cod" && !o.paid;
      return `Order ${o.number}${cod ? ` · Collect ${formatBDT(o.total)} on delivery` : ""}`;
    }
    return `${shipIds.length} orders`;
  })();

  /** Shipping column / card footer content, shared by table and phone cards. */
  function renderShipping(o: OrderRow, shippable: boolean) {
    if (o.shipment) {
      return (
        <div className="min-w-0 text-xs md:text-left">
          <p className="truncate text-neutral-500">{o.shipment.providerName}</p>
          {o.shipment.trackingUrl ? (
            <a
              href={o.shipment.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all font-medium text-emerald-700 hover:underline"
            >
              {o.shipment.trackingCode}
            </a>
          ) : (
            <p className="break-all font-medium">{o.shipment.trackingCode}</p>
          )}
        </div>
      );
    }
    if (shippable) {
      return (
        <button
          type="button"
          disabled={anyBusy}
          title="Choose a courier and ship"
          onClick={() => openShip([o.id])}
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-4 py-2 text-xs font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 md:px-3.5 md:py-1.5"
        >
          <Truck className="h-3.5 w-3.5" />
          Ship
        </button>
      );
    }
    return (
      <span className="text-xs text-neutral-400">
        {o.status === "pending" ? "Confirm first" : "—"}
      </span>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <header>
        <h1 className="text-2xl font-medium tracking-tight sm:text-3xl md:text-4xl">
          Orders
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Track, confirm and ship what your customers have ordered.
        </p>
      </header>

      {notice && (
        <div
          role="status"
          className={cn(
            "flex items-start gap-3 rounded-2xl border p-3.5 text-sm sm:p-4",
            notice.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-destructive/30 bg-destructive/10 text-destructive",
          )}
        >
          {notice.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="break-words">{notice.text}</p>
            {notice.details && (
              <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-xs">
                {notice.details.map((d, i) => (
                  <li key={i} className="break-words">
                    {d}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setNotice(null)}
            className="-m-1 shrink-0 p-1 opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <section className="rounded-3xl bg-white p-3 shadow-sm sm:rounded-[26px] sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Filter tabs scroll sideways; bleed to the card edge on phones */}
          <div className="-mx-3 overflow-x-auto px-3 [scrollbar-width:none] sm:mx-0 sm:px-0 md:max-w-full [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max gap-1 rounded-full bg-neutral-100 p-1">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition sm:px-4",
                    filter === f.id
                      ? "bg-emerald-700 text-white"
                      : "text-neutral-500 hover:text-neutral-900",
                  )}
                >
                  {f.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[11px]",
                      filter === f.id
                        ? "bg-white/20"
                        : "bg-white text-neutral-500",
                    )}
                  >
                    {counts[f.id] ?? 0}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <label className="relative block w-full md:w-64">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order or customer"
              // text-base on phones stops iOS from zooming in on focus
              className="h-11 w-full rounded-full bg-neutral-100 pl-10 pr-4 text-base outline-none transition placeholder:text-neutral-400 focus:ring-2 focus:ring-emerald-600/40 sm:h-10 sm:text-sm"
            />
          </label>
        </div>

        {/* Heads-up when no courier can ship right now */}
        {!couriers.isLoading && !couriers.error && usable.length === 0 && (
          <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-amber-50 p-3.5 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex min-w-0 items-start gap-2">
              <Truck className="mt-0.5 h-4 w-4 shrink-0" />
              {(couriers.data ?? []).length === 0
                ? "Connect a courier to ship orders with one click."
                : "None of your couriers is working right now. Reconnect one to ship."}
            </span>
            <Link
              href={`/seller/${slug}/couriers`}
              className="shrink-0 rounded-full bg-white px-4 py-2 text-center text-xs font-medium text-amber-900 shadow-sm hover:bg-amber-100 sm:py-1.5"
            >
              Courier Services
            </Link>
          </div>
        )}

        {/* Bulk bar: sticks to the bottom of the screen on phones */}
        {selectedShippable.length > 0 && (
          <div className="sticky bottom-3 z-20 mt-4 flex items-center justify-between gap-3 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-900 shadow-lg ring-1 ring-emerald-200 sm:static sm:shadow-none sm:ring-0">
            <span className="font-medium">
              {selectedShippable.length} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                disabled={anyBusy}
                className="rounded-full bg-white px-4 py-2 text-xs font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 disabled:opacity-60 sm:py-1.5"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => openShip(selectedShippable.map((o) => o.id))}
                disabled={anyBusy}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-xs font-medium text-white transition hover:bg-emerald-800 disabled:opacity-60 sm:py-1.5"
              >
                <Truck className="h-3.5 w-3.5" />
                Ship {selectedShippable.length}…
              </button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-20 text-sm text-neutral-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading orders…
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error instanceof ApiError
              ? error.message
              : "Could not load orders."}
          </div>
        )}

        {!isLoading && !error && visible.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
              <PackageOpen className="h-6 w-6 text-neutral-500" />
            </span>
            <p className="max-w-sm px-4 text-sm text-neutral-500">
              {orders.length === 0
                ? "No orders yet. When someone buys from your store, it shows up here."
                : "No orders match your search or filter."}
            </p>
          </div>
        )}

        {/* ───────── Phone: one card per order ───────── */}
        {!isLoading && !error && visible.length > 0 && isDesktop === false && (
          <div className="mt-4">
            {visibleShippable.length > 0 && (
              <label className="mb-3 flex items-center gap-3 px-1 text-sm text-neutral-600">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  disabled={anyBusy}
                  onChange={toggleAllVisible}
                  className="h-5 w-5 rounded accent-emerald-700"
                />
                Select all shippable ({visibleShippable.length})
              </label>
            )}
            <ul className="space-y-3">
              {visible.map((o) => {
                const c = ORDER_STATUS_COLOR[o.status];
                const d = new Date(o.createdAt);
                const href = `/seller/${slug}/orders/${o.id}`;
                const shippable = canShip(o);
                return (
                  <li
                    key={o.id}
                    className={cn(
                      "rounded-2xl border p-3.5 transition",
                      selected.has(o.id)
                        ? "border-emerald-300 bg-emerald-50/50"
                        : "border-neutral-200",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {shippable && (
                        <input
                          type="checkbox"
                          aria-label={`Select order ${o.number}`}
                          checked={selected.has(o.id)}
                          disabled={anyBusy}
                          onChange={() => toggle(o.id)}
                          className="h-5 w-5 shrink-0 rounded accent-emerald-700"
                        />
                      )}
                      <Link
                        href={href}
                        className="flex min-w-0 flex-1 items-center gap-3"
                      >
                        <span
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white",
                            avatarColor(o.customerName),
                          )}
                        >
                          {o.customerName.trim().charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">
                            {o.customerName}
                          </span>
                          <span className="block truncate text-xs text-neutral-500">
                            {o.number} ·{" "}
                            <span className="text-emerald-600">
                              {PAYMENT_LABEL[o.paymentMethod]}
                            </span>
                          </span>
                        </span>
                      </Link>
                      {fraudEnabled && (
                        <button
                          type="button"
                          aria-label={`Fraud check for order ${o.number}`}
                          onPointerEnter={() => prefetchFraud(o.id)}
                          onFocus={() => prefetchFraud(o.id)}
                          onClick={() => openFraud(o)}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 transition active:bg-emerald-700 active:text-white"
                        >
                          <ShieldCheck className="h-4 w-4" />
                        </button>
                      )}
                      <Link
                        href={href}
                        aria-label={`Open order ${o.number}`}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition active:bg-emerald-700 active:text-white"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                          c.bg,
                          c.text,
                        )}
                      >
                        <span
                          className={cn("h-1.5 w-1.5 rounded-full", c.dot)}
                        />
                        {ORDER_STATUS_LABEL[o.status]}
                      </span>
                      <span className="text-base font-semibold">
                        {formatBDT(o.total)}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-neutral-100 pt-3">
                      <span className="text-xs text-neutral-500">
                        {d.toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                        <br />
                        {d.toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <div className="min-w-0 text-right">
                        {renderShipping(o, shippable)}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* ───────── Tablet / desktop: table ───────── */}
        {!isLoading && !error && visible.length > 0 && isDesktop === true && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="text-left text-xs text-neutral-500">
                  <th className="w-10 px-3 py-2">
                    <input
                      type="checkbox"
                      aria-label="Select all shippable orders"
                      checked={allVisibleSelected}
                      disabled={visibleShippable.length === 0 || anyBusy}
                      onChange={toggleAllVisible}
                      className="h-4 w-4 rounded accent-emerald-700"
                    />
                  </th>
                  <th className="px-3 py-2 font-normal">Order</th>
                  <th className="px-3 py-2 font-normal">Date</th>
                  <th className="px-3 py-2 font-normal">Time</th>
                  <th className="px-3 py-2 font-normal">Status</th>
                  <th className="px-3 py-2 text-right font-normal">Amount</th>
                  <th className="px-3 py-2 font-normal">Shipping</th>
                  <th
                    className={cn("px-3 py-2", fraudEnabled ? "w-24" : "w-12")}
                  />
                </tr>
              </thead>
              <tbody>
                {visible.map((o) => {
                  const c = ORDER_STATUS_COLOR[o.status];
                  const d = new Date(o.createdAt);
                  const href = `/seller/${slug}/orders/${o.id}`;
                  const shippable = canShip(o);
                  return (
                    <tr key={o.id} className="group">
                      <td className="rounded-l-2xl px-3 py-3 transition group-hover:bg-neutral-100">
                        {shippable ? (
                          <input
                            type="checkbox"
                            aria-label={`Select order ${o.number}`}
                            checked={selected.has(o.id)}
                            disabled={anyBusy}
                            onChange={() => toggle(o.id)}
                            className="h-4 w-4 rounded accent-emerald-700"
                          />
                        ) : null}
                      </td>
                      <td className="px-3 py-3 transition group-hover:bg-neutral-100">
                        <Link href={href} className="flex items-center gap-3">
                          <span
                            className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white",
                              avatarColor(o.customerName),
                            )}
                          >
                            {o.customerName.trim().charAt(0).toUpperCase()}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-medium">
                              {o.number} · {o.customerName}
                            </span>
                            <span className="block text-[11px] text-emerald-600">
                              {PAYMENT_LABEL[o.paymentMethod]}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 transition group-hover:bg-neutral-100">
                        {d.toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-3 py-3 transition group-hover:bg-neutral-100">
                        {d.toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-3 py-3 transition group-hover:bg-neutral-100">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                            c.bg,
                            c.text,
                          )}
                        >
                          <span
                            className={cn("h-1.5 w-1.5 rounded-full", c.dot)}
                          />
                          {ORDER_STATUS_LABEL[o.status]}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-right font-medium transition group-hover:bg-neutral-100">
                        {formatBDT(o.total)}
                      </td>
                      <td className="px-3 py-3 transition group-hover:bg-neutral-100">
                        {renderShipping(o, shippable)}
                      </td>
                      <td className="rounded-r-2xl px-3 py-3 transition group-hover:bg-neutral-100">
                        <div className="flex items-center gap-2">
                          {fraudEnabled && (
                            <button
                              type="button"
                              title="Fraud check"
                              aria-label={`Fraud check for order ${o.number}`}
                              onPointerEnter={() => prefetchFraud(o.id)}
                              onFocus={() => prefetchFraud(o.id)}
                              onClick={() => openFraud(o)}
                              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm transition hover:bg-emerald-700 hover:text-white"
                            >
                              <ShieldCheck className="h-4 w-4" />
                            </button>
                          )}
                          <Link
                            href={href}
                            aria-label={`Open order ${o.number}`}
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-neutral-600 shadow-sm transition hover:bg-emerald-700 hover:text-white"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <FraudPopupHost enabled={fraudEnabled} />

      {shipIds && (
        <ShipCourierModal
          subtitle={shipSubtitle}
          count={shipIds.length}
          couriers={couriers.data ?? []}
          loading={couriers.isLoading}
          selectedId={selectedCourierId}
          onSelect={setSelectedCourierId}
          pending={anyBusy}
          error={shipError}
          couriersHref={`/seller/${slug}/couriers`}
          onSubmit={submitShip}
          onClose={() => {
            if (!anyBusy) setShipIds(null);
          }}
        />
      )}
    </div>
  );
}
