"use client";

import { useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Gift,
  Loader2,
  Lock,
  Sparkles,
} from "lucide-react";
import { formatBDT } from "@/lib/api/orders";
import { ApiError } from "@/lib/api/http";
import { featureQueryKey, sellerFeatures } from "@/lib/features";
import type { PayMethod } from "@/lib/subscription";
import { cn } from "@/lib/utils";
import { LooksManager } from "@/components/seller/looks/LooksManager";

const FEATURE = "try_the_look" as const;

const METHODS: { id: PayMethod; label: string; hint: string; logo: string }[] =
  [
    {
      id: "bkash",
      label: "bKash",
      hint: "Pay with your bKash wallet",
      logo: "/payments/bkash.jpg",
    },
    {
      id: "nagad",
      label: "Nagad",
      hint: "Pay with your Nagad wallet",
      logo: "/payments/nagad.jpg",
    },
    {
      id: "card",
      label: "Card",
      hint: "Visa, Mastercard, AmEx",
      logo: "/payments/card.jpg",
    },
  ];

const WHAT_YOU_GET = [
  "A premium, magazine-style outfit showcase for your store",
  "A sticky model photo with a scrolling list of the products worn",
  "Up to 30 products per look, as many looks as you like",
  "Prices and stock update automatically from your products",
  "Featured on the ShopBD marketplace homepage",
];

export default function TryTheLookClient() {
  const params = useSearchParams();
  const returned = params.get("status"); // set by the backend after the gateway redirects back
  const [method, setMethod] = useState<PayMethod>("bkash");

  const { data, isLoading, isError } = useQuery({
    queryKey: featureQueryKey(FEATURE),
    queryFn: () => sellerFeatures.get(FEATURE),
    retry: false,
    // Always ask the server when the page opens, so a purchase or an admin
    // grant shows up without waiting for the cache.
    refetchOnMount: "always",
  });

  const pay = useMutation({
    mutationFn: async () => {
      const res = await sellerFeatures.checkout(FEATURE, { method });
      if (!/^https:\/\//.test(res.paymentUrl)) {
        throw new Error("Invalid payment link");
      }
      return res;
    },
    onSuccess: (res) => {
      window.location.href = res.paymentUrl;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  const unlocked = data?.unlocked === true;
  const blocked = data?.status === "disabled" || data?.status === "revoked";
  const price = data?.price ?? 0;

  const payError = pay.error
    ? pay.error instanceof ApiError
      ? pay.error.message
      : "Could not start the payment. Please try again."
    : null;

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Try the Look
          </h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
            <Sparkles className="h-3 w-3" /> Premium
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Show a complete outfit on a model and let buyers shop every piece.
        </p>
      </header>

      {returned === "success" && !unlocked && (
        <Banner tone="ok" icon={CheckCircle2}>
          Payment received. If Try the Look doesn&apos;t show as unlocked yet,
          refresh in a minute.
        </Banner>
      )}
      {returned === "failed" && (
        <Banner tone="bad" icon={AlertCircle}>
          The payment failed and you were not charged. Please try again.
        </Banner>
      )}
      {returned === "cancelled" && (
        <Banner tone="warn" icon={AlertCircle}>
          Payment cancelled. You were not charged.
        </Banner>
      )}
      {isError && (
        <Banner tone="warn" icon={AlertCircle}>
          Couldn&apos;t load your Try the Look status. Please refresh the page.
        </Banner>
      )}

      {/* ---------- Unlocked ---------- */}
      {unlocked && (
        <section className="rounded-2xl border border-emerald-300 bg-emerald-50 p-5">
          <div className="flex items-start gap-3">
            {data?.source === "admin_granted" ? (
              <Gift className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            )}
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-emerald-900">
                Try the Look is unlocked
              </h2>
              <p className="mt-0.5 text-xs text-emerald-800">
                {data?.source === "admin_granted"
                  ? "Provided free by ShopBD."
                  : "You bought it once, it stays unlocked for your store."}
                {data?.note ? ` Note: ${data.note}` : ""}
              </p>
            </div>
          </div>
        </section>
      )}
      {unlocked && <LooksManager />}

      {/* ---------- Turned off by an admin ---------- */}
      {!unlocked && blocked && (
        <Banner tone="warn" icon={Lock}>
          Access to Try the Look was turned off by ShopBD
          {data?.note ? `: ${data.note}` : "."} Please contact support.
        </Banner>
      )}

      {/* ---------- Locked: sales card ---------- */}
      {!unlocked && !blocked && (
        <section className="grid gap-6 rounded-2xl border bg-card p-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Lock className="h-4 w-4" /> Locked
            </div>
            <ul className="space-y-2.5">
              {WHAT_YOU_GET.map((t) => (
                <li key={t} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <div>
              <p className="text-3xl font-bold tracking-tight">
                {formatBDT(price)}
              </p>
              <p className="text-xs text-muted-foreground">
                One-time payment. No subscription, no renewal.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Pay with</p>
            <div className="space-y-2">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  aria-pressed={method === m.id}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition",
                    method === m.id
                      ? "border-foreground ring-1 ring-foreground"
                      : "hover:border-foreground/40",
                  )}
                >
                  <Image
                    src={m.logo}
                    alt=""
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-md object-cover"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{m.label}</span>
                    <span className="block text-xs text-muted-foreground">
                      {m.hint}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => pay.mutate()}
              disabled={pay.isPending || price <= 0}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-60"
            >
              {pay.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Unlock Try the Look · {formatBDT(price)}
            </button>
            {payError && (
              <p role="alert" className="text-xs font-medium text-red-700">
                {payError}
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function Banner({
  tone,
  icon: Icon,
  children,
}: {
  tone: "ok" | "bad" | "warn";
  icon: typeof AlertCircle;
  children: React.ReactNode;
}) {
  const styles = {
    ok: "border-emerald-300 bg-emerald-50 text-emerald-900",
    bad: "border-red-300 bg-red-50 text-red-900",
    warn: "border-amber-300 bg-amber-50 text-amber-900",
  }[tone];
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-xl border p-3 text-sm",
        styles,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{children}</p>
    </div>
  );
}
