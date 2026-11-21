"use client";

import { deliveryRow, discountRow } from "@/lib/delivery/breakdown";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Mail,
  PackageCheck,
  Truck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/http";
import {
  sellerOrders,
  type OrderStatus,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_COLOR,
  PAYMENT_LABEL,
  formatBDT,
  isVerifiedSale,
} from "@/lib/api/orders";
import { sellerCouriers } from "@/lib/api/couriers";
import { ShipCourierModal } from "@/components/seller/ship-courier-modal";
import {
  SHIPMENTS_KEY,
  sellerShipping,
  type Shipment,
} from "@/lib/api/shipping";
import { qk } from "@/lib/query/keys";
import { FraudCheckPanel } from "@/components/seller/fraud-check-panel";

const COURIER_PREF_KEY = "shopbd.preferredCourierConnection";

/** The one button that moves an order forward from each status.
 *  "confirmed -> shipped" is handled by the courier panel below; the manual
 *  button only appears when no courier can be used. */
const NEXT_STEP: Partial<
  Record<OrderStatus, { next: OrderStatus; label: string }>
> = {
  pending: { next: "confirmed", label: "Confirm order" },
  confirmed: { next: "shipped", label: "Mark shipped manually" },
  shipped: { next: "delivered", label: "Mark delivered" },
};

/** Statuses that trigger an email to the customer (done by the backend). */
const EMAIL_STATUSES: OrderStatus[] = ["confirmed", "shipped", "delivered"];

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : fallback;
}

function StepIcon({ next }: { next: OrderStatus }) {
  const cls = "mr-2 h-4 w-4";
  if (next === "shipped") return <Truck className={cls} />;
  if (next === "delivered") return <PackageCheck className={cls} />;
  return <CheckCircle2 className={cls} />;
}

export default function SellerOrderDetailPage() {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const queryClient = useQueryClient();

  // Treat "", "undefined", and "null" as an invalid id so a stale or broken
  // link never fires GET /seller/orders/undefined.
  const validId =
    !!id && id !== "undefined" && id !== "null" && id.trim() !== "";

  const detailKey = ["seller-order-detail", id];

  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [shipNotice, setShipNotice] = useState<string | null>(null);
  const [preferredId, setPreferredId] = useState<string | null>(null);
  const [shipOpen, setShipOpen] = useState(false);
  const [shipError, setShipError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    queryKey: detailKey,
    queryFn: () => sellerOrders.get(id),
    enabled: validId,
  });

  const couriers = useQuery({
    queryKey: qk.seller.couriers.list(),
    queryFn: sellerCouriers.list,
    // Always re-check when this page opens: a courier can flip to
    // "needs reconnection" at any time.
    staleTime: 0,
    refetchOnMount: "always",
    enabled: validId,
  });

  const shipments = useQuery({
    queryKey: SHIPMENTS_KEY,
    queryFn: sellerShipping.list,
    staleTime: 15_000,
    enabled: validId,
  });

  // Only working connections can ship.
  const usable = useMemo(
    () => (couriers.data ?? []).filter((c) => c.status === "connected"),
    [couriers.data],
  );

  // Same remembered choice as the orders list.
  useEffect(() => {
    try {
      setPreferredId(localStorage.getItem(COURIER_PREF_KEY));
    } catch {
      /* storage unavailable */
    }
  }, []);

  const activeCourier =
    usable.find((c) => c.id === preferredId) ?? usable[0] ?? null;

  function chooseCourier(courierId: string) {
    setPreferredId(courierId);
    try {
      localStorage.setItem(COURIER_PREF_KEY, courierId);
    } catch {
      /* storage unavailable */
    }
  }

  const shipment: Shipment | undefined = shipments.data?.find(
    (s) => s.orderId === id,
  );

  const shipMutation = useMutation({
    mutationFn: (connectionId: string) => sellerShipping.ship(id, connectionId),
    onSuccess: async (created) => {
      setActionError(null);
      setShipError(null);
      setShipOpen(false);
      setShipNotice(
        created.warning ??
          `Shipped with ${created.providerName}. Tracking: ${created.trackingCode}`,
      );
      queryClient.setQueryData<Shipment[]>(SHIPMENTS_KEY, (old) => [
        created,
        ...(old ?? []).filter((s) => s.orderId !== created.orderId),
      ]);
      // Refresh the order (now "shipped"), the list and the dashboard numbers.
      await queryClient.invalidateQueries();
    },
    onError: (err) => {
      setShipNotice(null);
      setShipError(errorMessage(err, "Could not create the shipment."));
      // A rejected key flips the courier's status; refresh the list.
      queryClient.invalidateQueries({ queryKey: qk.seller.couriers.list() });
      // The order may have changed elsewhere; make sure the page is accurate.
      queryClient.invalidateQueries({ queryKey: detailKey });
      queryClient.invalidateQueries({ queryKey: SHIPMENTS_KEY });
    },
  });

  /** Open the "choose a courier" step. */
  function openShip() {
    setShipError(null);
    setShipNotice(null);
    setSelectedId((activeCourier ?? usable[0])?.id ?? null);
    setShipOpen(true);
  }

  /** The modal is the confirmation: picking a courier and pressing Ship books it. */
  function submitShip() {
    const chosen = usable.find((c) => c.id === selectedId);
    if (!chosen || shipMutation.isPending) return;
    chooseCourier(chosen.id);
    setShipError(null);
    shipMutation.mutate(chosen.id);
  }

  async function changeStatus(next: OrderStatus) {
    if (!validId) return;
    setBusy(true);
    setActionError(null);
    try {
      const updated = await sellerOrders.updateStatus(id, next);
      queryClient.setQueryData(detailKey, updated);
      await queryClient.invalidateQueries();
      // Confirmed -> ask which courier to ship with, right away.
      if (next === "confirmed") openShip();
    } catch (err) {
      setActionError(errorMessage(err, "Could not update the order."));
    } finally {
      setBusy(false);
    }
  }

  async function togglePaid(paid: boolean) {
    if (!validId) return;
    setBusy(true);
    setActionError(null);
    try {
      const updated = await sellerOrders.markPaid(id, paid);
      queryClient.setQueryData(detailKey, updated);
      await queryClient.invalidateQueries();
    } catch (err) {
      setActionError(errorMessage(err, "Could not update payment."));
    } finally {
      setBusy(false);
    }
  }

  const backHref = `/seller/${slug}/orders`;

  // Broken link: do not call the API at all.
  if (!validId) {
    return (
      <div className="space-y-4">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to orders
        </Link>
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          This order link is invalid. Open the order from the orders list.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading order…
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to orders
        </Link>
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {errorMessage(error, "Could not load this order.")}
        </div>
      </div>
    );
  }

  const statusColor = ORDER_STATUS_COLOR[order.status];
  const canCancel =
    order.status === "pending" ||
    order.status === "confirmed" ||
    order.status === "shipped";
  const verified = isVerifiedSale(order);
  const dRow = deliveryRow(order, formatBDT);
  const dsRow = discountRow(order, formatBDT);
  const address = [
    order.shippingAddress,
    order.shippingArea,
    order.shippingCity,
  ]
    .filter(Boolean)
    .join(", ");

  // A confirmed order with no parcel yet can be shipped with a courier.
  const showShipPanel = order.status === "confirmed" && !shipment;
  const step = NEXT_STEP[order.status];
  const showStepButton = !!step;
  const showActions = showStepButton || canCancel || showShipPanel;

  return (
    <div className="space-y-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Order {order.number}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Placed {formatDateTime(order.createdAt)}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
            statusColor.bg,
            statusColor.text,
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", statusColor.dot)} />
          {ORDER_STATUS_LABEL[order.status]}
        </span>
      </header>

      {shipNotice && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="min-w-0">{shipNotice}</span>
        </div>
      )}

      {/* Parcel booked with a courier */}
      {shipment && (
        <section className="rounded-2xl border bg-card p-5 text-sm">
          <h2 className="mb-3 text-sm font-semibold">Courier shipment</h2>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium">{shipment.providerName}</p>
              <p className="text-xs text-muted-foreground">
                Booked {formatDateTime(shipment.createdAt)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Tracking code</p>
              {shipment.trackingUrl ? (
                <a
                  href={shipment.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  {shipment.trackingCode}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <p className="font-medium">{shipment.trackingCode}</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Actions */}
      {showActions && (
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="text-sm font-semibold">Update this order</h2>

          {showShipPanel && (
            <div className="mt-4 rounded-2xl bg-emerald-50 p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-emerald-900">
                <Truck className="h-4 w-4" /> Ready to ship
              </p>
              <p className="mt-1 text-xs text-emerald-800/80">
                Choose one of your connected couriers. We send the
                customer&apos;s name, phone and address
                {order.paymentMethod === "cod" && !order.paid
                  ? ` and the cash to collect (${formatBDT(order.total)})`
                  : ""}{" "}
                to the courier and save the tracking code on this order.
              </p>
              <Button
                className="mt-3 h-10"
                disabled={busy || shipMutation.isPending}
                onClick={openShip}
              >
                <Truck className="mr-2 h-4 w-4" />
                Ship with courier
              </Button>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {showStepButton && step && (
              <Button
                className="h-10"
                variant={order.status === "confirmed" ? "outline" : "default"}
                disabled={busy || shipMutation.isPending}
                onClick={() => changeStatus(step.next)}
              >
                {busy ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <StepIcon next={step.next} />
                )}
                {step.label}
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outline"
                className="h-10 text-destructive"
                disabled={busy || shipMutation.isPending}
                onClick={() => {
                  if (window.confirm("Cancel this order?")) {
                    changeStatus("cancelled");
                  }
                }}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel order
              </Button>
            )}
          </div>

          {step && (
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              {EMAIL_STATUSES.includes(step.next) && order.customerEmail
                ? `The customer will be emailed at ${order.customerEmail}.`
                : "No email will be sent: the customer did not give an email address."}
            </p>
          )}

          {actionError && (
            <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {actionError}
            </div>
          )}
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Items + totals */}
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="text-sm font-semibold">Items</h2>
          <ul className="mt-3 divide-y">
            {order.lines.map((l, i) => (
              <li
                key={`${l.productId}-${l.variantId ?? ""}-${i}`}
                className="flex items-center justify-between gap-3 py-3 text-sm"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{l.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {l.variant ? `${l.variant} · ` : ""}
                    {formatBDT(l.price)} × {l.qty}
                  </span>
                </span>
                <span className="shrink-0 font-medium">
                  {formatBDT(l.subtotal)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-1 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatBDT(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{dRow.label}</dt>
              <dd>
                {dRow.was && (
                  <s className="mr-1.5 text-muted-foreground">{dRow.was}</s>
                )}
                {dRow.value}
              </dd>
            </div>
            {dsRow && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{dsRow.label}</dt>
                <dd>{dsRow.value}</dd>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatBDT(order.total)}</dd>
            </div>
          </dl>
        </section>

        <div className="space-y-6">
          {/* Customer */}
          <section className="rounded-2xl border bg-card p-5 text-sm">
            <h2 className="mb-3 text-sm font-semibold">Customer</h2>
            <p className="font-medium">{order.customerName}</p>
            <p className="text-muted-foreground">{order.customerPhone}</p>
            {order.customerEmail && (
              <p className="text-muted-foreground">{order.customerEmail}</p>
            )}
            <p className="mt-3 text-muted-foreground">{address}</p>
            {order.notes && (
              <p className="mt-3 text-muted-foreground">Note: {order.notes}</p>
            )}
            <FraudCheckPanel orderId={order.id} />
          </section>

          {/* Payment */}
          <section className="rounded-2xl border bg-card p-5 text-sm">
            <h2 className="mb-3 text-sm font-semibold">Payment</h2>
            <div className="flex items-center justify-between gap-3">
              <Badge
                variant={
                  order.paymentMethod === "cod" ? "outline" : "secondary"
                }
                className="text-[11px]"
              >
                {PAYMENT_LABEL[order.paymentMethod]}
              </Badge>
              <span
                className={cn(
                  "text-xs font-medium",
                  order.paid ? "text-emerald-600" : "text-muted-foreground",
                )}
              >
                {order.paid ? "Paid" : "Not paid yet"}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 h-9"
              disabled={busy}
              onClick={() => togglePaid(!order.paid)}
            >
              {order.paid ? "Mark as unpaid" : "Mark as paid"}
            </Button>
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className={cn(
                  "inline-block h-2.5 w-2.5 rounded-full",
                  verified ? "bg-emerald-500" : "bg-muted-foreground/30",
                )}
              />
              Verified sale: {verified ? "Yes" : "No"}
            </p>
          </section>

          {/* Timeline */}
          <section className="rounded-2xl border bg-card p-5 text-sm">
            <h2 className="mb-3 text-sm font-semibold">History</h2>
            <ol className="space-y-3">
              {order.events.map((e, i) => (
                <li key={`${e.status}-${e.at}-${i}`} className="flex gap-3">
                  <span
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      ORDER_STATUS_COLOR[e.status].dot,
                    )}
                  />
                  <span>
                    <span className="block font-medium">
                      {ORDER_STATUS_LABEL[e.status]}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {formatDateTime(e.at)}
                      {e.note ? ` · ${e.note}` : ""}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>

      {shipOpen && (
        <ShipCourierModal
          subtitle={`Order ${order.number}${
            order.paymentMethod === "cod" && !order.paid
              ? ` · Collect ${formatBDT(order.total)} on delivery`
              : ""
          }`}
          count={1}
          couriers={couriers.data ?? []}
          loading={couriers.isLoading}
          selectedId={selectedId}
          onSelect={setSelectedId}
          pending={shipMutation.isPending}
          error={shipError}
          couriersHref={`/seller/${slug}/couriers`}
          onSubmit={submitShip}
          onClose={() => {
            if (!shipMutation.isPending) setShipOpen(false);
          }}
        />
      )}
    </div>
  );
}
