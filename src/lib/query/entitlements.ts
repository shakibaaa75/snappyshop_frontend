"use client";

import { useQuery } from "@tanstack/react-query";
import {
  FREE_ENTITLEMENTS,
  sellerSubscription,
  type Entitlements,
} from "@/lib/subscription";

/** Shared with the subscription page, so a payment refreshes every lock. */
export const SUBSCRIPTION_QUERY_KEY = ["seller", "subscription"] as const;

/**
 * The seller's current plan rules. Until they load (or if the request
 * fails) the Free rules apply, so a premium control is never shown open
 * by mistake. The server enforces the same limits regardless.
 */
export function useEntitlements(): {
  entitlements: Entitlements;
  isLoading: boolean;
} {
  const q = useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEY,
    queryFn: sellerSubscription.get,
    retry: false,
    staleTime: 30_000,
  });
  return {
    entitlements: q.data?.entitlements ?? FREE_ENTITLEMENTS,
    isLoading: q.isLoading,
  };
}
