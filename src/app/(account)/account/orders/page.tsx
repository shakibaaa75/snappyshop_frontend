"use client";

import {
  deliveryRow,
  deliveryRowText,
  discountRow,
} from "@/lib/delivery/breakdown";
import { use, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Flag,
  Loader2,
  MapPin,
  Truck,
} from "lucide-react";
import { useBuyerOrder, useWithdrawIssue } from "@/lib/query/buyerOrders";
import type { BuyerIssue } from "@/lib/api/buyerOrders";
import { ApiError } from "@/lib/api/http";
import { formatPrice } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ISSUE_STATUS_LABEL,
  ISSUE_STATUS_STYLE,
  ISSUE_TYPE_LABEL,
  OrderStatusBadge,
  OrderThumb,
  formatDate,
  formatDateTime,
} from "@/components/account/orders/OrderBits";
import { OrderTimeline } from "@/components/account/orders/OrderTimeline";
import { ReportIssueSheet } from "@/components/account/orders/ReportIssueSheet";
import { cn } from "@/lib/utils";

const PAYMENT_LABEL: Record<string, string> = {
  cod: "Cash on delivery",
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
  card: "Card",
};

export default function BuyerOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [reportOpen, setReportOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const { data: o, isLoading, isError, error, refetch } = useBuyerOrder(id);

  const back = (
    <Link
      href="/account/orders"
      className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium shadow-sm transition hover:shadow-md"
    >
      <ArrowLeft className="h-4 w-4" />
      All orders
    </Link>
  );

  if (isLoading) {
    return (
      <div>
        {back}
        <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
          <Skeleton className="h-96 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (isError || !o) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div>
        {back}
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-white p-10 text-center shadow-sm">
          <AlertCircle className="h-8 w-8 text-neutral-400" />
          <h1 className="text-base font-semibold">
            {notFound
              ? "We couldn't find this order"
              : "Couldn't load this order"}
          </h1>
          <p className="max-w-sm text-sm text-neutral-500">
            {notFound
              ? "It may belong to a different email address."
              : "Please check your connection and try again."}
          </p>
          {!notFound && (
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {back}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Order #{o.number}</h1>
          <p className="text-sm text-neutral-500">
            {o.seller.name} · placed {formatDate(o.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {o.reportTypes.length > 0 && (
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium shadow-sm transition hover:shadow-md"
            >
              <Flag className="h-4 w-4" />
              Problem with this order
            </button>
          )}
          <OrderStatusBadge status={o.status} />
        </div>
      </div>

      {reported && (
        <p
          role="status"
          className="mb-4 flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Your report was sent. The seller has been notified, and you can follow
          its status under Problem reports below.
        </p>
      )}

      <ReportIssueSheet
        orderId={o.id}
        orderNumber={o.number}
        types={o.reportTypes}
        open={reportOpen}
        onOpenChange={setReportOpen}
        onReported={() => setReported(true)}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_380px] lg:items-start">
        {/* Left: tracking */}
        <div className="space-y-4">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-base font-semibold">Tracking</h2>
            <OrderTimeline steps={o.timeline} />
          </section>

          {o.tracking && (
            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
                <Truck className="h-4 w-4" /> Courier
              </h2>
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
                <dt className="text-neutral-500">Courier</dt>
                <dd className="font-medium capitalize">{o.tracking.courier}</dd>
                {o.tracking.code && (
                  <>
                    <dt className="text-neutral-500">Tracking code</dt>
                    <dd className="break-all font-mono font-medium">
                      {o.tracking.code}
                    </dd>
                  </>
                )}
              </dl>
              {o.tracking.url && (
                <a
                  href={o.tracking.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white"
                >
                  Track parcel <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </section>
          )}

          {o.issues.length > 0 && (
            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold">Problem reports</h2>
              <ul className="space-y-3">
                {o.issues.map((i) => (
                  <IssueItem key={i.id} issue={i} />
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Right: items, payment, address */}
        <div className="space-y-4 lg:sticky lg:top-24">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold">
              Items ({o.itemCount})
            </h2>
            <ul className="space-y-4">
              {o.lines.map((l, i) => (
                <li key={i} className="flex gap-3">
                  <OrderThumb line={l} className="h-16 w-16" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium">{l.name}</p>
                    {l.variant && (
                      <p className="text-xs text-neutral-500">{l.variant}</p>
                    )}
                    <p className="text-xs text-neutral-500">
                      {formatPrice(l.price)} × {l.qty}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">
                    {formatPrice(l.subtotal)}
                  </p>
                </li>
              ))}
            </ul>

            <dl className="mt-5 space-y-1.5 border-t pt-4 text-sm">
              <Row label="Subtotal" value={formatPrice(o.subtotal)} />
              <Row
                label={deliveryRow(o, formatPrice).label}
                value={deliveryRowText(deliveryRow(o, formatPrice))}
              />
              {discountRow(o, formatPrice) && (
                <Row
                  label="Discount"
                  value={discountRow(o, formatPrice)!.value}
                />
              )}
              <Row label="Total" value={formatPrice(o.total)} bold />
              <Row
                label="Payment"
                value={`${PAYMENT_LABEL[o.paymentMethod] ?? o.paymentMethod}${o.paid ? " · Paid" : ""}`}
              />
            </dl>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
              <MapPin className="h-4 w-4" /> Delivery address
            </h2>
            <p className="text-sm font-medium">{o.customerName}</p>
            <p className="text-sm text-neutral-600">{o.phone}</p>
            <p className="mt-1 text-sm text-neutral-600">
              {[o.address, o.area, o.city].filter(Boolean).join(", ")}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex justify-between gap-4",
        bold && "text-base font-bold",
      )}
    >
      <dt className={bold ? "" : "text-neutral-500"}>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function IssueItem({ issue: i }: { issue: BuyerIssue }) {
  const withdraw = useWithdrawIssue();
  const [confirming, setConfirming] = useState(false);

  return (
    <li className="rounded-2xl bg-neutral-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold">{ISSUE_TYPE_LABEL[i.type]}</p>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
            ISSUE_STATUS_STYLE[i.status],
          )}
        >
          {ISSUE_STATUS_LABEL[i.status]}
        </span>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-600">
        {i.message}
      </p>
      <p className="mt-2 text-xs text-neutral-400">
        Reported {formatDateTime(i.createdAt)}
        {i.closedAt && ` · Closed ${formatDateTime(i.closedAt)}`}
      </p>

      {i.status === "open" && (
        <div className="mt-3">
          {!confirming ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="text-xs font-medium text-neutral-500 underline underline-offset-2 hover:text-neutral-900"
            >
              Withdraw report
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-neutral-600">Withdraw this report?</span>
              <button
                type="button"
                disabled={withdraw.isPending}
                onClick={() =>
                  withdraw.mutate(i.id, {
                    onSettled: () => setConfirming(false),
                  })
                }
                className="inline-flex items-center gap-1 rounded-full bg-neutral-900 px-3 py-1.5 font-medium text-white disabled:opacity-60"
              >
                {withdraw.isPending && (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
                Yes, withdraw
              </button>
              <button
                type="button"
                disabled={withdraw.isPending}
                onClick={() => setConfirming(false)}
                className="rounded-full bg-white px-3 py-1.5 font-medium shadow-sm"
              >
                Keep it
              </button>
            </div>
          )}
          {withdraw.isError && (
            <p role="alert" className="mt-2 text-xs text-red-600">
              Couldn&apos;t withdraw the report. Please try again.
            </p>
          )}
        </div>
      )}
    </li>
  );
}
