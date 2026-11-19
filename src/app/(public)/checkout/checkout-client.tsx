"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Loader2, Lock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { authApi } from "@/lib/api/auth";
import type { BuyerAddress } from "@/lib/api/buyer";
import type { PaymentMethod } from "@/lib/api/orders";
import { formatPrice } from "@/lib/format";
import { useAllCarts } from "@/lib/cart/marketplace-cart";
import { isBlocked, liveFor } from "@/lib/cart/live";
import { useSellerDeliveries } from "@/lib/delivery/use-delivery";
import { zoneLabel } from "@/lib/delivery/breakdown";
import { ALL_DISTRICTS, canonicalDistrict } from "@/lib/geo/districts";
import {
  LAST_CHECKOUT_KEY,
  placeCombinedOrders,
  type FailedOrder,
} from "@/lib/cart/place-orders";
import { useBuyerAddresses } from "@/lib/query/buyer";
import { qk } from "@/lib/query/keys";
import { fetchPublicStore } from "@/lib/store-design/api";
import { lineKey } from "@/lib/store-design/cart";
import { paymentLabels } from "@/lib/store-design/types";

const ALL_METHODS: PaymentMethod[] = ["cod", "bkash", "nagad", "rocket", "card"];

export default function CheckoutClient() {
  const router = useRouter();
  const { carts, subtotal, ready } = useAllCarts();

  // Same query key as the cart page and the storefront: shared cache.
  const results = useQueries({
    queries: carts.map((c) => ({
      queryKey: ["public-store", c.slug],
      queryFn: () => fetchPublicStore(c.slug),
      staleTime: 30_000,
      retry: 1,
    })),
  });
  const loadingStores = results.some((r) => r.isLoading);
  const storeFailed = results.some((r) => r.isError);

  // Signed-in buyers get their saved addresses; guests can still order.
  const me = useQuery({
    queryKey: qk.auth.me,
    queryFn: authApi.me,
    retry: false,
    staleTime: 30_000,
  });
  const isBuyer = me.data?.role === "BUYER";
  const addressesQ = useBuyerAddresses(isBuyer);
  const savedAddresses: BuyerAddress[] = addressesQ.data?.addresses ?? [];

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState<PaymentMethod | null>(null);
  const [pickedAddr, setPickedAddr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [failed, setFailed] = useState<FailedOrder[]>([]);
  const submitLock = useRef(false);

  const applyAddress = (a: BuyerAddress) => {
    setPickedAddr(a.id);
    setName(a.fullName);
    setPhone(a.phone);
    setAddress(a.area);
    // A saved district that is not one of the 64 (older addresses) is left
    // blank so the buyer picks it; the delivery charge depends on it.
    setCity(canonicalDistrict(a.district));
    setArea(a.upazila);
  };

  // Prefill once: the default saved address, else just the account name/email.
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current || !isBuyer || addressesQ.isLoading) return;
    prefilled.current = true;
    const def = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0];
    if (def) applyAddress(def);
    else if (me.data?.name) setName(me.data.name);
    if (me.data?.email) setEmail((v) => v || (me.data?.email ?? ""));
  }, [isBuyer, addressesQ.isLoading, savedAddresses, me.data]);

  // Payment methods every seller in the cart accepts.
  const allowed = useMemo<PaymentMethod[]>(() => {
    const sets = results
      .map((r) => r.data?.design.paymentMethods)
      .filter((m): m is PaymentMethod[] => Array.isArray(m));
    if (sets.length === 0) return [];
    return ALL_METHODS.filter((m) => sets.every((s) => s.includes(m)));
  }, [results]);
  const method: PaymentMethod | null =
    payment && allowed.includes(payment) ? payment : (allowed[0] ?? null);

  // Each seller is its own order and parcel, so each is priced for the chosen
  // district by the server (the same rules the order will use).
  const deliveries = useSellerDeliveries(carts, city);

  // Per-seller numbers + anything that blocks ordering.
  const sellers = carts.map((c, i) => {
    const store = results[i]?.data;
    const d = deliveries.perSeller[i];
    const blockedLines = c.lines.filter((l) =>
      isBlocked(liveFor(store, l), l.qty),
    );
    return { cart: c, store, quote: d?.quote ?? null, delivery: d, blockedLines };
  });
  const anyBlocked = sellers.some((s) => s.blockedLines.length > 0);
  const deliveryTotal = sellers.reduce((n, s) => n + (s.quote?.delivery ?? 0), 0);
  const discountTotal = sellers.reduce((n, s) => n + (s.quote?.discount ?? 0), 0);
  const grand = subtotal + deliveryTotal - discountTotal;
  const quotesPending = deliveries.hasDistrict && sellers.some((s) => s.delivery?.pending);

  if (!ready) return <PageSkeleton />;

  if (carts.length === 0) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-xl font-semibold">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add items to your cart before checking out.
        </p>
        <Link href="/products" className="mt-6 inline-block">
          <Button variant="accent" className="rounded-full">
            Continue shopping
          </Button>
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLock.current) return; // blocks double taps
    setFormError(null);
    setFailed([]);

    if (name.trim().length < 2) return setFormError("Please enter your full name.");
    if (!/^01[3-9]\d{8}$/.test(phone.replace(/\D/g, "")))
      return setFormError("Please enter a valid BD phone number (e.g. 017XXXXXXXX).");
    if (address.trim().length < 6)
      return setFormError("Please enter your full delivery address.");
    if (!canonicalDistrict(city))
      return setFormError("Please choose your district from the list.");
    if (!method) return setFormError("Please choose a payment method.");
    if (anyBlocked)
      return setFormError("Some items are unavailable. Fix your cart first.");

    submitLock.current = true;
    setSubmitting(true);
    const outcome = await placeCombinedOrders(
      carts,
      {
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim(),
        shippingAddress: address.trim(),
        shippingCity: canonicalDistrict(city),
        shippingArea: area.trim(),
        notes: notes.trim(),
      },
      method,
    );

    if (outcome.placed.length === 0) {
      // Nothing went through: stay here and show why.
      setFailed(outcome.failed);
      setFormError("No order could be placed.");
      submitLock.current = false;
      setSubmitting(false);
      return;
    }
    try {
      window.sessionStorage.setItem(LAST_CHECKOUT_KEY, JSON.stringify(outcome));
    } catch {
      /* the success page then shows "no recent order" */
    }
    router.push("/checkout/success");
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold text-primary">
        <Lock className="h-5 w-5" /> Checkout
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        One form for all sellers. We place a separate order for each seller.
      </p>

      <form
        onSubmit={handleSubmit}
        className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]"
      >
        <div className="space-y-6">
          {/* Saved addresses */}
          {isBuyer && savedAddresses.length > 0 && (
            <section className="rounded-xl border bg-card p-5">
              <h2 className="mb-3 flex items-center gap-2 font-semibold">
                <MapPin className="h-4 w-4" /> Saved addresses
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {savedAddresses.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => applyAddress(a)}
                    className={`rounded-lg border p-3 text-left text-sm transition ${
                      pickedAddr === a.id
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/40"
                    }`}
                  >
                    <span className="font-medium">{a.label}</span>
                    <span className="block truncate text-muted-foreground">
                      {a.fullName} · {a.area}, {a.district}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-xl border bg-card p-5">
            <h2 className="mb-4 font-semibold">Delivery details</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Full name" required>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sakib Hasan" autoComplete="name" />
              </Field>
              <Field label="Phone" required>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="017XXXXXXXX" inputMode="tel" autoComplete="tel" />
              </Field>
              <Field label="Email (optional)" className="sm:col-span-2">
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" inputMode="email" autoComplete="email" />
              </Field>
              <Field label="Address" required className="sm:col-span-2">
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House / Road / Block" autoComplete="street-address" />
              </Field>
              <Field label="District" required>
                <select
                  value={canonicalDistrict(city)}
                  onChange={(e) => setCity(e.target.value)}
                  autoComplete="address-level2"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">Choose your district</option>
                  {ALL_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Area / Thana (optional)">
                <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Dhanmondi" />
              </Field>
              <Field label="Note for the sellers (optional)" className="sm:col-span-2">
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Call before delivery" />
              </Field>
            </div>
          </section>

          <section className="rounded-xl border bg-card p-5">
            <h2 className="mb-3 font-semibold">Payment</h2>
            {loadingStores ? (
              <Skeleton className="h-10 w-full" />
            ) : storeFailed ? (
              <p className="text-sm text-destructive">
                Could not load the sellers. Refresh and try again.
              </p>
            ) : allowed.length === 0 ? (
              <p className="text-sm text-amber-700 dark:text-amber-300">
                These sellers don&apos;t accept a common payment method. Check
                out with each seller separately from your{" "}
                <Link href="/cart" className="underline">
                  cart
                </Link>
                .
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {allowed.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPayment(m)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      method === m
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:border-primary/40"
                    }`}
                  >
                    {paymentLabels[m]}
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Summary */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-xl border bg-card p-5">
            <h2 className="mb-3 font-semibold">Your orders</h2>
            <div className="space-y-4">
              {sellers.map(({ cart, quote, delivery, blockedLines }) => (
                <div key={cart.slug} className="text-sm">
                  <p className="mb-1 font-medium">{cart.name}</p>
                  <ul className="space-y-0.5 text-muted-foreground">
                    {cart.lines.map((l) => (
                      <li key={lineKey(l)} className="flex justify-between gap-2">
                        <span className="truncate">
                          {l.qty}× {l.name}
                          {l.variantLabel ? ` (${l.variantLabel})` : ""}
                        </span>
                        <span className="shrink-0">{formatPrice(l.price * l.qty)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1 flex justify-between text-xs text-muted-foreground">
                    <span>
                      Delivery
                      {quote ? ` (${zoneLabel(quote.deliveryZone)})` : ""}
                    </span>
                    <span className={delivery?.pending ? "opacity-60" : undefined}>
                      {!deliveries.hasDistrict ? (
                        "Choose district"
                      ) : !quote ? (
                        delivery?.failed ? "Set by seller" : "Calculating…"
                      ) : quote.freeDeliveryApplied ? (
                        <>
                          <s className="mr-1">{formatPrice(quote.deliveryBase)}</s>
                          Free
                        </>
                      ) : quote.delivery === 0 ? (
                        "Free"
                      ) : (
                        formatPrice(quote.delivery)
                      )}
                    </span>
                  </p>
                  {blockedLines.length > 0 && (
                    <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                      {blockedLines.length === 1
                        ? "1 item is unavailable."
                        : `${blockedLines.length} items are unavailable.`}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between border-t pt-3 text-base font-bold">
              <span>Total</span>
              <span className={quotesPending ? "opacity-60" : undefined}>
                {formatPrice(grand)}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {deliveries.hasDistrict
                ? sellers.length > 1
                  ? "Each seller ships its own order, so each charges its own delivery."
                  : "Delivery is set by the seller for your district."
                : "Choose your district to see each seller's delivery charge."}
            </p>
          </section>

          {anyBlocked && (
            <p className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Some items are sold out or no longer sold.{" "}
                <Link href="/cart" className="font-semibold underline">
                  Fix your cart
                </Link>
                .
              </span>
            </p>
          )}

          {failed.length > 0 && (
            <ul className="space-y-1 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
              {failed.map((f) => (
                <li key={f.slug}>
                  <span className="font-medium">{f.storeName}:</span> {f.message}
                </li>
              ))}
            </ul>
          )}

          {formError && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {formError}
            </p>
          )}

          <Button
            type="submit"
            variant="accent"
            size="lg"
            className="w-full rounded-full"
            disabled={
              submitting || loadingStores || anyBlocked || !method || storeFailed
            }
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Placing {carts.length} {carts.length === 1 ? "order" : "orders"}…
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Place {carts.length === 1 ? "order" : `${carts.length} orders`} ·{" "}
                {formatPrice(grand)}
              </>
            )}
          </Button>
        </aside>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block space-y-1 text-sm ${className ?? ""}`}>
      <span className="font-medium">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </span>
      {children}
    </label>
  );
}

function PageSkeleton() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      <Skeleton className="mb-8 h-8 w-48" />
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
