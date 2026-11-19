"use client";

import { type HomeSection } from "@/lib/store-design/types";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Block, Link } from "./blocks";
import { type Ctx } from "./types";

/* ------------------------------------------------------------------ */
/* Flash-sale countdown                                                */
/* ------------------------------------------------------------------ */

export function Countdown({ ctx, section }: { ctx: Ctx; section: HomeSection }) {
  const { d, mobile, interactive } = ctx;
  const base = `/store/${d.storeSlug}`;
  const end = useMemo(() => {
    const t = Date.parse(d.countdownEndsAt || "");
    return Number.isFinite(t) ? t : null;
  }, [d.countdownEndsAt]);

  /* Start empty so server and browser render the same first frame */
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  /* On a live store nothing shows until an end time is set, and the
   * section disappears when the offer is over. The editor shows a hint. */
  if (end === null && interactive) return null;
  const left = end !== null && now !== null ? end - now : null;
  if (left !== null && left <= 0 && interactive) return null;

  const secs = left === null ? null : Math.max(0, Math.floor(left / 1000));
  const parts: [string, number | null][] = [
    ["Days", secs === null ? null : Math.floor(secs / 86400)],
    ["Hours", secs === null ? null : Math.floor((secs % 86400) / 3600)],
    ["Min", secs === null ? null : Math.floor((secs % 3600) / 60)],
    ["Sec", secs === null ? null : secs % 60],
  ];
  const pad = (n: number | null) =>
    n === null ? "--" : String(n).padStart(2, "0");
  const url = d.countdownButtonUrl?.trim();

  return (
    <Block ctx={ctx}>
      <div
        className={cn(
          "flex gap-5 overflow-hidden p-5",
          mobile ? "flex-col" : "items-center justify-between p-7",
        )}
        style={{
          background:
            "linear-gradient(135deg, var(--s-primary), color-mix(in srgb, var(--s-primary) 60%, #000))",
          color: "var(--s-on-primary)",
          borderRadius: 28,
        }}
      >
        <div className="min-w-0 space-y-1.5">
          <h2 className="text-2xl font-extrabold leading-tight tracking-tight">
            {section.title || "Flash sale"}
          </h2>
          {d.countdownSubtitle && (
            <p className="text-sm opacity-85">{d.countdownSubtitle}</p>
          )}
          {end === null && (
            <p className="text-xs opacity-75">
              Set an end time in the editor to start the timer.
            </p>
          )}
          {d.countdownButtonText && (
            <Link
              on={interactive}
              href={url || `${base}/products`}
              className="mt-3 inline-flex h-11 items-center rounded-full px-6 text-sm font-semibold"
              style={{
                background: "var(--s-on-primary)",
                color: "var(--s-primary)",
              }}
            >
              {d.countdownButtonText}
            </Link>
          )}
        </div>
        <div className="flex shrink-0 gap-2.5" aria-live="off">
          {parts.map(([label, n]) => (
            <div
              key={label}
              className="flex w-[64px] flex-col items-center rounded-2xl py-3"
              style={{
                background:
                  "color-mix(in srgb, var(--s-on-primary) 14%, transparent)",
              }}
            >
              <span className="text-2xl font-extrabold tabular-nums leading-none">
                {pad(n)}
              </span>
              <span className="mt-1 text-[10px] font-medium uppercase tracking-wider opacity-80">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Block>
  );
}
