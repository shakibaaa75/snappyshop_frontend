"use client";

import { resolveHeaderStyle } from "@/lib/store-design/types";
import { type CSSProperties, type ReactNode, useEffect, useState } from "react";
import { ArrowRight, BadgeCheck, Check, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { img } from "@/lib/images";
import { Link, Mark } from "./blocks";
import { muted } from "./tokens";
import { type Ctx } from "./types";

/* ------------------------------------------------------------------ */
/* Store hero: aurora/photo cover, overlapping avatar, profile card    */
/*                                                                     */
/* Seller-controlled images:                                           */
/*   d.coverUrl -> cover background (falls back to an aurora gradient) */
/*   d.logoUrl  -> avatar (falls back to store initials)               */
/* ------------------------------------------------------------------ */

export function StoreHero({ ctx, slim = false }: { ctx: Ctx; slim?: boolean }) {
  const { d, products, verified, mobile, interactive } = ctx;
  const base = `/store/${d.storeSlug}`;
  const avatar = mobile ? 72 : 104;
  const bio = d.description || d.storyText;

  const sold = products.reduce((n, p) => n + p.sold, 0);
  const avg = products.length
    ? products.reduce((n, p) => n + p.rating, 0) / products.length
    : 0;
  const compact = (n: number) =>
    new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n);

  const meta = [
    `${compact(products.length)} ${products.length === 1 ? "product" : "products"}`,
    `${compact(sold)} sold`,
    ...(d.showRatings && avg > 0 ? [`${avg.toFixed(1)} rating`] : []),
  ];

  /* Follow state, remembered per store in the visitor's browser */
  const followKey = `shopbd-follow:${d.storeSlug}`;
  const [following, setFollowing] = useState(false);
  useEffect(() => {
    if (!interactive) return;
    try {
      setFollowing(window.localStorage.getItem(followKey) === "1");
    } catch {
      /* storage unavailable */
    }
  }, [followKey, interactive]);

  const toggleFollow = () => {
    if (!interactive) return;
    const next = !following;
    setFollowing(next);
    try {
      if (next) window.localStorage.setItem(followKey, "1");
      else window.localStorage.removeItem(followKey);
    } catch {
      /* storage unavailable */
    }
  };

  /* Gradient cover from the seller's theme (used when no cover image) */
  const gradient = [
    "radial-gradient(60% 110% at 12% 70%, color-mix(in srgb, var(--s-primary) 85%, #000) 0%, transparent 65%)",
    "radial-gradient(70% 120% at 60% 20%, var(--s-secondary) 0%, transparent 70%)",
    "radial-gradient(60% 100% at 100% 100%, color-mix(in srgb, var(--s-secondary) 60%, #fff) 0%, transparent 70%)",
    "var(--s-primary)",
  ].join(", ");

  const followStyle: CSSProperties = following
    ? {
        background: "transparent",
        color: "var(--s-text)",
        border: "1px solid var(--s-border)",
      }
    : {
        background: "var(--s-surface)",
        color: "var(--s-text)",
        border: "1px solid transparent",
      };

  const layout: string = resolveHeaderStyle(d.headerStyle);
  /* "Tight" layouts use a smaller avatar, name and Follow button. */
  const compactLayout = layout === "compact" || layout === "minimal";
  const avatarSize = compactLayout ? (mobile ? 52 : 68) : avatar;
  const half = Math.round(avatarSize / 2);
  const centered = layout === "centered";

  const coverAspect =
    layout === "compact"
      ? mobile
        ? "4.5 / 1"
        : "7 / 1"
      : mobile
        ? "2.4 / 1"
        : "3.2 / 1";

  /* The cover: seller image or theme gradient. `fill` stretches it to the
     height of its grid cell (split layout); `children` sit on top of it. */
  const coverBox = (aspect: string, children?: ReactNode, fill = false) => (
    <div
      className="relative w-full overflow-hidden"
      style={{
        aspectRatio: fill ? undefined : aspect,
        height: fill ? "100%" : undefined,
        minHeight: fill ? 300 : undefined,
        borderRadius: mobile ? 20 : 24,
        background: gradient,
        border: "1px solid var(--s-border)",
      }}
    >
      {d.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={img(d.coverUrl, { width: 1600 })}
          alt=""
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {children}
    </div>
  );
  const coverEl = coverBox(coverAspect);

  /* Profile image. Floating layouts get a ring in the page color. */
  const floating = centered || layout === "overlap";
  const avatarEl = (
    <span
      className="shrink-0 overflow-hidden rounded-full"
      style={{
        border: floating
          ? "4px solid var(--s-bg)"
          : "1px solid var(--s-border)",
        background: "var(--s-bg)",
        ...(floating ? { marginTop: -half } : null),
      }}
    >
      <Mark d={d} size={avatarSize} />
    </span>
  );

  const nameEl = (
    <div className={cn("min-w-0", centered ? "text-center" : "flex-1")}>
      <div
        className={cn(
          "flex items-center gap-1.5",
          centered && "justify-center",
        )}
      >
        <h1
          className={cn(
            "truncate font-semibold leading-tight tracking-tight",
            compactLayout ? "text-lg sm:text-2xl" : "text-xl sm:text-3xl",
          )}
        >
          {d.storeName || "Your store"}
        </h1>
        {d.showVerifiedBadge && verified && (
          <BadgeCheck
            className="h-5 w-5 shrink-0 sm:h-6 sm:w-6"
            style={{ color: "var(--s-primary)" }}
            aria-label="Verified seller"
          />
        )}
      </div>
      <p className="mt-0.5 truncate text-sm sm:text-base" style={muted}>
        @{d.storeSlug || "your-store"}
      </p>
      <p
        className={cn(
          "mt-1 flex flex-wrap items-center gap-x-2 text-xs sm:text-sm",
          centered && "justify-center",
        )}
        style={muted}
      >
        {meta.map((m, i) => (
          <span key={m} className="inline-flex items-center gap-2">
            {i > 0 && <span aria-hidden>·</span>}
            {m}
          </span>
        ))}
      </p>
    </div>
  );

  const followBtn = (
    <button
      type="button"
      onClick={toggleFollow}
      aria-pressed={following}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition-all duration-300 ease-out active:scale-95",
        compactLayout
          ? "h-9 px-4 text-sm"
          : "h-10 px-5 text-sm sm:h-12 sm:px-8 sm:text-base",
      )}
      style={followStyle}
    >
      {following && <Check className="h-4 w-4" />}
      {following ? "Following" : "Follow"}
    </button>
  );

  const wishlistLink =
    d.showWishlist && !mobile ? (
      <Link
        on={interactive}
        href={`${base}/wishlist`}
        title="Wishlist"
        className="inline-flex items-center gap-1.5 text-xs transition-opacity active:opacity-60 sm:text-sm"
        style={muted}
      >
        <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        Wishlist
      </Link>
    ) : null;

  const bioEl = bio ? (
    <p
      className={cn(
        "mt-4 line-clamp-2 max-w-3xl text-sm leading-relaxed sm:text-base",
        centered && "mx-auto text-center",
      )}
      style={{ color: "var(--s-text)", opacity: 0.85 }}
    >
      {bio}
    </p>
  ) : null;

  let body: ReactNode;
  if (centered) {
    body = (
      <div className="flex flex-col items-center">
        {avatarEl}
        <div className="mt-3 w-full">{nameEl}</div>
        <div className="mt-3 flex items-center gap-4">
          {followBtn}
          {wishlistLink}
        </div>
      </div>
    );
  } else if (layout === "overlap") {
    body = (
      <div className="flex items-start gap-4 sm:gap-5">
        {avatarEl}
        <div className="min-w-0 flex-1 pt-3">{nameEl}</div>
        <div className="flex shrink-0 flex-col items-center gap-2 pt-3">
          {followBtn}
          {wishlistLink}
        </div>
      </div>
    );
  } else if (compactLayout) {
    body = (
      <div className="flex items-center gap-3">
        {avatarEl}
        {nameEl}
        <div className="flex shrink-0 items-center gap-3">{followBtn}</div>
      </div>
    );
  } else {
    body = (
      <div className="flex items-start gap-4 sm:gap-5">
        {avatarEl}
        <div className="min-w-0 flex-1 self-center">{nameEl}</div>
        <div className="flex shrink-0 flex-col items-center gap-2 self-center">
          {followBtn}
          {wishlistLink}
        </div>
      </div>
    );
  }

  const sectionClass = mobile ? "px-4" : undefined;
  const sectionStyle: CSSProperties | undefined = mobile
    ? {
        paddingTop: "calc(max(0.75rem, env(safe-area-inset-top)) + 3.5rem)",
      }
    : undefined;

  /* New layouts use the same theme variables, verified state and Follow action
     in the editor and the public storefront. Mobile utilities stay in MobileTop. */
  if (["editorial", "framed", "spotlight"].includes(layout)) {
    const identity = (
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="shrink-0 overflow-hidden rounded-full"
          style={{ border: "1px solid var(--s-border)" }}
        >
          <Mark d={d} size={mobile ? 44 : 56} />
        </span>
        <div className="min-w-0 flex-1">{nameEl}</div>
      </div>
    );
    const details = bio ? (
      <p className="mt-4 max-w-xl text-sm leading-relaxed" style={muted}>
        {bio}
      </p>
    ) : null;
    const actions = (
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {followBtn}
        <Link
          on={interactive}
          href={`${base}/products`}
          className="inline-flex min-h-11 items-center gap-2 px-2 text-sm font-medium"
          style={{ color: "var(--s-text)" }}
        >
          Shop collection <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
    if (layout === "editorial")
      return (
        <section
          data-header-layout="editorial"
          className={cn("w-full", sectionClass)}
          data-sf="hero"
          style={sectionStyle}
        >
          <div
            className="grid overflow-hidden"
            style={{
              gridTemplateColumns: mobile
                ? "minmax(0,1fr)"
                : "minmax(0,1.15fr) minmax(0,1fr)",
              border: "1px solid var(--s-border)",
              borderRadius: 20,
            }}
          >
            <div className={mobile ? "p-3" : "p-4"}>
              {coverBox(mobile ? "2 / 1" : "4 / 3")}
            </div>
            <div
              className={
                mobile
                  ? "min-w-0 px-5 pb-6 pt-2"
                  : "flex min-w-0 flex-col justify-center p-7"
              }
            >
              <p
                className="mb-5 text-[10px] font-semibold uppercase tracking-[.22em]"
                style={muted}
              >
                Meet the store
              </p>
              {identity}
              {details}
              {actions}
            </div>
          </div>
        </section>
      );
    if (layout === "framed")
      return (
        <section
          data-header-layout="framed"
          className={cn("w-full", sectionClass)}
          data-sf="hero"
          style={sectionStyle}
        >
          {coverBox(mobile ? "2.2 / 1" : "4.5 / 1")}
          <div
            className={cn(
              "relative z-10 mx-auto",
              mobile
                ? "-mt-7 w-[calc(100%-24px)] p-5"
                : "-mt-10 w-[calc(100%-80px)] max-w-4xl p-7",
            )}
            style={{
              background: "var(--s-bg)",
              border: "1px solid var(--s-border)",
              borderRadius: 18,
              boxShadow: "0 12px 32px rgba(0,0,0,.06)",
            }}
          >
            <div
              className={
                mobile ? "" : "flex items-center justify-between gap-5"
              }
            >
              <div className="min-w-0 flex-1">{identity}</div>
              {!mobile && <div className="shrink-0">{followBtn}</div>}
            </div>
            {details}
            {mobile && actions}
          </div>
        </section>
      );
    return (
      <section
        data-header-layout="spotlight"
        className={cn("w-full", sectionClass)}
        data-sf="hero"
        style={sectionStyle}
      >
        <div
          className="grid items-center gap-6 border-y py-6"
          style={{
            borderColor: "var(--s-border)",
            gridTemplateColumns: mobile
              ? "minmax(0,1fr)"
              : "minmax(0,1fr) minmax(180px,.55fr)",
          }}
        >
          <div className="min-w-0">
            <p
              className="mb-3 text-[10px] font-semibold uppercase tracking-[.22em]"
              style={muted}
            >
              Independent store
            </p>
            <div className="flex items-start gap-2">
              <h1
                className={cn(
                  "break-words font-semibold leading-[1.05] tracking-tight",
                  mobile ? "text-4xl" : "text-5xl",
                )}
                style={{ overflowWrap: "anywhere" }}
              >
                {d.storeName || "Your store"}
              </h1>
              {d.showVerifiedBadge && verified && (
                <BadgeCheck
                  className="mt-2 h-6 w-6 shrink-0"
                  style={{ color: "var(--s-primary)" }}
                  aria-label="Verified seller"
                />
              )}
            </div>
            <p className="mt-3 text-xs" style={muted}>
              {meta.join(" · ")}
            </p>
            {details}
            {actions}
          </div>
          <div
            className={
              mobile
                ? "hidden"
                : "mx-auto w-full max-w-xs overflow-hidden rounded-t-full"
            }
          >
            {coverBox("1 / 1")}
          </div>
        </div>
      </section>
    );
  }

  /* Yokai: the cover lives in the hero, so the Header layout picker shapes
     this profile row instead: centered, classic (with bio) or one tight row. */
  if (slim) {
    const big = layout === "standard" || layout === "overlap";
    const size =
      layout === "compact" || layout === "minimal" ? 44 : big ? 72 : 56;
    const centeredRow = layout === "centered";
    return (
      <div
        className={cn(
          "flex min-w-0 gap-3",
          centeredRow
            ? "w-full flex-col items-center text-center"
            : "items-center",
        )}
      >
        <span
          className="shrink-0 overflow-hidden rounded-full"
          style={{ border: "1px solid var(--s-border)" }}
        >
          <Mark d={d} size={size} />
        </span>
        <div className="min-w-0">
          <div
            className={cn(
              "flex items-center gap-1.5",
              centeredRow && "justify-center",
            )}
          >
            <h1
              className={cn(
                "truncate font-semibold leading-tight tracking-tight",
                big || centeredRow ? "text-xl" : "text-base",
              )}
            >
              {d.storeName || "Your store"}
            </h1>
            {d.showVerifiedBadge && verified && (
              <BadgeCheck
                className="h-4 w-4 shrink-0"
                style={{ color: "var(--s-primary)" }}
                aria-label="Verified seller"
              />
            )}
          </div>
          <p className="truncate text-xs" style={muted}>
            @{d.storeSlug || "your-store"} · {meta.join(" · ")}
          </p>
          {(big || centeredRow) && bio && (
            <p className="mt-1 line-clamp-2 max-w-md text-xs" style={muted}>
              {bio}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {!mobile && wishlistLink}
          {followBtn}
        </div>
      </div>
    );
  }

  /* Banner: name and avatar sit on a tall cover, over a dark fade. */
  if (layout === "banner") {
    const size = mobile ? 56 : 88;
    return (
      <section className={sectionClass} data-sf="hero" style={sectionStyle}>
        {coverBox(
          mobile ? "1.3 / 1" : "2.5 / 1",
          <>
            <span
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(0,0,0,.74) 0%, rgba(0,0,0,.12) 62%, rgba(0,0,0,.08) 100%)",
              }}
              aria-hidden
            />
            <div
              className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-4 sm:gap-5 sm:p-8"
              style={{ color: "#ffffff" }}
            >
              <span
                className="shrink-0 overflow-hidden rounded-full"
                style={{ border: "3px solid rgba(255,255,255,.9)" }}
              >
                <Mark d={d} size={size} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h1 className="truncate text-xl font-semibold leading-tight tracking-tight sm:text-4xl">
                    {d.storeName || "Your store"}
                  </h1>
                  {d.showVerifiedBadge && verified && (
                    <BadgeCheck
                      className="h-5 w-5 shrink-0 sm:h-7 sm:w-7"
                      aria-label="Verified seller"
                    />
                  )}
                </div>
                <p className="mt-0.5 truncate text-sm opacity-80">
                  @{d.storeSlug || "your-store"}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs opacity-80 sm:text-sm">
                  {meta.map((m, i) => (
                    <span key={m} className="inline-flex items-center gap-2">
                      {i > 0 && <span aria-hidden>·</span>}
                      {m}
                    </span>
                  ))}
                </p>
              </div>
              <button
                type="button"
                onClick={toggleFollow}
                aria-pressed={following}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full px-5 text-sm font-semibold transition-all duration-300 active:scale-95 sm:h-12 sm:px-8 sm:text-base"
                style={
                  following
                    ? {
                        background: "transparent",
                        color: "#ffffff",
                        border: "1px solid rgba(255,255,255,.8)",
                      }
                    : {
                        background: "#ffffff",
                        color: "#111111",
                        border: "1px solid transparent",
                      }
                }
              >
                {following && <Check className="h-4 w-4" />}
                {following ? "Following" : "Follow"}
              </button>
            </div>
          </>,
        )}
        {bioEl}
      </section>
    );
  }

  /* Split: a profile card beside the cover (cover first on phones). */
  if (layout === "split") {
    return (
      <section className={sectionClass} data-sf="hero" style={sectionStyle}>
        <div
          className={cn(
            "grid gap-3 sm:gap-4",
            !mobile && "grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-stretch",
          )}
        >
          <div
            className={cn(
              "flex flex-col justify-center p-5 sm:p-8",
              mobile && "order-2",
            )}
            style={{
              background: "var(--s-bg)",
              border: "1px solid var(--s-border)",
              borderRadius: mobile ? 20 : 24,
            }}
          >
            <div className="flex self-start">{avatarEl}</div>
            <div className="mt-4">{nameEl}</div>
            {bioEl}
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
              {followBtn}
              {wishlistLink}
            </div>
          </div>
          <div className={mobile ? "order-1" : "h-full"}>
            {coverBox(mobile ? "2 / 1" : "auto", null, !mobile)}
          </div>
        </div>
      </section>
    );
  }

  /* Minimal: no cover, one clean row. */
  if (layout === "minimal") {
    return (
      <section className={sectionClass} data-sf="hero" style={sectionStyle}>
        <div
          className="flex items-center gap-4 pb-5 sm:gap-6"
          style={{ borderBottom: "1px solid var(--s-border)" }}
        >
          {avatarEl}
          {nameEl}
          <div className="flex shrink-0 items-center gap-3">
            {!mobile && wishlistLink}
            {followBtn}
          </div>
        </div>
        {bioEl}
      </section>
    );
  }

  return (
    <section className={sectionClass} data-sf="hero" style={sectionStyle}>
      {coverEl}
      <div className={floating ? "relative z-10" : "mt-4"}>{body}</div>
      {bioEl}
    </section>
  );
}
