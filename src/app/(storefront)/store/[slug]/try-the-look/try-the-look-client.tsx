"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Loader2,
  Plus,
  ShoppingBag,
} from "lucide-react";
import { fetchPublicStore } from "@/lib/store-design/api";
import type { PublicStoreData } from "@/lib/store-design/server";
import { useCart } from "@/lib/store-design/cart";
import { formatPrice, loadFont, themeVars } from "@/lib/store-design/utilts";
import type { Product } from "@/lib/store-design/types";
import {
  comboLabel,
  effectivePrice,
  findCombination,
  initialSelection,
  selectValue,
  valueState,
  variantOptions,
  type Selection,
  type VariantProduct,
} from "@/lib/store-design/variants";
import {
  publicLooks,
  publicLooksKey,
  type PublicLookCard,
  type PublicLookItem,
} from "@/lib/api/looks-public";
import { cn } from "@/lib/utils";

/* ------------------------------ one product ----------------------------- */

function ItemRow({
  item,
  product,
  href,
  sel,
  onPick,
  canAdd,
  justAdded,
  onAdd,
}: {
  item: PublicLookItem;
  product?: Product;
  href: string;
  sel: Selection;
  onPick: (optionId: string, valueId: string) => void;
  canAdd: boolean;
  justAdded: boolean;
  onAdd: () => void;
}) {
  const vp = product as VariantProduct | undefined;
  const opts = vp ? variantOptions(vp) : [];
  const combo = vp && opts.length ? findCombination(vp, sel) : null;
  const price = vp && opts.length ? effectivePrice(vp, combo) : item.price;

  return (
    <li
      className="border-b py-3 lg:py-4"
      style={{ borderColor: "var(--s-border)" }}
    >
      <div className="flex items-center gap-3">
        <Link
          href={href}
          className="group flex min-w-0 flex-1 items-center gap-3 lg:gap-4"
        >
          <div
            className="h-14 w-14 shrink-0 overflow-hidden rounded-xl lg:h-[76px] lg:w-[76px]"
            style={{ background: "var(--s-surface)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl}
              alt={item.name}
              loading="lazy"
              className={cn(
                "h-full w-full object-cover transition duration-500 group-hover:scale-105",
                !item.inStock && "opacity-50",
              )}
            />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            {!item.inStock && (
              <span
                className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                style={{ background: "var(--s-text)", color: "var(--s-bg)" }}
              >
                Sold out
              </span>
            )}
            <p className="line-clamp-2 text-sm font-medium leading-snug">
              {item.name}
            </p>
            <p className="text-sm">
              <span className="font-semibold">{formatPrice(price)}</span>
              {item.comparePrice && item.comparePrice > price ? (
                <span
                  className="ml-2 text-xs line-through"
                  style={{ color: "var(--s-muted)" }}
                >
                  {formatPrice(item.comparePrice)}
                </span>
              ) : null}
            </p>
          </div>
        </Link>

        {/* + adds just this product (with the size/colour picked below) */}
        <button
          type="button"
          disabled={!canAdd}
          onClick={onAdd}
          aria-label={
            justAdded ? `${item.name} added to bag` : `Add ${item.name} to bag`
          }
          title="Add to bag"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition active:scale-90 disabled:opacity-30"
          style={
            justAdded
              ? {
                  background: "var(--s-primary)",
                  color: "var(--s-on-primary)",
                  borderColor: "var(--s-primary)",
                }
              : { borderColor: "var(--s-border)" }
          }
        >
          {justAdded ? (
            <Check className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </button>
      </div>

      {vp && item.inStock && opts.length > 0 && (
        <div className="mt-2 space-y-2 pl-[68px] lg:mt-3 lg:pl-[92px]">
          {opts.map((o) => (
            <div key={o.id} className="flex flex-wrap items-center gap-1.5">
              <span
                className="w-12 shrink-0 text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--s-muted)" }}
              >
                {o.name}
              </span>
              {o.values.map((v) => {
                const st = valueState(vp, sel, o.id, v.id);
                const on = sel[o.id] === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={st === "unavailable"}
                    onClick={() => onPick(o.id, v.id)}
                    className={cn(
                      "inline-flex h-7 min-w-7 items-center justify-center rounded-full border px-2.5 text-xs transition",
                      st === "soldout" && "line-through opacity-50",
                      st === "unavailable" && "cursor-not-allowed opacity-25",
                    )}
                    style={
                      on
                        ? {
                            background: "var(--s-text)",
                            color: "var(--s-bg)",
                            borderColor: "var(--s-text)",
                          }
                        : { borderColor: "var(--s-border)" }
                    }
                  >
                    {v.colorHex && (
                      <span
                        className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full border border-black/10"
                        style={{ background: v.colorHex }}
                      />
                    )}
                    {v.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </li>
  );
}

/* ------------------------------ right panel ----------------------------- */

function LookPanel({
  look,
  products,
  storeHref,
  getSel,
  setSel,
}: {
  look: PublicLookCard;
  products: Product[];
  storeHref: string;
  getSel: (p: VariantProduct) => Selection;
  setSel: (p: VariantProduct, optionId: string, valueId: string) => void;
}) {
  const cart = useCart();
  const [result, setResult] = useState<{
    added: number;
    skipped: number;
  } | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const { data, isLoading, isError } = useQuery({
    queryKey: publicLooksKey.one(look.id),
    queryFn: () => publicLooks.get(look.id),
    staleTime: 30_000,
    retry: false,
  });

  const items = data?.items ?? [];
  const byId = (id: string) => products.find((p) => p.id === id);

  // Price of what is currently picked (chosen variant where there is one).
  const unitPrice = (it: PublicLookItem) => {
    const p = byId(it.productId) as VariantProduct | undefined;
    if (!p || variantOptions(p).length === 0) return it.price;
    return effectivePrice(p, findCombination(p, getSel(p)));
  };
  const total = items.reduce(
    (sum, it) => sum + (it.inStock ? unitPrice(it) : 0),
    0,
  );
  const buyable = items.filter((it) => it.inStock);

  // What would be added for this item right now (null = can't be bought).
  const planFor = (it: PublicLookItem) => {
    const p = byId(it.productId) as VariantProduct | undefined;
    if (!p || !it.inStock) return null;
    if (variantOptions(p).length > 0) {
      const c = findCombination(p, getSel(p));
      if (!c || c.stock <= 0) return null;
      return { p, c };
    }
    if (p.stock <= 0) return null;
    return { p, c: null };
  };

  const addOne = (it: PublicLookItem): boolean => {
    const plan = planFor(it);
    if (!plan) return false;
    if (plan.c) {
      cart.addItem(plan.p, 1, {
        id: plan.c.id,
        label: comboLabel(plan.p, plan.c),
        price: effectivePrice(plan.p, plan.c),
        sku: plan.c.sku,
        imageUrl: plan.c.imageUrls?.[0],
      });
    } else {
      cart.addItem(plan.p, 1);
    }
    return true;
  };

  const onAddOne = (it: PublicLookItem) => {
    if (!addOne(it)) return;
    setJustAdded(it.productId);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setJustAdded(null), 1600);
  };

  const addAll = () => {
    let added = 0;
    let skipped = 0;
    for (const it of buyable) {
      if (addOne(it)) added++;
      else skipped++;
    }
    setResult({ added, skipped });
  };

  return (
    // Everything scrolls together: header, products, then the full-look button.
    <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 [scrollbar-width:thin] lg:px-6 lg:pt-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2
          className="text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: "var(--s-muted)" }}
        >
          In this look
        </h2>
        {!isLoading && !isError && (
          <span className="text-xs" style={{ color: "var(--s-muted)" }}>
            {items.length} item{items.length === 1 ? "" : "s"}
          </span>
        )}
      </div>
      <p className="mt-1 truncate text-base font-semibold">{look.title}</p>

      {isLoading && (
        <div
          className="flex justify-center py-12"
          style={{ color: "var(--s-muted)" }}
        >
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}
      {isError && (
        <p className="py-10 text-sm" style={{ color: "var(--s-muted)" }}>
          Couldn&apos;t load this look&apos;s products.
        </p>
      )}

      {!isLoading && !isError && (
        <>
          <ul className="mt-2">
            {items.map((it) => {
              const p = byId(it.productId) as VariantProduct | undefined;
              return (
                <ItemRow
                  key={it.productId}
                  item={it}
                  product={p}
                  href={`${storeHref}/products/${it.productId}`}
                  sel={p ? getSel(p) : {}}
                  onPick={(o, v) => p && setSel(p, o, v)}
                  canAdd={planFor(it) !== null}
                  justAdded={justAdded === it.productId}
                  onAdd={() => onAddOne(it)}
                />
              );
            })}
          </ul>

          {items.length > 0 && (
            <div className="space-y-3 pt-4">
              <div className="flex items-baseline justify-between text-sm">
                <span style={{ color: "var(--s-muted)" }}>Full look</span>
                <span className="text-lg font-semibold">
                  {formatPrice(total)}
                </span>
              </div>

              {result ? (
                <Link
                  href={`${storeHref}/cart`}
                  className="flex h-12 w-full items-center justify-center gap-2 px-3 text-sm font-semibold transition active:scale-[0.99]"
                  style={{
                    background: "var(--s-primary)",
                    color: "var(--s-on-primary)",
                  }}
                >
                  <Check className="h-4 w-4" />
                  {result.added} added
                  {result.skipped ? `, ${result.skipped} unavailable` : ""} ·
                  View bag
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={buyable.length === 0}
                  onClick={addAll}
                  className="flex h-12 w-full items-center justify-center gap-2 px-3 text-sm font-semibold transition active:scale-[0.99] disabled:opacity-40"
                  style={{
                    background: "var(--s-primary)",
                    color: "var(--s-on-primary)",
                  }}
                >
                  Add full look to bag <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* --------------------------------- page --------------------------------- */

export default function TryTheLookClient({
  slug,
  initialData,
}: {
  slug: string;
  initialData: PublicStoreData;
}) {
  const qc = useQueryClient();
  const cart = useCart();
  const { data: storeData } = useQuery({
    queryKey: ["public-store", slug],
    queryFn: () => fetchPublicStore(slug),
    initialData,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });
  const store = storeData ?? initialData;
  const design = store.design;
  const storeHref = `/store/${slug}`;
  useEffect(() => loadFont(design.fontFamily), [design.fontFamily]);

  const { data: looksData, isLoading } = useQuery({
    queryKey: publicLooksKey.list(slug, "", 30),
    queryFn: () => publicLooks.list({ store: slug, limit: 30 }),
    staleTime: 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const looks = useMemo(() => looksData ?? [], [looksData]);
  const n = looks.length;

  // No per-frame JavaScript while scrolling. The page scrolls natively; an
  // IntersectionObserver tells us which look is in the middle of the screen
  // (it only fires when that changes), and the models glide to their new
  // places with plain CSS transitions that run on the GPU.
  const [active, setActive] = useState(0);
  const idx = Math.min(active, Math.max(n - 1, 0));
  const current = looks[idx];
  const wrap = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const anchors = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (n === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const i = Number((e.target as HTMLElement).dataset.i);
          if (Number.isFinite(i)) startTransition(() => setActive(i));
        }
      },
      // A look is "in focus" while its screen crosses a thin band at the
      // vertical middle of the viewport. Only one can do that at a time.
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    anchors.current.slice(0, n).forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [n]);

  const goTo = useCallback(
    (i: number) => {
      const c = wrap.current;
      const s = stage.current;
      if (!c || !s) return;
      const top = c.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: top + Math.max(0, Math.min(n - 1, i)) * s.offsetHeight,
        behavior: "smooth",
      });
    },
    [n],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) return;
      if (e.key === "ArrowRight") goTo(active + 1);
      else if (e.key === "ArrowLeft") goTo(active - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, active]);

  // Load the neighbours' products ahead of time so the panel swaps instantly.
  useEffect(() => {
    for (const l of [looks[active - 1], looks[active + 1]]) {
      if (!l) continue;
      void qc.prefetchQuery({
        queryKey: publicLooksKey.one(l.id),
        queryFn: () => publicLooks.get(l.id),
        staleTime: 30_000,
      });
    }
  }, [qc, looks, active]);

  // Chosen size/colour per product, shared by the row and the total.
  const [sels, setSels] = useState<Record<string, Selection>>({});
  const getSel = useCallback(
    (prod: VariantProduct) => sels[prod.id] ?? initialSelection(prod),
    [sels],
  );
  const setSel = useCallback(
    (prod: VariantProduct, optionId: string, valueId: string) =>
      setSels((s) => ({
        ...s,
        [prod.id]: selectValue(
          prod,
          s[prod.id] ?? initialSelection(prod),
          optionId,
          valueId,
        ),
      })),
    [],
  );

  return (
    <div
      style={{
        ...themeVars(design),
        background: "var(--s-bg)",
        color: "var(--s-text)",
      }}
      className="storefront min-h-screen text-[15px] leading-normal"
    >
      {/* Header: logo left, nav + bag right */}
      <header
        className="fixed inset-x-0 top-0 z-30"
        style={{ background: "var(--s-bg)" }}
      >
        <div className="flex h-14 items-center justify-between px-5 sm:px-8">
          <Link href={storeHref} className="flex min-w-0 items-center gap-2.5">
            {design.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={design.logoUrl}
                alt={design.storeName}
                className="h-7 w-auto"
              />
            ) : (
              <span className="truncate text-base font-bold tracking-tight">
                {design.storeName}
              </span>
            )}
          </Link>
          <nav className="flex items-center gap-5 text-xs font-medium sm:gap-7">
            <Link
              href={storeHref}
              className="opacity-70 transition hover:opacity-100"
            >
              Home
            </Link>
            <span
              className="border-b pb-0.5"
              style={{ borderColor: "var(--s-text)" }}
            >
              Try the Look
            </span>
            <Link
              href={`${storeHref}/cart`}
              aria-label="Open bag"
              className="relative flex h-9 w-9 items-center justify-center"
            >
              <ShoppingBag className="h-5 w-5" />
              {cart.count > 0 && (
                <span
                  className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
                  style={{
                    background: "var(--s-primary)",
                    color: "var(--s-on-primary)",
                  }}
                >
                  {cart.count}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </header>

      {isLoading && (
        <div
          className="flex min-h-screen items-center justify-center"
          style={{ color: "var(--s-muted)" }}
        >
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}

      {!isLoading && n === 0 && (
        <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            Try the Look.
          </h1>
          <p className="text-sm" style={{ color: "var(--s-muted)" }}>
            This store has no looks to show right now.
          </p>
          <Link href={storeHref} className="sf-btn">
            Back to store
          </Link>
        </div>
      )}

      {n > 0 && current && (
        <div
          ref={wrap}
          className="relative"
          style={{ height: `${n * 100}svh` }}
        >
          {/* One invisible full screen per look; the observer watches these */}
          {looks.map((l, i) => (
            <div
              key={l.id}
              ref={(el) => {
                anchors.current[i] = el;
              }}
              data-i={i}
              aria-hidden
              className="pointer-events-none absolute inset-x-0"
              style={{ top: `${i * 100}svh`, height: "100svh" }}
            />
          ))}

          {/* Sticky stage: stays on screen while the page scrolls */}
          <div
            ref={stage}
            className="sticky top-0 h-[100svh] overflow-hidden pt-14"
          >
            <div className="flex h-full flex-col lg:flex-row">
              {/* LEFT: models */}
              <div className="relative h-[58%] min-w-0 overflow-hidden lg:h-full lg:flex-1">
                <div className="absolute left-4 top-2 z-20 sm:left-8 sm:top-8">
                  <h1 className="text-2xl font-semibold tracking-tight sm:text-5xl">
                    Try the Look.
                  </h1>
                  <p
                    className="mt-1.5 hidden text-xs sm:block"
                    style={{ color: "var(--s-muted)" }}
                  >
                    Scroll to see the next look. Tap a piece to shop it.
                  </p>
                </div>

                <div className="absolute inset-x-0 bottom-[10%] top-[13%] sm:bottom-[9%] sm:top-[24%] lg:top-[22%]">
                  {looks.map((l, i) => {
                    const d = i - idx;
                    const ad = Math.abs(d);
                    return (
                      <div
                        key={l.id}
                        role="button"
                        tabIndex={d === 0 ? -1 : 0}
                        aria-label={`Show look: ${l.title}`}
                        onClick={() => d !== 0 && goTo(i)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && d !== 0 && goTo(i)
                        }
                        className={cn(
                          "absolute bottom-0 left-1/2 h-full w-[56%] will-change-transform transition-[transform,opacity] duration-500 ease-out motion-reduce:transition-none sm:w-[42%] lg:w-[30%]",
                          d !== 0 ? "cursor-pointer" : "cursor-default",
                        )}
                        style={{
                          transformOrigin: "50% 100%",
                          transform: `translate3d(${-50 + d * 82}%,0,0) scale(${Math.max(0.55, 1 - ad * 0.22)})`,
                          opacity: ad > 1.5 ? 0 : ad === 0 ? 1 : 0.5,
                          zIndex: 10 - ad,
                          pointerEvents: ad > 1.5 ? "none" : "auto",
                        }}
                      >
                        {ad <= 2 && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={l.modelImageUrl}
                            alt={l.title}
                            draggable={false}
                            decoding="async"
                            className="h-full w-full select-none object-contain object-bottom"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="absolute bottom-2 left-4 z-20 flex items-center gap-3 text-xs sm:bottom-4 sm:left-8">
                  <span className="tabular-nums font-medium">
                    {String(idx + 1).padStart(2, "0")} /{" "}
                    {String(n).padStart(2, "0")}
                  </span>
                  <span
                    className="hidden max-w-[40ch] truncate sm:inline"
                    style={{ color: "var(--s-muted)" }}
                  >
                    {current.title}
                  </span>
                  {idx < n - 1 && (
                    <span
                      className="sm:hidden"
                      style={{ color: "var(--s-muted)" }}
                    >
                      Scroll for next look
                    </span>
                  )}
                </div>
                {idx < n - 1 && (
                  <button
                    type="button"
                    onClick={() => goTo(idx + 1)}
                    aria-label="Next look"
                    className="absolute bottom-1.5 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border transition hover:scale-105 sm:right-8"
                    style={{
                      borderColor: "var(--s-border)",
                      background: "var(--s-bg)",
                    }}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* RIGHT: products worn in the look in focus */}
              <aside
                className="flex h-[42%] min-h-0 flex-col border-t lg:h-full lg:w-[400px] lg:border-l lg:border-t-0"
                style={{
                  borderColor: "var(--s-border)",
                  background: "var(--s-surface)",
                }}
              >
                <LookPanel
                  key={current.id}
                  look={current}
                  products={store.products}
                  storeHref={storeHref}
                  getSel={getSel}
                  setSel={setSel}
                />
              </aside>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
