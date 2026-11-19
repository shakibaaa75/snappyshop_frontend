"use client";

import {
  BENTO_TEMPLATES,
  type HomeSection,
  RAIL_PRODUCT_TEMPLATES,
  sectionMeta,
  usesDropLayout,
  usesYokaiLayout,
} from "@/lib/store-design/types";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveSectionProducts } from "@/lib/store-design/utilts";
import { Block, Heading, Link, Placeholder } from "./blocks";
import { useRailScroll } from "./category-rail";
import { ProductCard } from "./product-card";
import { ProductGrid } from "./product-grid";
import { muted } from "./tokens";
import { type Ctx } from "./types";

/**
 * Product section for the Bento templates: a centered heading with category
 * tabs, as on a campaign page. Tabs only appear when at least two categories
 * have products; picking one re-runs the section's own sort and limit on that
 * category, so "New arrivals" stays "the newest in Shoes", not a cut-down list.
 */
function CampaignProducts({
  ctx,
  section,
}: {
  ctx: Ctx;
  section: HomeSection;
}) {
  const { d, mobile, interactive, products, categories } = ctx;
  const [active, setActive] = useState("all");
  const base = useMemo(
    () => resolveSectionProducts(section, products),
    [section, products],
  );
  const tabs = useMemo(() => {
    const pool = section.source === "manual" ? base : products;
    const counts = new Map<string, number>();
    pool.forEach((p) =>
      counts.set(p.categoryId, (counts.get(p.categoryId) ?? 0) + 1),
    );
    return categories
      .filter((c) => counts.has(c.id))
      .sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0))
      .slice(0, 5);
  }, [section.source, base, products, categories]);

  const showTabs = tabs.length >= 2;
  const current =
    showTabs && tabs.some((c) => c.id === active) ? active : "all";
  const list = useMemo(() => {
    if (current === "all") return base;
    if (section.source === "manual") {
      return base.filter((p) => p.categoryId === current);
    }
    return resolveSectionProducts(
      section,
      products.filter((p) => p.categoryId === current),
    );
  }, [current, base, section, products]);

  const tabClass =
    "shrink-0 border-b py-1 text-[11px] font-medium uppercase tracking-[0.08em] transition-colors";
  return (
    <Block ctx={ctx}>
      <div className={cn("text-center", mobile ? "mb-5" : "mb-8")}>
        <h2
          className={cn(
            "font-normal leading-tight tracking-tight",
            mobile ? "text-2xl" : "text-[32px]",
          )}
        >
          {section.title || sectionMeta[section.id].label}
        </h2>
        {showTabs && (
          <div
            role="group"
            aria-label={`${section.title || sectionMeta[section.id].label} categories`}
            className={cn(
              "mt-4 flex gap-x-6 gap-y-2",
              mobile
                ? "no-scrollbar -mx-4 flex-nowrap justify-start overflow-x-auto px-4"
                : "flex-wrap justify-center",
            )}
          >
            {[{ id: "all", name: "All" }, ...tabs].map((t) => {
              const on = t.id === current;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setActive(t.id)}
                  className={tabClass}
                  style={{
                    color: on ? "var(--s-text)" : "var(--s-muted)",
                    borderColor: on ? "var(--s-text)" : "transparent",
                  }}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <ProductGrid products={list} ctx={ctx} />
      {list.length > 0 && (
        <div className="mt-8 text-center">
          <Link
            on={interactive}
            href={`/store/${d.storeSlug}/products`}
            className="inline-block border-b pb-0.5 text-[11px] font-medium uppercase tracking-[0.08em]"
            style={{ borderColor: "var(--s-text)" }}
          >
            View all
          </Link>
        </div>
      )}
    </Block>
  );
}
/**
 * Product section for the Casual template: heading on the left, category tabs
 * and prev/next arrows on the right, then one sideways-scrolling row of
 * products with a peek of the next one.
 */
function ProductRail({ ctx, section }: { ctx: Ctx; section: HomeSection }) {
  const { d, mobile, interactive, products, categories } = ctx;
  const [active, setActive] = useState("all");
  const base = useMemo(
    () => resolveSectionProducts(section, products),
    [section, products],
  );
  const tabs = useMemo(() => {
    const pool = section.source === "manual" ? base : products;
    const counts = new Map<string, number>();
    pool.forEach((p) =>
      counts.set(p.categoryId, (counts.get(p.categoryId) ?? 0) + 1),
    );
    return categories
      .filter((c) => counts.has(c.id))
      .sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0))
      .slice(0, 5);
  }, [section.source, base, products, categories]);

  const showTabs = tabs.length >= 2;
  const current =
    showTabs && tabs.some((c) => c.id === active) ? active : "all";
  const list = useMemo(() => {
    if (current === "all") return base;
    if (section.source === "manual") {
      return base.filter((p) => p.categoryId === current);
    }
    return resolveSectionProducts(
      section,
      products.filter((p) => p.categoryId === current),
    );
  }, [current, base, section, products]);

  const { ref, edge, sync, go } = useRailScroll(`${list.length}-${mobile}`);
  useEffect(() => {
    ref.current?.scrollTo({ left: 0 });
  }, [current, ref]);

  const gap = mobile ? 8 : 10;
  const cols = mobile ? 2.3 : Math.min(5, Math.max(3, d.productsPerRow)) + 0.3;
  const title = section.title || sectionMeta[section.id].label;
  const arrowBtn =
    "flex h-8 w-8 items-center justify-center border transition-opacity disabled:opacity-30";
  const arrowStyle: CSSProperties = {
    borderColor: "var(--s-border)",
    color: "var(--s-text)",
  };

  return (
    <Block ctx={ctx}>
      <div
        className={cn(
          "mb-4 flex gap-x-6 gap-y-3",
          mobile ? "flex-col" : "items-end justify-between",
        )}
      >
        <h2
          className={cn(
            "font-semibold leading-none tracking-tight",
            mobile ? "text-xl" : "text-2xl",
          )}
        >
          {title}
        </h2>
        <div className="flex min-w-0 items-center gap-5">
          {showTabs && (
            <div
              role="group"
              aria-label={`${title} categories`}
              className="no-scrollbar flex min-w-0 gap-5 overflow-x-auto"
            >
              {[{ id: "all", name: "All" }, ...tabs].map((t) => {
                const on = t.id === current;
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setActive(t.id)}
                    className="shrink-0 border-b py-0.5 text-xs font-medium transition-colors"
                    style={{
                      color: on ? "var(--s-text)" : "var(--s-muted)",
                      borderColor: on ? "var(--s-text)" : "transparent",
                    }}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          )}
          {!mobile && (
            <div className="flex shrink-0 gap-1.5">
              <button
                type="button"
                aria-label="Previous products"
                disabled={edge.start}
                onClick={() => go(-1)}
                className={arrowBtn}
                style={arrowStyle}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next products"
                disabled={edge.end}
                onClick={() => go(1)}
                className={arrowBtn}
                style={arrowStyle}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      {list.length === 0 ? (
        <Placeholder>No products to show yet.</Placeholder>
      ) : (
        <div
          ref={ref}
          onScroll={sync}
          className={cn(
            "no-scrollbar flex snap-x snap-mandatory overflow-x-auto [-webkit-overflow-scrolling:touch]",
            mobile && "-mx-4 scroll-px-4 px-4",
          )}
          style={{ gap }}
        >
          {list.map((p, i) => (
            <div
              key={p.id}
              className="shrink-0 snap-start"
              style={{
                width: `min(280px, calc((100% - ${gap * (Math.ceil(cols) - 1)}px) / ${cols}))`,
                minWidth: mobile ? 140 : 170,
              }}
            >
              <ProductCard p={p} ctx={ctx} index={i} />
            </div>
          ))}
        </div>
      )}
      {list.length > 0 && (
        <div className="mt-6">
          <Link
            on={interactive}
            href={`/store/${d.storeSlug}/products`}
            className="inline-block border-b pb-0.5 text-xs font-medium"
            style={{ borderColor: "var(--s-text)" }}
          >
            Shop all
          </Link>
        </div>
      )}
    </Block>
  );
}
/**
 * Drop-style product section: a centered heading over a flat grid, with a
 * square "View all" button underneath.
 */
function DropProducts({ ctx, section }: { ctx: Ctx; section: HomeSection }) {
  const { d, interactive } = ctx;
  const list = resolveSectionProducts(section, ctx.products);
  const title = section.title || sectionMeta[section.id].label;
  return (
    <Block ctx={ctx}>
      <div className="mb-6 text-center">
        <h2 className="uppercase leading-tight tracking-[0.16em]">{title}</h2>
      </div>
      <ProductGrid products={list} ctx={ctx} />
      {list.length > 0 && (
        <div className="mt-8 flex justify-center">
          <Link
            on={interactive}
            href={`/store/${d.storeSlug}/products`}
            className="inline-flex h-11 items-center border px-9 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors hover:bg-[var(--s-text)] hover:text-[var(--s-bg)]"
            style={{ borderColor: "var(--s-text)" }}
          >
            View all
          </Link>
        </div>
      )}
    </Block>
  );
}
/**
 * Yokai product rail: centered bold heading with a muted line under it, a
 * sideways-scrolling row of square cards with a peek of the next one, and a
 * square "View all" button.
 */
function YokaiProducts({ ctx, section }: { ctx: Ctx; section: HomeSection }) {
  const { d, mobile, interactive } = ctx;
  const list = useMemo(
    () => resolveSectionProducts(section, ctx.products),
    [section, ctx.products],
  );
  const { ref, edge, sync, go } = useRailScroll(`${list.length}-${mobile}`);
  const gap = mobile ? 8 : 12;
  const cols = mobile ? 2.2 : Math.min(5, Math.max(3, d.productsPerRow)) + 0.25;
  const title = section.title || sectionMeta[section.id].label;
  const arrow =
    "absolute top-[34%] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center border shadow-sm sm:flex";
  const arrowStyle: CSSProperties = {
    background: "var(--s-bg)",
    color: "var(--s-text)",
    borderColor: "var(--s-border)",
  };
  return (
    <Block ctx={ctx}>
      <div className="mb-6 text-center">
        <h2 className="font-bold uppercase leading-tight tracking-[0.04em]">
          {title}
        </h2>
        {section.subtitle && (
          <p className="mx-auto mt-2 max-w-xl text-sm" style={muted}>
            {section.subtitle}
          </p>
        )}
      </div>
      {list.length === 0 ? (
        <Placeholder>No products to show yet.</Placeholder>
      ) : (
        <div className="relative">
          <div
            ref={ref}
            onScroll={sync}
            className={cn(
              "no-scrollbar flex snap-x snap-mandatory overflow-x-auto [-webkit-overflow-scrolling:touch]",
              mobile && "-mx-4 scroll-px-4 px-4",
            )}
            style={{ gap }}
          >
            {list.map((p, i) => (
              <div
                key={p.id}
                className="shrink-0 snap-start"
                style={{
                  width: `calc((100% - ${gap * (Math.ceil(cols) - 1)}px) / ${cols})`,
                  minWidth: mobile ? 140 : 170,
                }}
              >
                <ProductCard p={p} ctx={ctx} index={i} />
              </div>
            ))}
          </div>
          {!mobile && !edge.start && (
            <button
              type="button"
              aria-label="Previous products"
              onClick={() => go(-1)}
              className={cn(arrow, "left-2")}
              style={arrowStyle}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {!mobile && !edge.end && (
            <button
              type="button"
              aria-label="Next products"
              onClick={() => go(1)}
              className={cn(arrow, "right-2")}
              style={arrowStyle}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
      )}
      {list.length > 0 && (
        <div className="mt-8 flex justify-center">
          <Link
            on={interactive}
            href={`/store/${d.storeSlug}/products`}
            className="inline-flex h-11 items-center px-9 text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{
              background: "var(--s-primary)",
              color: "var(--s-on-primary)",
            }}
          >
            View all
          </Link>
        </div>
      )}
    </Block>
  );
}
export function ProductsSection({ ctx, section }: { ctx: Ctx; section: HomeSection }) {
  if (usesYokaiLayout(ctx.d)) {
    return <YokaiProducts ctx={ctx} section={section} />;
  }
  if (usesDropLayout(ctx.d)) {
    return <DropProducts ctx={ctx} section={section} />;
  }
  if (BENTO_TEMPLATES.includes(ctx.d.template)) {
    return <CampaignProducts ctx={ctx} section={section} />;
  }
  if (RAIL_PRODUCT_TEMPLATES.includes(ctx.d.template)) {
    return <ProductRail ctx={ctx} section={section} />;
  }
  const list = resolveSectionProducts(section, ctx.products);
  return (
    <Block ctx={ctx}>
      <Heading
        title={section.title || sectionMeta[section.id].label}
        href={`/store/${ctx.d.storeSlug}/products`}
        on={ctx.interactive}
      />
      <ProductGrid products={list} ctx={ctx} />
    </Block>
  );
}
