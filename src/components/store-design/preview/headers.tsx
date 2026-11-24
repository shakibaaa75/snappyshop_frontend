"use client";

import { type CSSProperties, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, Heart, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { img } from "@/lib/images";
import { useCart } from "@/lib/store-design/cart";
import { Badge, Link, Mark } from "./blocks";
import { catPhoto } from "./category-tiles";
import { isActive, isStoreWishlistLink } from "./mobile-nav";
import { SearchField } from "./search-field";
import { StoreHero } from "./store-hero";
import { CTA_BG, muted } from "./tokens";
import { type Ctx } from "./types";

/* ------------------------------------------------------------------ */
/* The storefront itself                                               */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Desktop headers for the topnav and editorial page structures        */
/* ------------------------------------------------------------------ */

function HeaderActions({ ctx }: { ctx: Ctx }) {
  const { d, interactive, openCart } = ctx;
  const cart = useCart();
  const base = `/store/${d.storeSlug}`;
  const count = interactive ? cart.count : 2;
  const btn =
    "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full";
  const outline: CSSProperties = { border: "1px solid var(--s-border)" };
  const filled: CSSProperties = {
    background: CTA_BG,
    color: "var(--s-on-primary)",
  };
  return (
    <div className="flex shrink-0 items-center gap-2">
      {d.showWishlist && (
        <Link
          on={interactive}
          href={`${base}/wishlist`}
          title="Wishlist"
          className={btn}
          style={outline}
        >
          <Heart className="h-[18px] w-[18px]" />
        </Link>
      )}
      {d.showCartIcon &&
        (interactive && openCart ? (
          <button
            type="button"
            onClick={openCart}
            aria-label={`Cart${count > 0 ? `, ${count} items` : ""}`}
            className={btn}
            style={filled}
          >
            <ShoppingBag className="h-[18px] w-[18px]" />
            {count > 0 && <Badge n={count} />}
          </button>
        ) : (
          <Link
            on={interactive}
            href={`${base}/cart`}
            title="Cart"
            className={btn}
            style={filled}
          >
            <ShoppingBag className="h-[18px] w-[18px]" />
            {count > 0 && <Badge n={count} />}
          </Link>
        ))}
    </div>
  );
}
export function HeaderNav({
  ctx,
  variant,
}: {
  ctx: Ctx;
  variant: "pill" | "text";
}) {
  const { d, interactive } = ctx;
  const pathname = usePathname() ?? "";
  const base = `/store/${d.storeSlug}`;
  return (
    <nav className="flex min-w-0 items-center gap-1 overflow-x-auto no-scrollbar">
      {d.navLinks
        .filter((link) => !isStoreWishlistLink(link.url, base))
        .map((l, i) => {
          const active = interactive
            ? isActive(pathname, base, l.url)
            : i === 0;
          return variant === "pill" ? (
            <Link
              key={l.id}
              on={interactive}
              href={l.url || "/"}
              className="flex h-10 shrink-0 items-center rounded-full px-4 text-sm font-medium transition-colors"
              style={
                active
                  ? { background: CTA_BG, color: "var(--s-on-primary)" }
                  : muted
              }
            >
              {l.label}
            </Link>
          ) : (
            <Link
              key={l.id}
              on={interactive}
              href={l.url || "/"}
              className="mx-3 shrink-0 border-b pb-1 text-xs font-medium uppercase tracking-[0.18em] transition-colors"
              style={{
                borderColor: active ? "var(--s-text)" : "transparent",
                ...(active ? null : muted),
              }}
            >
              {l.label}
            </Link>
          );
        })}
    </nav>
  );
}
export function TopNavHeader({ ctx }: { ctx: Ctx }) {
  const { d, interactive } = ctx;
  return (
    <header
      className={cn("z-30 w-full", d.stickyHeader && "sticky top-0")}
      style={{
        background: "var(--s-bg)",
        borderBottom: "1px solid var(--s-border)",
      }}
    >
      <div className="mx-auto flex h-[76px] max-w-[1240px] items-center gap-6 px-6">
        <Link
          on={interactive}
          href={`/store/${d.storeSlug}`}
          className="flex shrink-0 items-center gap-2.5"
        >
          <Mark d={d} size={40} />
          <span className="max-w-[200px] truncate text-lg font-extrabold tracking-tight">
            {d.storeName || "Your store"}
          </span>
        </Link>
        <HeaderNav ctx={ctx} variant="pill" />
        <div className="ml-auto flex min-w-0 items-center gap-3">
          {d.showSearch && (
            <div className="w-[280px] max-w-full">
              <SearchField ctx={ctx} bg="var(--s-surface)" />
            </div>
          )}
          <HeaderActions ctx={ctx} />
        </div>
      </div>
    </header>
  );
}
/**
 * Yokai header, one row: menu on the left ("Shop" opens a mega menu of
 * category photos), a wide search bar, icons. No logo; the shop identity is
 * the slim profile row under it.
 */
export function YokaiHeader({ ctx }: { ctx: Ctx }) {
  const { d, interactive, openCart, products, categories } = ctx;
  const cart = useCart();
  const pathname = usePathname() ?? "";
  const base = `/store/${d.storeSlug}`;
  const count = interactive ? cart.count : 2;
  const [open, setOpen] = useState(false);
  const mega = categories.slice(0, 8);
  const icon = "relative flex h-10 w-10 items-center justify-center";
  const link =
    "flex h-11 shrink-0 items-center px-4 text-[11px] font-semibold uppercase tracking-[0.18em] transition-opacity hover:opacity-70";
  return (
    <header
      className={cn(
        "z-30 w-full",
        d.stickyHeader ? "sticky top-0" : "relative",
      )}
      style={{ background: "var(--s-bg)", color: "var(--s-text)" }}
      onMouseLeave={() => setOpen(false)}
    >
      <div className="mx-auto grid h-[76px] max-w-[1440px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-6 px-6">
        <nav className="flex items-center overflow-x-auto no-scrollbar">
          {mega.length > 0 && (
            <button
              type="button"
              aria-expanded={open}
              onMouseEnter={() => setOpen(true)}
              onFocus={() => setOpen(true)}
              onClick={() => setOpen((v) => !v)}
              className={cn(link, "gap-1.5 pl-0")}
            >
              Shop
              <ChevronRight
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  open ? "rotate-90" : "rotate-0",
                )}
              />
            </button>
          )}
          {d.navLinks
            .filter(
              (l) =>
                !isStoreWishlistLink(l.url, base) &&
                (!/^\/?(products|shop)\/?$/i.test(l.url) || mega.length === 0),
            )
            .map((l, i) => {
              const active = interactive
                ? isActive(pathname, base, l.url)
                : i === 0;
              return (
                <Link
                  key={l.id}
                  on={interactive}
                  href={l.url || "/"}
                  className={cn(link, active && "underline underline-offset-8")}
                >
                  {l.label}
                </Link>
              );
            })}
        </nav>
        <div className="mx-auto w-full max-w-xl">
          {d.showSearch && <SearchField ctx={ctx} bg="var(--s-surface)" />}
        </div>
        <div className="flex items-center gap-1">
          {d.showWishlist && (
            <Link
              on={interactive}
              href={`${base}/wishlist`}
              title="Wishlist"
              className={icon}
            >
              <Heart className="h-5 w-5" />
            </Link>
          )}
          {d.showCartIcon &&
            (interactive && openCart ? (
              <button
                type="button"
                onClick={openCart}
                aria-label={`Cart${count > 0 ? `, ${count} items` : ""}`}
                className={icon}
              >
                <ShoppingBag className="h-5 w-5" />
                {count > 0 && <Badge n={count} />}
              </button>
            ) : (
              <Link
                on={interactive}
                href={`${base}/cart`}
                title="Cart"
                className={icon}
              >
                <ShoppingBag className="h-5 w-5" />
                {count > 0 && <Badge n={count} />}
              </Link>
            ))}
        </div>
      </div>

      {open && mega.length > 0 && (
        <div
          className="absolute inset-x-0 top-full z-40 shadow-xl"
          style={{
            background: "var(--s-bg)",
            borderBottom: "1px solid var(--s-border)",
          }}
        >
          <div className="mx-auto grid max-w-[1440px] grid-cols-4 gap-4 px-6 py-6 xl:grid-cols-8">
            {mega.map((c) => {
              const photo = catPhoto(c, products);
              return (
                <Link
                  key={c.id}
                  on={interactive}
                  href={`${base}/products?category=${c.id}`}
                  title={c.name}
                  className="group block"
                >
                  <span
                    className="relative block overflow-hidden"
                    style={{
                      aspectRatio: "1 / 1",
                      background: "var(--s-surface)",
                    }}
                  >
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img(photo, { width: 300 })}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                      />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-3xl font-semibold opacity-30">
                        {c.emoji || c.name.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <span className="mt-2 block truncate text-[11px] font-semibold uppercase tracking-[0.14em]">
                    {c.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
/**
 * Drop-style header: menu on the left, wordmark centered, search and
 * icon-only wishlist / bag on the right. Flat, hairline underneath.
 */
/** Streetwear uses the same editable profile layouts as the Header panel. */
export function StreetHeader({ ctx }: { ctx: Ctx }) {
  const { d } = ctx;
  const menu = (
    <div className="flex min-h-[64px] items-center justify-between gap-4 py-3">
      <div className="min-w-0 flex-1">
        <HeaderNav ctx={ctx} variant="text" />
      </div>
      {d.showSearch && (
        <div className="hidden w-[200px] shrink-0 xl:block">
          <SearchField ctx={ctx} compact bg="var(--s-surface)" />
        </div>
      )}
      <div className="shrink-0">
        <HeaderActions ctx={ctx} />
      </div>
    </div>
  );

  if (d.headerStyle === "minimal") {
    // These must be siblings: nesting the sticky menu inside the profile
    // header would constrain its sticky range to the profile's height.
    return (
      <>
        <header className="w-full" style={{ background: "var(--s-bg)" }}>
          <div className="mx-auto max-w-[1440px] px-6 pt-5">
            <StoreHero ctx={ctx} />
          </div>
        </header>
        <div
          className={cn("z-30 w-full", d.stickyHeader && "sticky top-0")}
          style={{
            background: "var(--s-bg)",
            borderBottom: "1px solid var(--s-border)",
          }}
        >
          <div className="mx-auto max-w-[1440px] px-6">{menu}</div>
        </div>
      </>
    );
  }

  return (
    <header
      className={cn("z-30 w-full", d.stickyHeader && "sticky top-0")}
      style={{
        background: "var(--s-bg)",
        borderBottom: "1px solid var(--s-border)",
      }}
    >
      <div className="mx-auto max-w-[1440px] px-6 pt-5">
        <StoreHero ctx={ctx} />
        {menu}
      </div>
    </header>
  );
}
export function EditorialHeader({ ctx }: { ctx: Ctx }) {
  const { d, interactive } = ctx;
  return (
    <header
      className={cn("z-30 w-full", d.stickyHeader && "sticky top-0")}
      style={{
        background: "var(--s-bg)",
        borderBottom: "1px solid var(--s-border)",
      }}
    >
      <div className="mx-auto max-w-[1120px] px-6">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 pt-5">
          <div className="min-w-0">
            {d.showSearch && (
              <div className="w-[240px] max-w-full">
                <SearchField ctx={ctx} bg="var(--s-surface)" />
              </div>
            )}
          </div>
          <Link
            on={interactive}
            href={`/store/${d.storeSlug}`}
            className="text-center"
          >
            <span className="block max-w-[420px] truncate text-3xl font-semibold uppercase tracking-[0.22em]">
              {d.storeName || "Your store"}
            </span>
          </Link>
          <div className="flex justify-end">
            <HeaderActions ctx={ctx} />
          </div>
        </div>
        <div className="flex justify-center py-4">
          <HeaderNav ctx={ctx} variant="text" />
        </div>
      </div>
    </header>
  );
}
