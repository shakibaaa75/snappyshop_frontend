"use client";

/**
 * React Query hooks for storefront delivery pricing. One place, used by the
 * product page, cart and checkout, so they can never disagree.
 */
import { keepPreviousData, useQueries, useQuery } from "@tanstack/react-query";
import { publicDelivery } from "@/lib/api/delivery-settings";
import { publicOrders, type DeliveryQuote } from "@/lib/api/orders";
import { qk } from "@/lib/query/keys";
import {
  estimateBothZones,
  estimateDelivery,
  zoneFor,
  type DeliveryEstimate,
  type PricingSettings,
} from "./pricing";

/** The store's public delivery charges. `undefined` while loading or on error. */
export function usePublicDelivery(slug: string) {
  return useQuery({
    queryKey: qk.public.deliverySettings(slug),
    queryFn: ({ signal }) => publicDelivery.get(slug, signal),
    enabled: !!slug,
    staleTime: 30_000,
    retry: 1,
  });
}

interface CartLineLike {
  productId: string;
  variantId?: string;
  qty: number;
}

/** Cart estimate for both zones (the district is not known yet). */
export function useCartDeliveryRange(
  slug: string,
  lines: CartLineLike[],
  subtotal: number,
) {
  const q = usePublicDelivery(slug);
  const settings: PricingSettings | undefined = q.data;
  const ids = lines.map((l) => l.productId);
  return {
    ready: !!settings,
    settings,
    ...estimateBothZones(settings, ids, subtotal),
  };
}

export interface CheckoutDelivery {
  /** True once a district is chosen. */
  hasDistrict: boolean;
  /** The charge to show, or 0 when there is no district yet. */
  delivery: number;
  base: number;
  waived: boolean;
  discount: number;
  /** Subtotal + delivery - discount, or just the subtotal with no district. */
  total: number;
  zone: DeliveryEstimate["zone"] | null;
  /** True while the server price for the current district/cart is loading. */
  pending: boolean;
  /** The server could not price the cart; the figures are a local estimate. */
  estimated: boolean;
}

/**
 * Checkout's live total. Asks the server (the same rules the order uses) and
 * shows a local estimate for the instant before the answer arrives or if the
 * request fails. Placing the order always re-prices on the server.
 */
export function useCheckoutDelivery(
  slug: string,
  district: string,
  lines: CartLineLike[],
  subtotal: number,
): CheckoutDelivery {
  const settingsQ = usePublicDelivery(slug);
  const hasDistrict = district.trim().length >= 2 && lines.length > 0;

  const quoteQ = useQuery<DeliveryQuote>({
    queryKey: [
      "public-store",
      slug,
      "delivery-quote",
      district.trim(),
      lines.map((l) => [l.productId, l.variantId ?? "", l.qty]),
    ],
    queryFn: ({ signal }) =>
      publicOrders.quote(
        slug,
        {
          shippingCity: district.trim(),
          lines: lines.map((l) => ({
            productId: l.productId,
            qty: l.qty,
            ...(l.variantId ? { variantId: l.variantId } : {}),
          })),
        },
        signal,
      ),
    enabled: !!slug && hasDistrict,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    retry: 1,
  });

  if (!hasDistrict) {
    return {
      hasDistrict: false,
      delivery: 0,
      base: 0,
      waived: false,
      discount: 0,
      total: subtotal,
      zone: null,
      pending: false,
      estimated: false,
    };
  }

  if (quoteQ.data) {
    const q = quoteQ.data;
    return {
      hasDistrict: true,
      delivery: q.delivery,
      base: q.deliveryBase,
      waived: q.freeDeliveryApplied,
      discount: q.discount,
      total: q.total,
      zone: q.deliveryZone,
      // keepPreviousData shows the last answer while a new one loads.
      pending: quoteQ.isPlaceholderData || quoteQ.isFetching,
      estimated: false,
    };
  }

  // No server answer (still loading, or failed): fall back to the estimate.
  const est = estimateDelivery(
    settingsQ.data,
    zoneFor(district),
    lines.map((l) => l.productId),
    subtotal,
  );
  return {
    hasDistrict: true,
    delivery: est.charge,
    base: est.base,
    waived: est.waived,
    discount: 0,
    total: subtotal + est.charge,
    zone: est.zone,
    pending: quoteQ.isPending && !quoteQ.isError,
    estimated: true,
  };
}

/** One seller's delivery price in the marketplace checkout. */
export interface SellerDelivery {
  /** The server's price, or null while loading / if it could not be priced. */
  quote: DeliveryQuote | null;
  pending: boolean;
  failed: boolean;
}

interface SellerCartLike {
  slug: string;
  lines: CartLineLike[];
}

/**
 * Marketplace checkout: each seller is its own order and its own parcel, so
 * each one is priced separately for the chosen district (a customer buying
 * from 3 sellers pays 3 delivery charges, one per seller).
 */
export function useSellerDeliveries(
  carts: SellerCartLike[],
  district: string,
): { perSeller: SellerDelivery[]; hasDistrict: boolean } {
  const hasDistrict = district.trim().length >= 2;
  const results = useQueries({
    queries: carts.map((c) => ({
      queryKey: [
        "public-store",
        c.slug,
        "delivery-quote",
        district.trim(),
        c.lines.map((l) => [l.productId, l.variantId ?? "", l.qty]),
      ],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        publicOrders.quote(
          c.slug,
          {
            shippingCity: district.trim(),
            lines: c.lines.map((l) => ({
              productId: l.productId,
              qty: l.qty,
              ...(l.variantId ? { variantId: l.variantId } : {}),
            })),
          },
          signal,
        ),
      enabled: hasDistrict && c.lines.length > 0,
      placeholderData: keepPreviousData,
      staleTime: 15_000,
      retry: 1,
    })),
  });
  return {
    hasDistrict,
    perSeller: results.map((r) => ({
      quote: r.data ?? null,
      pending: hasDistrict && (r.isPending || r.isPlaceholderData || r.isFetching) && !r.isError,
      failed: r.isError && !r.data,
    })),
  };
}
