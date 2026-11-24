"use client";

import { type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import {
  Heart,
  Home,
  Info,
  LayoutGrid,
  Phone,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { readableOn } from "@/lib/store-design/utilts";
import { useCart } from "@/lib/store-design/cart";
import { CategoryThumb } from "@/components/seller/CategoryThumb";
import { Badge, Link, Mark } from "./blocks";
import { isActive, isStoreWishlistLink } from "./mobile-nav";
import { SearchField } from "./search-field";
import { catImage, CTA_BG, INK, muted, THUMB_THEME } from "./tokens";
import { type Ctx } from "./types";

/* ------------------------------------------------------------------ */
/* Desktop dashboard shell: sidebar, top bar, cart rail                */
/* ------------------------------------------------------------------ */

export const PANEL: CSSProperties = {
  background: "var(--s-bg)",
  border: "1px solid var(--s-border)",
  borderRadius: 28,
};
function navIcon(label: string): typeof Home {
  const l = label.trim().toLowerCase();
  if (/^(shop|store|home)$/.test(l)) return Home;
  if (l.includes("about")) return Info;
  if (l.includes("contact")) return Phone;
  if (l.includes("wish")) return Heart;
  return LayoutGrid;
}
export function SideNav({ ctx }: { ctx: Ctx }) {
  const { d, interactive, categories } = ctx;
  const pathname = usePathname() ?? "";
  const base = `/store/${d.storeSlug}`;
  const promo = d.promoBanners?.[0];
  const help = d.supportPhone || d.supportEmail;

  return (
    <aside
      className={cn(
        "flex flex-col gap-5 p-4",
        interactive && "no-scrollbar sticky top-5 overflow-y-auto",
      )}
      style={{
        ...PANEL,
        ...(interactive ? { maxHeight: "calc(100vh - 2.5rem)" } : null),
      }}
    >
      <Link
        on={interactive}
        href={base}
        className="flex items-center gap-2.5 px-1 pt-1"
      >
        <Mark d={d} size={40} round={false} />
        <span className="truncate text-lg font-bold tracking-tight">
          {d.storeName || "Your store"}
        </span>
      </Link>

      <nav className="flex flex-col gap-1">
        {d.navLinks
          .filter((link) => !isStoreWishlistLink(link.url, base))
          .map((l, i) => {
            const Icon = navIcon(l.label);
            const active = interactive
              ? isActive(pathname, base, l.url)
              : i === 0;
            return (
              <Link
                key={l.id}
                on={interactive}
                href={l.url || "/"}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-2xl px-3.5 text-sm font-medium transition-colors",
                  !active && "hover:bg-[var(--s-surface)]",
                )}
                style={
                  active
                    ? { background: CTA_BG, color: "var(--s-on-primary)" }
                    : muted
                }
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span className="truncate">{l.label}</span>
              </Link>
            );
          })}
      </nav>

      {categories.length > 0 && (
        <div className="space-y-1">
          <p className="px-3.5 pb-1 text-xs font-semibold" style={muted}>
            Categories
          </p>
          {categories.slice(0, 6).map((c) => (
            <Link
              key={c.id}
              on={interactive}
              href={`${base}/products?category=${c.id}`}
              className="flex h-10 items-center gap-3 rounded-2xl px-3.5 text-sm transition-colors hover:bg-[var(--s-surface)]"
            >
              <CategoryThumb
                name={c.name}
                imageUrl={catImage(c)}
                className={cn("h-6 w-6", THUMB_THEME)}
                textClassName="text-[11px]"
              />
              <span className="truncate">{c.name}</span>
            </Link>
          ))}
        </div>
      )}

      {promo && (
        <Link
          on={interactive && !!promo.url}
          href={promo.url || "/"}
          className="relative flex flex-col gap-1.5 overflow-hidden rounded-[24px] p-4"
          style={{
            background: `linear-gradient(150deg, ${promo.color}, color-mix(in srgb, ${promo.color} 55%, #000))`,
            color: readableOn(promo.color),
          }}
        >
          <span className="text-base font-bold leading-tight">
            {promo.title}
          </span>
          {promo.subtitle && (
            <span className="line-clamp-2 text-xs opacity-85">
              {promo.subtitle}
            </span>
          )}
          {promo.buttonText && (
            <span
              className="mt-2 inline-flex h-9 w-fit items-center rounded-full px-4 text-xs font-semibold"
              style={{
                background: readableOn(promo.color),
                color: promo.color,
              }}
            >
              {promo.buttonText}
            </span>
          )}
        </Link>
      )}

      {help && (
        <div
          className="flex items-center gap-3 rounded-2xl p-3"
          style={{ background: "var(--s-surface)" }}
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={INK}
          >
            <Phone className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold">Need help?</p>
            <p className="truncate text-[11px]" style={muted}>
              {help}
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
export function TopBar({ ctx, rail }: { ctx: Ctx; rail: boolean }) {
  const { d, interactive, openCart } = ctx;
  const cart = useCart();
  const base = `/store/${d.storeSlug}`;
  const count = interactive ? cart.count : 2;
  const pill =
    "flex h-12 shrink-0 items-center gap-2 rounded-full px-5 text-sm font-medium";
  const pillStyle: CSSProperties = {
    background: "var(--s-bg)",
    border: "1px solid var(--s-border)",
  };

  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        {d.showSearch && <SearchField ctx={ctx} bg="var(--s-bg)" />}
      </div>
      {d.showWishlist && (
        <Link
          on={interactive}
          href={`${base}/wishlist`}
          className={pill}
          style={pillStyle}
        >
          <Heart className="h-[18px] w-[18px]" />
          Wishlist
        </Link>
      )}
      {!rail &&
        d.showCartIcon &&
        (interactive && openCart ? (
          <button
            type="button"
            onClick={openCart}
            aria-label={`Cart${count > 0 ? `, ${count} items` : ""}`}
            className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
            style={{ background: CTA_BG, color: "var(--s-on-primary)" }}
          >
            <ShoppingBag className="h-[18px] w-[18px]" />
            {count > 0 && <Badge n={count} />}
          </button>
        ) : (
          <Link
            on={interactive}
            href={`${base}/cart`}
            title="Cart"
            className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
            style={{ background: CTA_BG, color: "var(--s-on-primary)" }}
          >
            <ShoppingBag className="h-[18px] w-[18px]" />
            {count > 0 && <Badge n={count} />}
          </Link>
        ))}
    </div>
  );
}
