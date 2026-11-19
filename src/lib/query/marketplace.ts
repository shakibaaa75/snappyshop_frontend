"use client";

import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import { useMemo } from "react";
import { qk } from "@/lib/query/keys";
import { categoryTree } from "@/lib/api/categories";
import type { Category } from "@/types";
import {
  fetchMarketplaceCategories,
  fetchMarketplaceProducts,
  fetchMarketplaceSellers,
  type ProductQuery,
  type SellerQuery,
} from "@/lib/api/marketplace";

/**
 * Identical params share one cache entry, so repeated sections never refetch.
 * keepPreviousData: clicking a category pill keeps the old row on screen
 * until the new one arrives, instead of flashing back to a skeleton.
 */
export const useMarketplaceProducts = (
  query: ProductQuery,
  options: { enabled?: boolean } = {},
) =>
  useQuery({
    queryKey: qk.marketplace.products({ ...query }),
    queryFn: ({ signal }) => fetchMarketplaceProducts(query, signal),
    placeholderData: keepPreviousData,
    staleTime: 60_000,      // same search within 1 min = instant, no request
    gcTime: 5 * 60_000,     // keep unused results for 5 min
    enabled: options.enabled ?? true,
  });

/**
 * "Load more" list: every page is one request of `query.limit` products.
 * fetchNextPage() asks the backend for page 2, 3, ... and the pages stay
 * together in `data.pages`. The key carries `infinite: true`, so it never
 * collides with the normal single-page cache entry for the same filters.
 */
export const useMarketplaceProductsInfinite = (
  query: Omit<ProductQuery, "page">,
) =>
  useInfiniteQuery({
    queryKey: qk.marketplace.products({ ...query, infinite: true }),
    queryFn: ({ pageParam, signal }) =>
      fetchMarketplaceProducts({ ...query, page: pageParam }, signal),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page * last.limit < last.total ? last.page + 1 : undefined,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

export const useMarketplaceSellers = (query: SellerQuery = {}) =>
  useQuery({
    queryKey: qk.marketplace.sellers({ ...query }),
    queryFn: ({ signal }) => fetchMarketplaceSellers(query, signal),
    placeholderData: keepPreviousData,
  });

export const useMarketplaceCategories = () =>
  useQuery({
    queryKey: qk.marketplace.categories,
    queryFn: ({ signal }) => fetchMarketplaceCategories(signal),
  });

/* ------------------------------------------------------------------ */
/* Main Type -> Category navigation                                    */
/* ------------------------------------------------------------------ */

export interface MainType {
  id: string;
  name: string;
  /** Picture the admin chose for this Main Type (optional). */
  image?: string;
  /**
   * Standardized categories of this Main Type that have at least one
   * product on the marketplace (seller spelling mistakes are already
   * resolved by the backend, so "T-Shrit" shows up as "T-Shirt").
   */
  categories: Category[];
}

/**
 * Joins two EXISTING endpoints, no new backend calls:
 *   GET /categories/tree         Main Types + their official categories (order, names)
 *   GET /marketplace/categories  standardized categories that really have products
 * A category is only offered when it has products, so no tab is a dead end.
 */
export function useMainTypes() {
  const tree = useQuery({
    queryKey: qk.marketplace.mainTypes,
    queryFn: () => categoryTree.get(),
    staleTime: 5 * 60_000,
  });
  const live = useMarketplaceCategories();

  const mains = useMemo<MainType[]>(() => {
    if (!tree.data) return [];
    const withProducts = new Map<string, Category>();
    for (const c of live.data ?? []) withProducts.set(c.slug, c);
    return tree.data.map((m) => {
      const seen = new Set<string>();
      const categories: Category[] = [];
      // Official order first ...
      for (const ch of m.children) {
        const hit = withProducts.get(ch.id);
        if (!hit) continue;
        seen.add(ch.id);
        categories.push({ ...hit, name: ch.name, image: ch.image ?? hit.image });
      }
      // ... then anything new under this Main Type the tree cache has not shown yet.
      for (const c of live.data ?? []) {
        if (!seen.has(c.slug) && c.slug.startsWith(`${m.id}.`)) categories.push(c);
      }
      return { id: m.id, name: m.name, image: m.image, categories };
    });
  }, [tree.data, live.data]);

  return {
    mains,
    /** Main Types are known (the category lists may still be loading). */
    isPending: tree.isPending,
    isError: tree.isError,
    /** The per-category lists are still loading. */
    categoriesPending: live.isPending,
    refetch: () => {
      void tree.refetch();
      void live.refetch();
    },
  };
}