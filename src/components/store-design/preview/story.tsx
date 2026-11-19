"use client";

import { type HomeSection } from "@/lib/store-design/types";
import { cn } from "@/lib/utils";
import { img } from "@/lib/images";
import { Block, Mark } from "./blocks";
import { muted } from "./tokens";
import { type Ctx } from "./types";

export function Story({ ctx, section }: { ctx: Ctx; section: HomeSection }) {
  const { d, mobile, products } = ctx;
  const sold = products.reduce((n, p) => n + p.sold, 0);
  const avg = products.length
    ? products.reduce((n, p) => n + p.rating, 0) / products.length
    : 0;
  const stats = [
    { value: String(products.length), label: "Products" },
    { value: `${sold.toLocaleString("en-US")}+`, label: "Orders delivered" },
    { value: avg ? avg.toFixed(1) : "-", label: "Average rating" },
  ];
  return (
    <Block ctx={ctx}>
      <div
        className={cn(
          "grid items-center gap-6 rounded-[32px] p-4",
          !mobile && "grid-cols-[1fr_1.3fr] gap-8 p-6",
        )}
        style={{ background: "var(--s-surface)" }}
      >
        <div
          className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[24px]"
          style={{ background: "var(--s-bg)" }}
        >
          {d.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img(d.coverUrl, { width: 900 })}
              alt=""
              decoding="async"
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <Mark d={d} size={64} />
          )}
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight">
            {section.title || "About us"}
          </h2>
          <p className="text-sm leading-7" style={muted}>
            {d.storyText || d.description}
          </p>
          <div className="grid grid-cols-3 gap-3 pt-1">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs" style={muted}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Block>
  );
}
