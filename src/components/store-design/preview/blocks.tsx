"use client";

import {
  paymentColors,
  paymentLabels,
  type PaymentMethod,
  type StoreDesign,
} from "@/lib/store-design/types";
import {
  createContext,
  type CSSProperties,
  memo,
  type ReactNode,
  useContext,
} from "react";
import NextLink from "next/link";
import { ChevronRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { img } from "@/lib/images";
import { initials } from "@/lib/store-design/utilts";
import { CTA_BG, muted } from "./tokens";
import { type Ctx } from "./types";

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */

// This context exists only in the editor phone viewport. It never changes
// real storefront routing or enables cart/checkout side effects.
export const PreviewNavigation = createContext<((href: string) => void) | null>(
  null,
);
export function Link({
  on,
  href,
  className,
  style,
  title,
  children,
  onClick,
}: {
  on: boolean;
  href: string;
  className?: string;
  style?: CSSProperties;
  title?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  const previewNavigate = useContext(PreviewNavigation);
  if (!on && previewNavigate) {
    return (
      <button
        type="button"
        onClick={() => {
          onClick?.();
          previewNavigate(href);
        }}
        className={className}
        style={style}
        title={title}
        aria-label={title}
      >
        {children}
      </button>
    );
  }
  if (on) {
    return (
      <NextLink
        href={href}
        onClick={onClick}
        prefetch
        scroll={false}
        className={className}
        style={style}
        title={title}
        aria-label={title}
      >
        {children}
      </NextLink>
    );
  }
  return (
    <span className={className} style={style} title={title}>
      {children}
    </span>
  );
}
export function PButton({
  children,
  variant = "primary",
  small,
  className,
  href,
  interactive,
}: {
  children: ReactNode;
  variant?: "primary" | "outline";
  small?: boolean;
  className?: string;
  href?: string;
  interactive?: boolean;
}) {
  const style: CSSProperties =
    variant === "primary"
      ? { background: CTA_BG, color: "var(--s-on-primary)" }
      : { background: "var(--s-surface)", color: "var(--s-text)" };
  return (
    <Link
      on={!!interactive && !!href}
      href={href ?? "/"}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-transform duration-150 active:scale-[0.97]",
        small ? "h-10 px-4 text-xs" : "h-12 px-7 text-sm",
        className,
      )}
      style={style}
    >
      {children}
    </Link>
  );
}
export function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Star
        className="h-3.5 w-3.5"
        style={{ color: "#f59e0b" }}
        fill="currentColor"
      />
      <span className="font-medium" style={{ color: "var(--s-text)" }}>
        {value.toFixed(1)}
      </span>
    </span>
  );
}
export function Placeholder({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-[28px] border border-dashed px-4 py-10 text-center text-sm"
      style={{ borderColor: "var(--s-border)", ...muted }}
    >
      {children}
    </div>
  );
}
export function Block({
  ctx,
  children,
  sf = "section",
}: {
  ctx: Ctx;
  children: ReactNode;
  /** Hook name for template themes (e.g. the Grocery Pookie look). */
  sf?: "section" | "promo" | "trust" | "looks";
}) {
  return (
    <section className={ctx.mobile ? "px-4" : undefined} data-sf={sf}>
      {children}
    </section>
  );
}
export const Heading = memo(function Heading({
  title,
  action = "See all",
  href,
  on,
}: {
  title: string;
  action?: string | null;
  href?: string;
  on: boolean;
}) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <h2 className="text-xl font-bold leading-tight tracking-tight">
        {title}
      </h2>
      {action && (
        <Link
          on={on && !!href}
          href={href ?? "/"}
          className="flex shrink-0 items-center rounded-full py-1.5 pl-3.5 pr-2 text-xs font-semibold transition-opacity active:opacity-60"
          style={{ background: "var(--s-surface)" }}
        >
          {action}
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
});
export function PaymentBadges({ methods }: { methods: PaymentMethod[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {methods.map((m) => (
        <span
          key={m}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={{ background: "var(--s-bg)" }}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: paymentColors[m] }}
          />
          {paymentLabels[m]}
        </span>
      ))}
    </div>
  );
}
export function Mark({
  d,
  size = 32,
  round = true,
}: {
  d: StoreDesign;
  size?: number;
  round?: boolean;
}) {
  const shape = round ? "rounded-full" : "rounded-xl";
  if (d.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={img(d.logoUrl, { width: size * 2, height: size * 2 })}
        alt=""
        width={size}
        height={size}
        decoding="async"
        loading="eager"
        className={cn("shrink-0 object-cover", shape)}
        style={{ height: size, width: size }}
      />
    );
  }
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center font-bold",
        shape,
      )}
      style={{
        height: size,
        width: size,
        fontSize: Math.max(11, size * 0.36),
        background: CTA_BG,
        color: "var(--s-on-primary)",
      }}
    >
      {initials(d.storeName)}
    </span>
  );
}
export function Badge({ n }: { n: number }) {
  return (
    <span
      className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
      style={{
        background: "var(--s-secondary)",
        color: "var(--s-on-secondary)",
      }}
    >
      {n}
    </span>
  );
}
