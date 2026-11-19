"use client";

import {
  type HomeSection,
  paymentLabels,
  sortLabels,
} from "@/lib/store-design/types";
import { BadgeCheck, RotateCcw, Truck, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/store-design/utilts";
import { Block, Heading, Link } from "./blocks";
import { INK, muted, tint } from "./tokens";
import { type Ctx } from "./types";

export function FeedHead({ ctx }: { ctx: Ctx }) {
  const { d, mobile, interactive } = ctx;
  if (!d.showSortMenu) return null;
  const labels = sortLabels as Record<string, string>;
  const keys = Object.keys(labels).slice(0, 3);
  if (keys.length && !keys.includes(d.defaultSort)) {
    keys[keys.length - 1] = d.defaultSort;
  }
  return (
    <div
      className={cn(
        "no-scrollbar flex items-center gap-2 overflow-x-auto",
        mobile && "px-4",
      )}
    >
      {keys.map((k) => {
        const on = k === d.defaultSort;
        return (
          <Link
            key={k}
            on={interactive}
            href={`/store/${d.storeSlug}/products`}
            className="shrink-0 whitespace-nowrap rounded-full px-5 py-2.5 text-xs font-semibold transition-transform active:scale-95"
            style={on ? INK : { background: "var(--s-surface)", ...muted }}
          >
            {labels[k]}
          </Link>
        );
      })}
    </div>
  );
}
export function TrustBar({ ctx, section }: { ctx: Ctx; section: HomeSection }) {
  const { d, verified, mobile, interactive } = ctx;
  const items: { icon: typeof Truck; title: string; text: string }[] = [];
  if (d.deliveryNote || d.freeDeliveryThreshold > 0) {
    items.push({
      icon: Truck,
      title: d.deliveryNote || "Fast delivery",
      text:
        d.freeDeliveryThreshold > 0
          ? `Free over ${formatPrice(d.freeDeliveryThreshold)}`
          : "Tracked to your door",
    });
  }
  if (d.showReturnPolicy) {
    items.push({
      icon: RotateCcw,
      title: "Easy returns",
      text: d.returnPolicy,
    });
  }
  if (d.showVerifiedBadge && verified) {
    items.push({
      icon: BadgeCheck,
      title: "Verified seller",
      text: "Identity checked by ShopBD",
    });
  }
  if (d.showPaymentBadges && d.paymentMethods.length > 0) {
    items.push({
      icon: Wallet,
      title: "Flexible payment",
      text: d.paymentMethods.map((m) => paymentLabels[m]).join(", "),
    });
  }
  if (items.length === 0) return null;
  return (
    <Block ctx={ctx} sf="trust">
      {section.title && (
        <Heading title={section.title} action={null} on={interactive} />
      )}
      <div
        className={cn(
          mobile
            ? "no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 [-webkit-overflow-scrolling:touch]"
            : "grid gap-4 p-4",
        )}
        style={
          mobile
            ? undefined
            : {
                gridTemplateColumns: `repeat(${Math.min(items.length, 4)}, minmax(0, 1fr))`,
                background: "var(--s-bg)",
                border: "1px solid var(--s-border)",
                borderRadius: 24,
              }
        }
      >
        {items.map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className={cn(
              "flex items-center gap-3",
              mobile && "w-64 shrink-0 snap-start rounded-[28px] p-4",
            )}
            style={mobile ? { background: "var(--s-surface)" } : undefined}
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={
                mobile
                  ? INK
                  : {
                      background: tint("var(--s-primary)", 12),
                      color: "var(--s-primary)",
                    }
              }
            >
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{title}</p>
              <p className="line-clamp-2 text-xs leading-5" style={muted}>
                {text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Block>
  );
}
