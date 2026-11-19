"use client";

import { deliveryRow, deliveryRowText } from "@/lib/delivery/breakdown";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import {
  LAST_CHECKOUT_KEY,
  type CheckoutOutcome,
} from "@/lib/cart/place-orders";
import { paymentLabels } from "@/lib/store-design/types";

export default function SuccessClient() {
  const [outcome, setOutcome] = useState<CheckoutOutcome | null | undefined>(
    undefined,
  );

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(LAST_CHECKOUT_KEY);
      setOutcome(raw ? (JSON.parse(raw) as CheckoutOutcome) : null);
    } catch {
      setOutcome(null);
    }
  }, []);

  if (outcome === undefined) return null;

  if (!outcome || outcome.placed.length === 0) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-xl font-semibold">No recent order found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          If you just ordered, check your orders page.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/account/orders">
            <Button variant="outline" className="rounded-full">
              My orders
            </Button>
          </Link>
          <Link href="/">
            <Button variant="accent" className="rounded-full">
              Continue shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const grand = outcome.placed.reduce((n, o) => n + o.total, 0);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
        <h1 className="mt-3 text-2xl font-bold text-primary">
          {outcome.placed.length === 1
            ? "Your order is placed"
            : `${outcome.placed.length} orders placed`}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Each seller will confirm and ship their own order. Payment:{" "}
          {paymentLabels[outcome.payment] ?? outcome.payment}.
        </p>
      </div>

      <ul className="mt-8 space-y-3">
        {outcome.placed.map((o) => (
          <li
            key={o.id}
            className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold">{o.storeName}</p>
              <p className="text-xs text-muted-foreground">Order {o.number}</p>
              <p className="text-xs text-muted-foreground">
                {(() => {
                  const d = deliveryRow(o, formatPrice);
                  return `${d.label}: ${deliveryRowText(d)}`;
                })()}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-sm font-bold">{formatPrice(o.total)}</span>
              <Link href={`/store/${o.slug}/order/${o.id}`}>
                <Button variant="outline" size="sm" className="rounded-full">
                  View
                </Button>
              </Link>
            </div>
          </li>
        ))}
        <li className="flex justify-between rounded-xl bg-muted/40 px-4 py-3 text-sm font-bold">
          <span>Total</span>
          <span>{formatPrice(grand)}</span>
        </li>
      </ul>

      {outcome.failed.length > 0 && (
        <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-500/40 dark:bg-amber-500/10">
          <p className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4" />
            {outcome.failed.length === 1
              ? "1 order could not be placed"
              : `${outcome.failed.length} orders could not be placed`}
          </p>
          <ul className="mt-2 space-y-1 text-amber-900 dark:text-amber-200">
            {outcome.failed.map((f) => (
              <li key={f.slug}>
                <span className="font-medium">{f.storeName}:</span> {f.message}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            These items are still in your cart. Nothing was charged for them.
          </p>
          <Link href="/cart" className="mt-3 inline-block">
            <Button variant="accent" size="sm" className="rounded-full">
              Review cart
            </Button>
          </Link>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href="/" className="text-sm text-accent hover:underline">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
