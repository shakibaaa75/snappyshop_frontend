"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Banknote,
  Check,
  CreditCard,
  Download,
  Loader2,
  Package,
  Smartphone,
  Truck,
} from "lucide-react";
import { ApiError } from "@/lib/api/http";
import { fetchPublicStore } from "@/lib/store-design/api";
import {
  formatPrice,
  loadFont,
  readableOn,
  themeVars,
} from "@/lib/store-design/utilts";
import {
  ReceiptPrinter,
  type ReceiptPrinterStage,
} from "@/components/store-design/ReceiptPrinter";
import { receiptTheme } from "@/components/store-design/CartReceipt";
import { downloadReceipt } from "@/lib/receipt-image";
import { deliveryRow, discountRow } from "@/lib/delivery/breakdown";
import { ProductArt } from "@/components/store-design/productArt";
import type { Product, StoreDesign } from "@/lib/store-design/types";
import type { CartLine } from "@/lib/store-design/cart";

interface OrderSnapshot {
  id: string;
  number?: string;
  slug: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  area: string;
  notes: string;
  payment: "bkash" | "nagad" | "rocket" | "cod" | "card";
  delivery: number;
  /** Saved by checkout from the server's order. Missing on older snapshots. */
  discount?: number;
  deliveryZone?: string;
  deliveryBase?: number;
  deliveryWaived?: boolean;
  subtotal: number;
  total: number;
  lines: CartLine[];
  createdAt: string;
}

const METHOD_LABEL: Record<OrderSnapshot["payment"], string> = {
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
  cod: "Cash on delivery",
  card: "Card",
};

const MAX_LINES = 8;

const stageText: Record<ReceiptPrinterStage, string> = {
  processing: "Placing your order",
  printing: "Printing your receipt",
  complete: "Order confirmed",
};

export default function OrderClient() {
  const { slug, orderId } = useParams<{ slug: string; orderId: string }>();
  const [order, setOrder] = useState<OrderSnapshot | null>(null);

  const { data } = useQuery({
    queryKey: ["public-store", slug],
    queryFn: () => fetchPublicStore(slug),
    retry: (count, err) =>
      err instanceof ApiError && err.status === 404 ? false : count < 2,
    staleTime: 30_000,
  });

  const design = data?.design as StoreDesign | undefined;

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(`shopbd-last-order:${slug}`);
      if (raw) setOrder(JSON.parse(raw) as OrderSnapshot);
    } catch {
      /* ignore */
    }
  }, [slug]);

  if (!design) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  loadFont(design.fontFamily);
  const accent = design.productAccentColor || "var(--s-text)";
  const accentOn = accent.startsWith("#") ? readableOn(accent) : "var(--s-bg)";
  const storeHref = `/store/${slug}`;

  // Only use the saved order if it is the one in the URL.
  const ownOrder = order && order.id === orderId ? order : null;
  const orderLabel = ownOrder?.number || orderId;

  return (
    <div
      style={themeVars(design)}
      className="storefront text-[15px] leading-normal"
    >
      <div
        className="min-h-screen"
        style={{ background: "var(--s-bg)", color: "var(--s-text)" }}
      >
        <main className="mx-auto w-full max-w-[720px] px-[var(--sf-gutter)] py-10 pb-32 sm:py-14">
          <div className="sf-fade-in">
            <ThankYouReceipt
              // remount (restart the animation) if the saved order arrives later
              key={ownOrder ? "order" : "no-order"}
              order={ownOrder}
              orderLabel={orderLabel}
              storeName={design.storeName}
              storeHref={storeHref}
              base={design.productAccentColor || undefined}
            />
          </div>

          <p
            className="mt-6 text-center text-xs"
            style={{ color: "var(--s-muted)" }}
          >
            Need help? Contact {design.storeName} at{" "}
            {design.supportPhone || design.supportEmail || "the store"}.
          </p>
        </main>

        <div
          className="fixed inset-x-0 bottom-0 z-40 px-4 pt-6"
          style={{
            paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
            backgroundImage:
              "linear-gradient(to top, var(--s-bg) 55%, transparent)",
          }}
        >
          <div className="mx-auto max-w-[720px]">
            <Link
              href={storeHref}
              className="sf-press flex h-14 w-full items-center justify-center rounded-full text-base font-semibold shadow-lg"
              style={{ background: accent, color: accentOn }}
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThankYouReceipt({
  order,
  orderLabel,
  storeName,
  storeHref,
  base,
}: {
  order: OrderSnapshot | null;
  orderLabel: string;
  storeName: string;
  storeHref: string;
  base?: string;
}) {
  // With a saved order: print once when the page opens.
  // Without one (other device / new session): show the finished state, no paper.
  const [stage, setStage] = useState<ReceiptPrinterStage>(
    order ? "processing" : "complete",
  );

  useEffect(() => {
    if (!order) return;
    const a = setTimeout(() => setStage("printing"), 500);
    const b = setTimeout(() => setStage("complete"), 2500);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [order]);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  // Only shown inside the `order &&` block below; the fallback keeps them non-null.
  const dRow = deliveryRow(order ?? { delivery: 0 }, formatPrice);
  const dsRow = order ? discountRow(order, formatPrice) : null;

  const handleDownload = async () => {
    if (!order || saving) return;
    setSaving(true);
    setSaveError(false);
    try {
      await downloadReceipt({
        storeName,
        orderLabel,
        createdAt: order.createdAt,
        name: order.name,
        phone: order.phone,
        address: order.address,
        city: order.city,
        area: order.area,
        payment: METHOD_LABEL[order.payment],
        subtotal: order.subtotal,
        delivery: order.delivery,
        discount: order.discount,
        deliveryZone: order.deliveryZone,
        deliveryBase: order.deliveryBase,
        deliveryWaived: order.deliveryWaived,
        total: order.total,
        lines: order.lines.map((l) => ({
          name: l.name,
          variantLabel: l.variantLabel,
          qty: l.qty,
          price: l.price,
          emoji: l.emoji,
          imageUrl: l.imageUrl,
        })),
      });
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  const firstName = order?.name ? order.name.split(" ")[0] : "";
  const shown = order ? order.lines.slice(0, MAX_LINES) : [];
  const hidden = order ? order.lines.length - shown.length : 0;

  return (
    <div style={receiptTheme(base)}>
      <ReceiptPrinter.Root
        stage={stage}
        animate={!!order}
        aria-label="Order confirmation"
        className="max-w-none"
      >
        <ReceiptPrinter.Machine>
          <ReceiptPrinter.Header>
            <span className="flex size-8 items-center justify-center rounded-full bg-grayscale-1/15 text-grayscale-1">
              <Package className="size-4" />
            </span>
            <Link
              href={storeHref}
              className="rounded-full bg-grayscale-1/15 px-3 py-1.5 text-xs font-medium text-grayscale-1 transition active:scale-95"
            >
              Continue shopping
            </Link>
          </ReceiptPrinter.Header>

          <ReceiptPrinter.Screen className="p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-9 text-white">
                <Check className="size-5" strokeWidth={3} />
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-lg font-bold leading-tight tracking-tight">
                  Thank you{firstName ? `, ${firstName}` : ""}!
                </h1>
                <p className="truncate text-xs opacity-70">
                  Your order has been placed.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-grayscale-1/15 px-3 py-1.5 text-xs">
                <strong>{orderLabel}</strong>
              </span>
            </div>

            <div className="mt-3">
              <ReceiptPrinter.Status>{stageText[stage]}</ReceiptPrinter.Status>
            </div>
          </ReceiptPrinter.Screen>
        </ReceiptPrinter.Machine>

        {order && (
          <ReceiptPrinter.Output className="h-auto w-[calc(100%-2rem)] px-0">
            <ReceiptPrinter.Paper className="min-h-0 px-5 pt-5 pb-7 text-xs">
              <h2 className="text-center text-sm font-bold uppercase tracking-widest">
                Order receipt
              </h2>
              <p className="mt-1 text-center opacity-60">#{orderLabel}</p>
              <hr className="my-2 border-dashed border-grayscale-12/30" />

              <ul className="space-y-1.5">
                {shown.map((l) => (
                  <li
                    key={`${l.productId}:${l.variantId ?? ""}`}
                    className="flex items-center gap-3 py-1"
                  >
                    <span className="block h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-grayscale-12/15">
                      <ProductArt
                        width={120}
                        emojiClassName="text-lg"
                        product={
                          {
                            id: l.productId,
                            name: l.name,
                            categoryId: "",
                            price: l.price,
                            emoji: l.emoji,
                            hue: l.hue,
                            rating: 0,
                            reviews: 0,
                            sold: 0,
                            stock: 99,
                            createdAt: "",
                            imageUrl: l.imageUrl,
                          } as Product
                        }
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 block font-semibold">
                        {l.name}
                      </span>
                      {l.variantLabel && (
                        <span className="block opacity-60">
                          {l.variantLabel}
                        </span>
                      )}
                      <span className="block opacity-60">
                        Qty {l.qty} × {formatPrice(l.price)}
                      </span>
                    </span>
                    <span className="shrink-0 font-semibold">
                      {formatPrice(l.price * l.qty)}
                    </span>
                  </li>
                ))}
                {hidden > 0 && (
                  <li className="opacity-60">
                    + {hidden} more {hidden === 1 ? "item" : "items"}
                  </li>
                )}
              </ul>

              <hr className="my-2 border-dashed border-grayscale-12/30" />
              <dl className="space-y-0.5">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd>{formatPrice(order.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>{dRow.label}</dt>
                  <dd>
                    {dRow.was && (
                      <s className="mr-1.5 opacity-60">{dRow.was}</s>
                    )}
                    {dRow.value}
                  </dd>
                </div>
                {dsRow && (
                  <div className="flex justify-between">
                    <dt>{dsRow.label}</dt>
                    <dd>{dsRow.value}</dd>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold">
                  <dt>Total</dt>
                  <dd>{formatPrice(order.total)}</dd>
                </div>
                <div className="flex justify-between opacity-70">
                  <dt>Payment</dt>
                  <dd>{METHOD_LABEL[order.payment]}</dd>
                </div>
              </dl>

              <hr className="my-2 border-dashed border-grayscale-12/30" />
              <h3 className="mb-3 text-center text-[11px] font-bold uppercase tracking-widest">
                What happens next
              </h3>
              <ol className="space-y-2.5">
                <Step
                  Icon={
                    order.payment === "cod"
                      ? Banknote
                      : order.payment === "card"
                        ? CreditCard
                        : Smartphone
                  }
                  title={
                    order.payment === "cod"
                      ? "Prepare cash for delivery"
                      : order.payment === "card"
                        ? "Card payment"
                        : `Confirm your ${METHOD_LABEL[order.payment]} payment`
                  }
                  text={
                    order.payment === "cod"
                      ? "Have the total ready when the courier arrives."
                      : order.payment === "card"
                        ? "You'll receive a payment link shortly."
                        : `We sent a payment request to ${order.phone}. Approve it with your PIN.`
                  }
                />
                <Step
                  Icon={Package}
                  title="Seller confirms the order"
                  text="The seller will review and pack your items."
                />
                <Step
                  Icon={Truck}
                  title="Delivery"
                  text={`Sent to ${order.address}, ${order.city}.`}
                />
              </ol>

              <button
                type="button"
                onClick={handleDownload}
                disabled={saving}
                className="sf-press mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-grayscale-12 text-sm font-semibold text-grayscale-1 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                {saving ? "Preparing…" : "Download receipt"}
              </button>
              {saveError && (
                <p role="alert" className="mt-2 text-center text-red-600">
                  Could not save the receipt. Please try again.
                </p>
              )}

              <p className="mt-3 text-center opacity-60">
                Thank you for your order!
              </p>
            </ReceiptPrinter.Paper>
          </ReceiptPrinter.Output>
        )}
      </ReceiptPrinter.Root>
    </div>
  );
}

function Step({
  Icon,
  title,
  text,
}: {
  Icon: typeof Package;
  title: string;
  text: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-grayscale-12 text-grayscale-1">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-bold">{title}</span>
        <span className="block leading-relaxed opacity-70">{text}</span>
      </span>
    </li>
  );
}
