"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, X } from "lucide-react";
import { ApiError } from "@/lib/api/http";
import { sellerProducts } from "@/lib/api/products";
import { looksKey, sellerLooks, type Look } from "@/lib/api/looks";
import { ProductForm } from "@/app/(seller)/seller/[slug]/products/ProductForm";
import { cn } from "@/lib/utils";

export type DialogMode = { kind: "add" } | { kind: "replace"; productId: string };

/**
 * Add a product to a look. Two tabs:
 *  - Choose Existing: a published product, only linked (never copied).
 *  - Add New: the normal ProductForm; the product is created as a regular
 *    published product and then linked.
 * In replace mode only "Choose Existing" is offered.
 */
export function AddProductDialog({
  look,
  mode,
  onClose,
  onDone,
}: {
  look: Look;
  mode: DialogMode;
  onClose: () => void;
  onDone: (look: Look) => void;
}) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"existing" | "new">("existing");
  const [q, setQ] = useState("");

  const { data: products, isLoading } = useQuery({
    queryKey: ["seller", "products", "list"],
    queryFn: sellerProducts.list,
  });

  const inLook = useMemo(
    () => new Set(look.items.map((i) => i.productId)),
    [look.items],
  );
  const choices = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (products ?? []).filter(
      (p) =>
        p.isActive &&
        !inLook.has(p.id) &&
        (!term || p.name.toLowerCase().includes(term)),
    );
  }, [products, inLook, q]);

  const finish = (l: Look) => {
    qc.setQueryData(looksKey.detail(l.id), l);
    void qc.invalidateQueries({ queryKey: looksKey.list() });
    onDone(l);
  };

  const pick = useMutation({
    mutationFn: (productId: string) =>
      mode.kind === "replace"
        ? sellerLooks.replaceItem(look.id, mode.productId, productId)
        : sellerLooks.addExisting(look.id, productId),
    onSuccess: finish,
  });
  const pickError = pick.error
    ? pick.error instanceof ApiError
      ? pick.error.message
      : "Could not add the product. Please try again."
    : null;

  const full = mode.kind === "add" && look.items.length >= look.maxItems;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={mode.kind === "replace" ? "Replace product" : "Add product"}
    >
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-background sm:rounded-2xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-base font-semibold">
            {mode.kind === "replace" ? "Replace product" : "Add a product"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {mode.kind === "add" && (
          <div className="flex gap-1 border-b px-5 pt-2">
            {(
              [
                ["existing", "Choose existing"],
                ["new", "Add new"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "-mb-px border-b-2 px-4 py-2 text-sm font-medium",
                  tab === id
                    ? "border-foreground"
                    : "border-transparent text-muted-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {full ? (
            <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
              This look already has {look.maxItems} products, the maximum.
              Remove one to add another.
            </p>
          ) : tab === "existing" || mode.kind === "replace" ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search your published products"
                  className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm"
                />
              </div>
              {pickError && (
                <p role="alert" className="text-xs font-medium text-red-600">
                  {pickError}
                </p>
              )}
              {isLoading && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Loading products…
                </p>
              )}
              {!isLoading && choices.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No published products available to add.
                  {mode.kind === "add" && " Try the “Add new” tab."}
                </p>
              )}
              <ul className="grid gap-2 sm:grid-cols-2">
                {choices.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      disabled={pick.isPending}
                      onClick={() => pick.mutate(p.id)}
                      className="flex w-full items-center gap-3 rounded-xl border p-2 text-left transition hover:bg-muted disabled:opacity-60"
                    >
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {p.mainImageUrl || p.imageUrls?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.mainImageUrl || p.imageUrls[0]}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ৳{p.price} · {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
                        </p>
                      </div>
                      {pick.isPending && pick.variables === p.id && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div>
              <p className="mb-4 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
                This creates a normal product. It is published in your store and
                on the ShopBD marketplace, then connected to this look. It
                counts toward your plan&apos;s product limit.
              </p>
              <ProductForm
                onCancel={onClose}
                onCreate={async (payload) => finish(await sellerLooks.addNew(look.id, payload))}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
