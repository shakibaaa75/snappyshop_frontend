"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Eye,
  Loader2,
  Lock,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { qk } from "@/lib/query/keys";
import { useEntitlements } from "@/lib/query/entitlements";
import { UpgradeNotice } from "@/components/seller/plan-lock";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/http";
import { productPreviewHref } from "@/lib/api/product-preview";
import { sellerProducts, type SellerProduct } from "@/lib/api/products";
import { sellerCategories, type SellerCategory } from "@/lib/api/categories";
import { CategoryDialog } from "@/components/seller/CategoryDialog";
import { formatPrice } from "@/lib/store-design/utilts";
import { ProductArt } from "@/components/store-design/productArt";

type Filter = "all" | "active" | "hidden" | "low";

const LOW_STOCK = 5;
const CATEGORIES_KEY = ["seller", "categories"] as const;

const RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const ROW_GRID =
  "md:grid md:grid-cols-[minmax(0,2.4fr)_1fr_1.2fr_1fr_auto] md:items-center md:gap-4";

/* ================================================================== */
/* Page                                                                */
/* ================================================================== */

export default function SellerProductsPage() {
  const { slug } = useParams<{ slug: string }>();
  const qc = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: qk.seller.products.list(),
    queryFn: sellerProducts.list,
  });

  // A failed categories request must never block the products page.
  const { data: categoryData } = useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: sellerCategories.list,
  });

  const products = useMemo(() => data ?? [], [data]);
  const { entitlements } = useEntitlements();
  // The server counts every product (hidden ones too) and enforces this limit.
  const productLimit = entitlements.maxProducts;
  const atLimit = !!data && products.length >= productLimit;
  const nearLimit = !!data && !atLimit && products.length >= productLimit - 3;
  const categories = useMemo(() => categoryData ?? [], [categoryData]);
  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const counts = useMemo(
    () => ({
      all: products.length,
      active: products.filter((p) => p.isActive).length,
      hidden: products.filter((p) => !p.isActive).length,
      low: products.filter((p) => p.stock <= LOW_STOCK).length,
    }),
    [products],
  );

  const perCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of products) {
      if (p.categoryId) m.set(p.categoryId, (m.get(p.categoryId) ?? 0) + 1);
    }
    return m;
  }, [products]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (filter === "active" && !p.isActive) return false;
      if (filter === "hidden" && p.isActive) return false;
      if (filter === "low" && p.stock > LOW_STOCK) return false;
      if (categoryId !== "all" && p.categoryId !== categoryId) return false;
      if (q && !`${p.name} ${p.slug}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, filter, categoryId, search]);

  const hasActiveFilters =
    filter !== "all" || categoryId !== "all" || search.trim() !== "";

  const clearFilters = () => {
    setFilter("all");
    setCategoryId("all");
    setSearch("");
  };

  const handleDelete = async (p: SellerProduct) => {
    if (!confirm(`Delete "${p.name}"? This can't be undone.`)) return;
    setBusyId(p.id);
    try {
      await sellerProducts.remove(p.id);
      qc.invalidateQueries({ queryKey: ["seller", "products"] });
    } catch (err) {
      alert(
        err instanceof ApiError ? err.message : "Could not delete product.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "hidden", label: "Hidden" },
    { id: "low", label: "Low stock" },
  ];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
            Products
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage everything you sell. Changes go live on your storefront.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className={cn(
              "inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium text-foreground transition hover:border-foreground/40 hover:bg-muted",
              RING,
            )}
          >
            <Plus className="h-4 w-4" />
            Add category
          </button>
          {atLimit ? (
            <button
              type="button"
              disabled
              aria-disabled
              title={`Your plan allows up to ${productLimit} products. Upgrade to add more.`}
              className="inline-flex h-11 cursor-not-allowed items-center gap-2 rounded-full bg-muted px-5 text-sm font-medium text-muted-foreground"
            >
              <Lock className="h-4 w-4" />
              Add product
            </button>
          ) : (
            <Link
              href={`/seller/${slug}/products/new`}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-white transition hover:bg-primary/90",
                RING,
              )}
            >
              <Plus className="h-4 w-4" />
              Add product
            </Link>
          )}
        </div>
      </header>

      {(atLimit || nearLimit) && (
        <UpgradeNotice
          title={
            atLimit
              ? `Product limit reached (${products.length}/${productLimit})`
              : `${products.length} of ${productLimit} products used`
          }
        >
          {atLimit
            ? "Upgrade your plan to add more products. Your existing products stay live."
            : "Upgrade to add more products when you need them."}
        </UpgradeNotice>
      )}

      {isLoading && (
        <div className="flex items-center justify-center rounded-2xl bg-card py-20 text-sm text-muted-foreground shadow-sm">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading products…
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {error instanceof ApiError
            ? error.message
            : "Could not load products."}
        </div>
      )}

      {!isLoading && !error && products.length === 0 && (
        <EmptyState slug={slug} />
      )}

      {!isLoading && !error && products.length > 0 && (
        <section className="rounded-2xl bg-card shadow-sm">
          {/* Toolbar */}
          <div className="space-y-3 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div
                role="group"
                aria-label="Filter by status"
                className="flex flex-wrap gap-1 rounded-full bg-muted p-1"
              >
                {filters.map((f) => {
                  const on = filter === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setFilter(f.id)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition",
                        RING,
                        on
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {f.label}
                      <span
                        className={cn(
                          "text-xs tabular-nums",
                          on ? "text-primary" : "text-muted-foreground",
                        )}
                      >
                        {counts[f.id]}
                      </span>
                    </button>
                  );
                })}
              </div>

              <label className="relative w-full sm:w-64">
                <span className="sr-only">Search products</span>
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products"
                  className="h-10 w-full rounded-full bg-muted pl-10 pr-4 text-sm outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
                />
              </label>
            </div>

            {/* Categories: only exist once the seller has added one */}
            {categories.length > 0 && (
              <div
                role="group"
                aria-label="Filter by category"
                className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
              >
                <CategoryChip
                  label="All categories"
                  active={categoryId === "all"}
                  onClick={() => setCategoryId("all")}
                />
                {categories.map((c) => (
                  <CategoryChip
                    key={c.id}
                    label={c.name}
                    imageUrl={c.imageUrl}
                    count={perCategory.get(c.id) ?? 0}
                    active={categoryId === c.id}
                    onClick={() => setCategoryId(c.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* List */}
          <div
            aria-hidden
            className={cn(
              "hidden border-y border-border bg-muted/50 px-5 py-2.5 text-xs font-medium text-muted-foreground",
              ROW_GRID,
              "md:grid",
            )}
          >
            <span>Product</span>
            <span>Price</span>
            <span>Stock</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>

          <ul className="divide-y divide-border border-t border-border md:border-t-0">
            {visible.map((p) => (
              <ProductRow
                key={p.id}
                p={p}
                slug={slug}
                categoryName={
                  p.categoryId
                    ? categoryById.get(p.categoryId)?.name
                    : undefined
                }
                busy={busyId === p.id}
                onDelete={() => handleDelete(p)}
              />
            ))}
          </ul>

          {visible.length === 0 && (
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <p className="text-sm text-muted-foreground">
                No products match your search or filters.
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className={cn(
                    "rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted",
                    RING,
                  )}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {dialogOpen && (
        <CategoryDialog
          existing={categories}
          onClose={() => setDialogOpen(false)}
          onSaved={(c) => {
            qc.invalidateQueries({ queryKey: CATEGORIES_KEY });
            qc.invalidateQueries({ queryKey: ["public-store"] });
            qc.invalidateQueries({ queryKey: ["store-design", "categories"] });
            setCategoryId(c.id);
            setDialogOpen(false);
          }}
        />
      )}
    </div>
  );
}

/* ================================================================== */
/* Product row                                                         */
/* ================================================================== */

function ProductRow({
  p,
  slug,
  categoryName,
  busy,
  onDelete,
}: {
  p: SellerProduct;
  slug: string;
  categoryName?: string;
  busy: boolean;
  onDelete: () => void;
}) {
  const stockTone =
    p.stock === 0 ? "red" : p.stock <= LOW_STOCK ? "amber" : "green";

  return (
    <li
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4 transition hover:bg-muted sm:px-5",
        ROW_GRID,
      )}
    >
      <div className="flex w-full min-w-0 items-center gap-3 md:w-auto">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted">
          <ProductArt
            product={
              {
                id: p.id,
                name: p.name,
                categoryId: p.categoryId,
                price: p.price,
                emoji: p.emoji,
                hue: p.hue,
                rating: 0,
                reviews: 0,
                sold: 0,
                stock: p.stock,
                createdAt: p.createdAt,
                imageUrl: p.mainImageUrl || p.imageUrls?.[0],
              } as never
            }
            emojiClassName="text-xl"
          />
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium">{p.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {categoryName && <span>{categoryName} · </span>}
            <span className="text-primary">/{p.slug}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-col">
        <span className="font-semibold tabular-nums">
          {formatPrice(p.price)}
        </span>
        {!!p.comparePrice && p.comparePrice > p.price && (
          <span className="text-xs tabular-nums text-muted-foreground line-through">
            {formatPrice(p.comparePrice)}
          </span>
        )}
      </div>

      <Pill tone={stockTone}>
        {p.stock === 0 ? "Out of stock" : `${p.stock} in stock`}
      </Pill>

      <Pill tone={p.isActive ? "green" : "neutral"}>
        {p.isActive ? "Active" : "Hidden"}
      </Pill>

      <div className="ml-auto flex justify-end gap-1.5">
        <Link
          href={productPreviewHref(slug, p)}
          target="_blank"
          rel="noreferrer"
          aria-label={`${p.isActive ? "View" : "Preview"} ${p.name}`}
          title={
            p.isActive
              ? "View on your store"
              : "Preview (hidden, only you can see it)"
          }
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:border-primary hover:bg-primary/90 hover:text-white",
            RING,
          )}
        >
          <Eye className="h-4 w-4" />
        </Link>
        <Link
          href={`/seller/${slug}/products/${p.id}/edit`}
          aria-label={`Edit ${p.name}`}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:border-primary hover:bg-primary/90 hover:text-white",
            RING,
          )}
        >
          <Pencil className="h-4 w-4" />
        </Link>
        <button
          type="button"
          aria-label={`Delete ${p.name}`}
          onClick={onDelete}
          disabled={busy}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:border-red-600 hover:bg-red-600 hover:text-white disabled:opacity-40",
            RING,
          )}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      </div>
    </li>
  );
}

function Pill({
  tone,
  children,
}: {
  tone: "green" | "amber" | "red" | "neutral";
  children: React.ReactNode;
}) {
  const styles = {
    green: ["bg-emerald-100 text-emerald-900", "bg-emerald-600"],
    amber: ["bg-amber-100 text-amber-900", "bg-amber-600"],
    red: ["bg-red-100 text-red-900", "bg-red-600"],
    neutral: ["bg-muted text-foreground", "bg-neutral-500"],
  }[tone];
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        styles[0],
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", styles[1])} />
      {children}
    </span>
  );
}

/* ================================================================== */
/* Category chip                                                       */
/* ================================================================== */

function CategoryChip({
  label,
  imageUrl,
  count,
  active,
  onClick,
}: {
  label: string;
  imageUrl?: string | null;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-2 rounded-full border pr-3.5 text-sm font-medium transition",
        imageUrl ? "pl-1.5" : "pl-3.5",
        RING,
        active
          ? "border-primary bg-primary text-white"
          : "border-border bg-card text-foreground hover:border-foreground/40 hover:bg-muted",
      )}
    >
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          className="h-6 w-6 rounded-full object-cover"
        />
      )}
      {label}
      {count !== undefined && (
        <span
          className={cn(
            "text-xs tabular-nums",
            active ? "text-white/80" : "text-muted-foreground",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/* ================================================================== */
/* Empty state                                                         */
/* ================================================================== */

function EmptyState({ slug }: { slug: string }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-card px-6 py-16 text-center shadow-sm">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Package className="h-6 w-6 text-muted-foreground" />
      </span>
      <div>
        <p className="text-lg font-semibold">No products yet</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Add your first product and it&apos;ll appear on your storefront
          immediately.
        </p>
      </div>
      <Link
        href={`/seller/${slug}/products/new`}
        className={cn(
          "inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-white transition hover:bg-primary/90",
          RING,
        )}
      >
        <Plus className="h-4 w-4" />
        Add your first product
      </Link>
    </div>
  );
}
