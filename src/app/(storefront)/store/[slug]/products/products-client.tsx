"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, PackageSearch } from "lucide-react";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/http";
import { fetchPublicStore } from "@/lib/store-design/api";
import { loadFont, radiusPx, themeVars } from "@/lib/store-design/utilts";
import { StoreProductGrid } from "@/components/store-design/Storepreview";
import { MobileDock } from "@/components/store-design/preview/mobile-nav";
import { useIsMobile } from "@/components/store-design/preview/hooks";
import type { Ctx } from "@/components/store-design/preview/types";
import type { StoreDesign } from "@/lib/store-design/types";
import type { PublicStoreData } from "@/lib/store-design/server";

type Sort = "newest" | "popular" | "price-asc" | "price-desc";

const SORTS: { id: Sort; label: string }[] = [
  { id: "newest", label: "Newest" },
  { id: "popular", label: "Most popular" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
];

export default function ProductsClient({
  slug,
  initialCategory,
  initialData,
}: {
  slug: string;
  /** From `?category=` on the server-rendered request. */
  initialCategory?: string;
  initialData: PublicStoreData;
}) {
  const { data, error } = useQuery({
    queryKey: ["public-store", slug],
    queryFn: () => fetchPublicStore(slug),
    initialData,
    staleTime: 30_000,
    retry: (count, err) => {
      if (err instanceof ApiError && err.status === 404) return false;
      return count < 2;
    },
  });

  const design = (data?.design ?? initialData.design) as
    | StoreDesign
    | undefined;
  const products = data?.products ?? initialData.products;
  const categories = data?.categories ?? initialData.categories;

  const [categoryId, setCategoryId] = useState<string>(
    initialCategory ?? "all",
  );
  const [sort, setSort] = useState<Sort>("newest");

  // An unknown ?category= value falls back to "all" instead of an empty page.
  const activeCategory = categories.some((c) => c.id === categoryId)
    ? categoryId
    : "all";

  const list = useMemo(() => {
    const filtered =
      activeCategory === "all"
        ? products
        : products.filter((p) => p.categoryId === activeCategory);
    const sorted = [...filtered];
    switch (sort) {
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "popular":
        sorted.sort((a, b) => b.sold - a.sold);
        break;
      default:
        sorted.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    }
    return sorted;
  }, [products, activeCategory, sort]);

  const pickCategory = (id: string) => {
    setCategoryId(id);
    // Keep the URL shareable without triggering a server re-render.
    const url = new URL(window.location.href);
    if (id === "all") url.searchParams.delete("category");
    else url.searchParams.set("category", id);
    window.history.replaceState(null, "", url);
  };

  // Bottom dock (Home / Shop / Categories / Menu) for phones. The home and tab
  // pages get it from LiveStorePreview; this page renders its own layout, so
  // it has to mount the dock itself.
  const mobile = useIsMobile(true, false);
  const dockCtx = useMemo<Ctx | null>(() => {
    if (!design) return null;
    const base = `/store/${slug}`;
    const navLinks = (design.navLinks ?? []).map((l) => {
      const label = (l.label || "").trim().toLowerCase();
      const url = (l.url || "").trim();
      if (
        /^(shop|store|home)$/.test(label) ||
        url === "/products" ||
        url === "/shop" ||
        url === "/" ||
        url === ""
      ) {
        return { ...l, url: base };
      }
      if (/^(https?:|mailto:|tel:|#)/.test(url) || url.startsWith("/store/")) {
        return { ...l, url };
      }
      return { ...l, url: `${base}${url}` };
    });
    return {
      d: { ...design, storeSlug: design.storeSlug || slug, navLinks },
      mobile: true,
      radius: radiusPx[design.buttonRadius],
      products,
      categories,
      verified: false,
      interactive: true,
    };
  }, [design, slug, products, categories]);

  if (error || !design) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-xl font-semibold">Store not found</h1>
        <p className="text-sm text-muted-foreground">
          This store is no longer available or may have been removed.
        </p>
      </div>
    );
  }

  loadFont(design.fontFamily);

  const storeHref = `/store/${slug}`;
  const pageBg = design.productBgColor || "var(--s-bg)";

  return (
    <div
      style={themeVars(design) as CSSProperties}
      data-template={design.template}
      data-card={design.cardVariant}
      data-radius={design.buttonRadius}
      data-primary={design.primaryColor}
      className="storefront text-[15px] leading-normal"
    >
      <div
        className="min-h-screen"
        style={{ background: pageBg, color: "var(--s-text)" }}
      >
        {design.announcementEnabled && design.announcementText && (
          <div
            className="px-4 py-2 text-center text-xs font-semibold"
            style={{
              background: "var(--s-primary)",
              color: "var(--s-on-primary)",
            }}
          >
            {design.announcementText}
          </div>
        )}

        <main className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-6 lg:px-8 lg:pt-10">
          <Link
            href={storeHref}
            className="inline-flex items-center gap-2 text-sm font-semibold hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {design.storeName || "store"}
          </Link>

          <header className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
                All products
              </h1>
              <p className="mt-1 text-sm" style={{ color: "var(--s-muted)" }}>
                {list.length} {list.length === 1 ? "item" : "items"}
              </p>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <span style={{ color: "var(--s-muted)" }}>Sort</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="h-10 rounded-[var(--pp-btn,12px)] border px-3 text-sm font-medium"
                style={{
                  background: "var(--s-surface)",
                  color: "var(--s-text)",
                  borderColor: "var(--s-border)",
                }}
              >
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </header>

          {categories.length > 0 && (
            <div
              className="no-scrollbar mt-5 flex gap-2 overflow-x-auto"
              role="group"
              aria-label="Filter by category"
            >
              {[{ id: "all", name: "All" }, ...categories].map((c) => {
                const on = activeCategory === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => pickCategory(c.id)}
                    className={cn(
                      "shrink-0 whitespace-nowrap rounded-[var(--pp-btn,12px)] px-4 py-2 text-xs font-semibold transition active:scale-95",
                    )}
                    style={
                      on
                        ? { background: "var(--s-text)", color: "var(--s-bg)" }
                        : { background: "var(--s-surface)" }
                    }
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          )}

          <section className="mt-6">
            {list.length === 0 ? (
              <div
                className="flex flex-col items-center gap-3 rounded-2xl py-16 text-center"
                style={{ background: "var(--s-surface)" }}
              >
                <PackageSearch className="h-8 w-8" />
                <p className="font-semibold">No products here yet</p>
                <p className="text-sm" style={{ color: "var(--s-muted)" }}>
                  Try another category.
                </p>
              </div>
            ) : (
              <StoreProductGrid
                key={`${activeCategory}-${sort}`}
                design={design}
                products={list}
                categories={categories}
                // The grid shows `rows × columns` items; enough rows for all.
                rows={Math.max(1, list.length)}
              />
            )}
          </section>
        </main>

        {design.showFooter && (
          <footer
            className="px-6 py-7 text-center text-xs"
            style={{ color: "var(--s-muted)" }}
          >
            © {new Date().getFullYear()} {design.storeName}. Powered by ShopBD.
          </footer>
        )}
      </div>
      {mobile && dockCtx && <MobileDock ctx={dockCtx} />}
    </div>
  );
}
