"use client";

import { useMemo, type CSSProperties, type ReactNode } from "react";
import { img } from "@/lib/images";
import { ArrowRight, BadgeCheck, Mail, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product, StoreDesign } from "@/lib/store-design/types";
import { formatPrice, initials } from "@/lib/store-design/utilts";
import { ProductArt } from "./productArt";

export interface StoreProfileProps {
  design: StoreDesign;
  products: Product[];
  verified?: boolean;
  interactive?: boolean;
  mobile: boolean;
}

/* No framer-motion, no Lenis, no scroll effects. Only one CSS entrance
   animation (transform/opacity, GPU only) that respects reduced motion. */
const KEYFRAMES = `
@keyframes sp-rise{from{opacity:0;transform:translate3d(0,18px,0)}to{opacity:1;transform:none}}
.sp-rise{animation:sp-rise .6s cubic-bezier(.22,1,.36,1) both}
@media (prefers-reduced-motion:reduce){.sp-rise{animation:none}}
`;

const CTA_BG = "linear-gradient(110deg, var(--s-primary), var(--s-secondary))";
const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const glass: CSSProperties = {
  background: "rgba(18,18,22,.5)",
  backdropFilter: "blur(22px) saturate(160%)",
  WebkitBackdropFilter: "blur(22px) saturate(160%)",
  border: "1px solid rgba(255,255,255,.14)",
  boxShadow: "0 30px 60px -30px rgba(0,0,0,.6)",
};

function A({
  on,
  href,
  label,
  className,
  style,
  children,
}: {
  on: boolean;
  href: string;
  label?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  if (!on) {
    return (
      <span className={className} style={style}>
        {children}
      </span>
    );
  }
  return (
    <a href={href} aria-label={label} className={className} style={style}>
      {children}
    </a>
  );
}

function useStats(products: Product[]) {
  return useMemo(() => {
    const sold = products.reduce((n, p) => n + p.sold, 0);
    const avg = products.length
      ? products.reduce((n, p) => n + p.rating, 0) / products.length
      : 0;
    return [
      { value: compact.format(products.length), label: "Products" },
      { value: compact.format(sold), label: "Sold" },
      { value: avg ? avg.toFixed(1) : "–", label: "Rating" },
    ];
  }, [products]);
}

function useTop(products: Product[], n: number) {
  return useMemo(
    () => [...products].sort((a, b) => b.sold - a.sold).slice(0, n),
    [products, n],
  );
}

function Cover({ d }: { d: StoreDesign }) {
  if (d.coverUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={img(d.coverUrl, { width: 1600 })}
        alt=""
        decoding="async"
        fetchPriority="high"
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        background:
          "linear-gradient(145deg, var(--s-primary), var(--s-secondary))",
      }}
    >
      <span className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/15 blur-2xl" />
      <span className="absolute inset-0 flex items-center justify-center text-[10rem] font-black tracking-tighter text-white/25">
        {initials(d.storeName)}
      </span>
    </div>
  );
}

function RoundActions({
  d,
  on,
  size,
}: {
  d: StoreDesign;
  on: boolean;
  size: number;
}) {
  const base = `/store/${d.storeSlug}`;
  const cls =
    "flex shrink-0 items-center justify-center rounded-full transition-transform duration-150 active:scale-90";
  return (
    <div className="flex items-center gap-2.5">
      <A
        on={on}
        href={`${base}/wishlist`}
        label="Wishlist"
        className={cls}
        style={{
          height: size,
          width: size,
          background: CTA_BG,
          color: "var(--s-on-primary)",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,.35), 0 10px 26px -8px var(--s-primary)",
        }}
      >
        <Star className="h-5 w-5" fill="currentColor" />
      </A>
      <A
        on={on}
        href={`${base}/contact`}
        label="Contact"
        className={cls}
        style={{
          height: size,
          width: size,
          background: "#0b0b0d",
          color: "#fff",
          boxShadow: "0 0 0 1px rgba(255,255,255,.16)",
        }}
      >
        <Mail className="h-5 w-5" />
      </A>
    </div>
  );
}

function Cta({
  d,
  on,
  className,
}: {
  d: StoreDesign;
  on: boolean;
  className?: string;
}) {
  return (
    <A
      on={on}
      href="#store-feed"
      className={cn(
        "flex items-center justify-center gap-2 font-semibold transition-transform duration-150 active:scale-[0.97]",
        className,
      )}
      style={{
        background: CTA_BG,
        color: "var(--s-on-primary)",
        boxShadow: "0 16px 36px -14px var(--s-primary)",
      }}
    >
      {d.heroButtonText || "Shop now"}
      <ArrowRight className="h-4 w-4" />
    </A>
  );
}

function Identity({
  d,
  stats,
  verified,
  on,
  mobile,
}: {
  d: StoreDesign;
  stats: { value: string; label: string }[];
  verified: boolean;
  on: boolean;
  mobile: boolean;
}) {
  const bio = d.tagline || d.description;
  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <h1
          className="min-w-0 break-words font-extrabold text-white [text-wrap:balance]"
          style={{
            fontSize: mobile
              ? "clamp(2.4rem, 11.5vw, 3.4rem)"
              : "clamp(2.8rem, 4vw, 3.9rem)",
            lineHeight: 0.95,
            letterSpacing: "-0.035em",
          }}
        >
          {d.storeName || "Your store"}
        </h1>
        {mobile && (
          <div className="flex shrink-0 flex-col items-end gap-3 pb-1">
            <A
              on={on}
              href={`/store/${d.storeSlug}/about`}
              className="text-sm font-medium text-white/80"
            >
              See profile
            </A>
            <RoundActions d={d} on={on} size={44} />
          </div>
        )}
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-sm text-white/65">
        @{d.storeSlug || "your-store"}
        {d.showVerifiedBadge && verified && (
          <BadgeCheck className="h-4 w-4" style={{ color: "#7dd3fc" }} />
        )}
      </p>

      {bio && (
        <p className="mt-3 line-clamp-3 max-w-md text-[15px] leading-relaxed text-white/85">
          {bio}
        </p>
      )}

      <dl className="mt-5 flex gap-9">
        {stats.map((s) => (
          <div key={s.label}>
            <dd className="text-xl font-bold leading-none text-white">
              {s.value}
            </dd>
            <dt className="mt-1.5 text-xs text-white/60">{s.label}</dt>
          </div>
        ))}
      </dl>

      {mobile ? (
        <Cta
          d={d}
          on={on}
          className="mt-6 h-14 w-full rounded-full text-base"
        />
      ) : (
        <div className="mt-6 flex items-center gap-3">
          <Cta d={d} on={on} className="h-12 flex-1 rounded-full text-sm" />
          <RoundActions d={d} on={on} size={48} />
        </div>
      )}
    </>
  );
}

/* ---------------------------- Mobile ---------------------------- */

function MobileProfile({
  design: d,
  products,
  verified = true,
  interactive = false,
}: Omit<StoreProfileProps, "mobile">) {
  const stats = useStats(products);
  const top = useTop(products, 6);
  const chips = [
    d.deliveryNote ||
      (d.freeDeliveryThreshold > 0
        ? `Free over ${formatPrice(d.freeDeliveryThreshold)}`
        : ""),
    d.showReturnPolicy ? "Easy returns" : "",
    d.showVerifiedBadge && verified ? "Verified seller" : "",
  ].filter(Boolean);

  return (
    <section className="relative">
      <div
        className="relative overflow-hidden bg-black"
        style={{ aspectRatio: "390 / 660" }}
      >
        <Cover d={d} />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(8,8,10,.96) 0%, rgba(8,8,10,.78) 30%, rgba(8,8,10,.12) 62%, rgba(8,8,10,.28) 100%)",
          }}
        />
        <div className="sp-rise absolute inset-x-0 bottom-0 px-5 pb-11">
          <Identity
            d={d}
            stats={stats}
            verified={verified}
            on={interactive}
            mobile
          />
        </div>
      </div>

      <div
        className="relative z-10 -mt-7 rounded-t-[32px] px-4 pb-3 pt-3"
        style={{
          background: "var(--s-bg)",
          boxShadow: "0 -18px 40px -18px rgba(0,0,0,.45)",
        }}
      >
        <span
          className="mx-auto mb-4 block h-1 w-10 rounded-full"
          style={{ background: "var(--s-border)" }}
        />
        {chips.length > 0 && (
          <div className="no-scrollbar -mx-4 mb-4 flex snap-x gap-2 overflow-x-auto px-4">
            {chips.map((c) => (
              <span
                key={c}
                className="shrink-0 snap-start whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium"
                style={{
                  borderColor: "var(--s-border)",
                  background: "var(--s-surface)",
                }}
              >
                {c}
              </span>
            ))}
          </div>
        )}
        {top.length > 0 && (
          <>
            <h2 className="mb-3 text-lg font-bold tracking-tight">Top picks</h2>
            <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 [-webkit-overflow-scrolling:touch]">
              {top.map((p) => (
                <A
                  key={p.id}
                  on={interactive}
                  href={`/store/${d.storeSlug}/products/${p.id}`}
                  className="block w-[136px] shrink-0 snap-start transition-transform duration-150 active:scale-[0.97]"
                >
                  <div className="aspect-square overflow-hidden rounded-2xl">
                    <ProductArt product={p} emojiClassName="text-4xl" />
                  </div>
                  <p className="mt-2 truncate text-[13px] font-semibold">
                    {p.name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--s-muted)" }}>
                    {formatPrice(p.price)}
                  </p>
                </A>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/* ---------------------------- Desktop ---------------------------- */

function DesktopProfile({
  design: d,
  products,
  verified = true,
  interactive = false,
}: Omit<StoreProfileProps, "mobile">) {
  const stats = useStats(products);
  const top = useTop(products, 3);

  return (
    <div
      className="relative isolate mb-6 flex items-end justify-between gap-6 overflow-hidden rounded-[32px] bg-black p-8"
      style={{ height: 520 }}
    >
      <Cover d={d} />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(8,8,10,.84) 0%, rgba(8,8,10,.5) 48%, rgba(8,8,10,.12) 100%), linear-gradient(to top, rgba(8,8,10,.5), transparent 45%)",
        }}
      />

      <div
        className="sp-rise relative w-[min(500px,56%)] rounded-[28px] p-8"
        style={glass}
      >
        <Identity
          d={d}
          stats={stats}
          verified={verified}
          on={interactive}
          mobile={false}
        />
      </div>

      {top.length > 0 && (
        <div
          className="sp-rise relative w-[min(300px,30%)] rounded-[28px] p-5"
          style={{ ...glass, animationDelay: ".12s" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold tracking-tight text-white">
              Top picks
            </h2>
            <A
              on={interactive}
              href={`/store/${d.storeSlug}/about`}
              className="text-xs font-medium text-white/70"
            >
              See profile
            </A>
          </div>
          <ul className="space-y-1">
            {top.map((p) => (
              <li key={p.id}>
                <A
                  on={interactive}
                  href={`/store/${d.storeSlug}/products/${p.id}`}
                  className="flex items-center gap-3 rounded-2xl p-2 transition-colors duration-150 hover:bg-white/10"
                >
                  <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                    <ProductArt product={p} emojiClassName="text-2xl" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white">
                      {p.name}
                    </span>
                    <span className="block text-xs text-white/65">
                      {formatPrice(p.price)}
                    </span>
                  </span>
                </A>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function StoreProfile({ mobile, ...rest }: StoreProfileProps) {
  return (
    <>
      <style>{KEYFRAMES}</style>
      {mobile ? <MobileProfile {...rest} /> : <DesktopProfile {...rest} />}
    </>
  );
}
