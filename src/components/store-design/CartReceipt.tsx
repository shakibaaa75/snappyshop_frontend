"use client";

import { deliveryRow, discountRow } from "@/lib/delivery/breakdown";
import { type CSSProperties, useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import {
  ReceiptPrinter,
  type ReceiptPrinterStage,
} from "@/components/store-design/ReceiptPrinter";
import { formatPrice } from "@/lib/store-design/utilts";

/** Share of `base` mixed into the store background for grayscale-1..12. */
const STEPS = [0, 3, 6, 10, 15, 22, 32, 45, 58, 68, 78, 100];

/** Re-maps the printer's grayscale to the store theme. */
export function receiptTheme(
  base = "var(--s-text)",
  check = "var(--s-primary)",
): CSSProperties {
  const vars: Record<string, string> = {};
  STEPS.forEach((pct, i) => {
    vars[`--color-grayscale-${i + 1}`] =
      pct === 0
        ? "var(--s-bg)"
        : pct === 100
          ? base
          : `color-mix(in oklab, ${base} ${pct}%, var(--s-bg))`;
  });
  vars["--color-green-9"] = check;
  return vars as CSSProperties;
}

type Line = { productId: string; name: string; price: number; qty: number; variantId?: string };

const MAX_LINES = 6;

export type CartReceiptLabels = {
  processing: string;
  printing: string;
  complete: string;
  /** Title printed at the top of the paper. */
  heading: string;
  /** Text of the button in the machine header. */
  action: string;
  /** Line at the bottom of the paper. */
  footer: string;
};

const defaultLabels: CartReceiptLabels = {
  processing: "Counting your items",
  printing: "Printing your receipt",
  complete: "Ready to checkout",
  heading: "Receipt",
  action: "Keep shopping",
  footer: "Thanks for shopping with us.",
};

export function CartReceipt({
  lines,
  count,
  subtotal,
  delivery,
  discount,
  deliveryZone,
  deliveryBase,
  deliveryWaived,
  total,
  storeHref,
  base,
  check,
  labels,
  reference,
  actionHref,
}: {
  lines: Line[];
  count: number;
  subtotal: number;
  delivery: number;
  /** Optional order breakdown; leave out for a plain "Delivery" row. */
  discount?: number;
  deliveryZone?: string;
  deliveryBase?: number;
  deliveryWaived?: boolean;
  total: number;
  storeHref: string;
  /** Machine colour. Default: the store text colour. Try the accent colour. */
  base?: string;
  /** Colour of the "complete" tick. Default: the store primary colour. */
  check?: string;
  /** Override any of the texts, e.g. for the thank-you page. */
  labels?: Partial<CartReceiptLabels>;
  /** Optional order number shown under the title, e.g. "#1042". */
  reference?: string;
  /** Where the header button goes. Default: storeHref. */
  actionHref?: string;
}) {
  const t = { ...defaultLabels, ...labels };
  const [stage, setStage] = useState<ReceiptPrinterStage>("processing");

  // Print once when the page opens. Quantity changes just update the paper.
  useEffect(() => {
    const a = setTimeout(() => setStage("printing"), 500);
    const b = setTimeout(() => setStage("complete"), 2500);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, []);

  const stageText: Record<ReceiptPrinterStage, string> = {
    processing: t.processing,
    printing: t.printing,
    complete: t.complete,
  };

  const shown = lines.slice(0, MAX_LINES);
  const hidden = lines.length - shown.length;

  return (
    <div style={receiptTheme(base, check)}>
      <ReceiptPrinter.Root stage={stage} aria-label="Order receipt">
        <ReceiptPrinter.Machine>
          <ReceiptPrinter.Header>
            <span className="flex size-8 items-center justify-center rounded-full bg-grayscale-1/15 text-grayscale-1">
              <ShoppingBag className="size-4" />
            </span>
            <Link
              href={actionHref ?? storeHref}
              className="rounded-full bg-grayscale-1/15 px-3 py-1.5 text-xs font-medium text-grayscale-1 transition active:scale-95"
            >
              {t.action}
            </Link>
          </ReceiptPrinter.Header>

          <ReceiptPrinter.Screen>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>
                  {count} {count === 1 ? "item" : "items"}
                </span>
                <strong>{formatPrice(total)}</strong>
              </div>
              <ReceiptPrinter.Status>{stageText[stage]}</ReceiptPrinter.Status>
            </div>
          </ReceiptPrinter.Screen>
        </ReceiptPrinter.Machine>

        {/* h-auto: the paper is as tall as the cart, not a fixed 32rem */}
        <ReceiptPrinter.Output className="h-auto">
          <ReceiptPrinter.Paper className="text-xs">
            <h2 className="text-center text-sm font-bold uppercase tracking-widest">
              {t.heading}
            </h2>
            {reference && (
              <p className="mt-1 text-center opacity-60">{reference}</p>
            )}
            <hr className="my-3 border-dashed border-grayscale-12/30" />

            <ul className="space-y-1.5">
              {shown.map((l) => (
                <li
                  key={`${l.productId}:${l.variantId ?? ""}`}
                  className="flex justify-between gap-3"
                >
                  <span className="min-w-0 truncate">
                    {l.qty} × {l.name}
                  </span>
                  <span className="shrink-0">
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

            <hr className="my-3 border-dashed border-grayscale-12/30" />
            <dl className="space-y-1">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
              {(() => {
                const o = { delivery, discount, deliveryZone, deliveryBase, deliveryWaived };
                const d = deliveryRow(o, formatPrice);
                const ds = discountRow(o, formatPrice);
                return (
                  <>
                    <div className="flex justify-between">
                      <dt>{d.label}</dt>
                      <dd>
                        {d.was && <s className="mr-1.5 opacity-60">{d.was}</s>}
                        {d.value}
                      </dd>
                    </div>
                    {ds && (
                      <div className="flex justify-between">
                        <dt>{ds.label}</dt>
                        <dd>{ds.value}</dd>
                      </div>
                    )}
                  </>
                );
              })()}
              <div className="flex justify-between pt-1 text-sm font-bold">
                <dt>Total</dt>
                <dd>{formatPrice(total)}</dd>
              </div>
            </dl>
            <p className="mt-4 text-center opacity-60">{t.footer}</p>
          </ReceiptPrinter.Paper>
        </ReceiptPrinter.Output>
      </ReceiptPrinter.Root>
    </div>
  );
}
