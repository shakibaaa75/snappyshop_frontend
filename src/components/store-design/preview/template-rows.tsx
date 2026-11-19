"use client";

import { type HomeSection } from "@/lib/store-design/types";
import {
  balancedSectionRows,
  type PageLayout,
} from "@/lib/store-design/template-page-layout";
import { useEffect, useRef, useState } from "react";
import { useStoreElementWidth } from "./balanced-grid";
import { SectionRenderer } from "./section-renderer";
import { type Ctx } from "./types";

/** Layout belongs to the template; section content and seller ordering stay intact. */
export function TemplatePageSections({
  ctx,
  sections,
  plan,
}: {
  ctx: Ctx;
  sections: HomeSection[];
  plan: PageLayout;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const width = useStoreElementWidth(ref, ctx.mobile ? 390 : 1000);
  const compact = ctx.mobile || width < 800;
  const rows = balancedSectionRows(
    plan,
    sections.map((section) => section.id),
    width,
    compact,
  );
  return (
    <div
      ref={ref}
      data-page-composition={ctx.d.template}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: compact ? Math.min(24, plan.mobileGap) : Math.min(40, plan.gap),
        minWidth: 0,
      }}
    >
      {rows.map((row) => (
        <BalancedTemplateRow
          key={`${row.map((slot) => slot.id).join("-")}:${Math.floor(width / 100)}:${ctx.products.length}`}
          ctx={ctx}
          plan={plan}
          sections={row.map(
            (slot) => sections.find((section) => section.id === slot.id)!,
          )}
          spans={row.map((slot) => slot.span)}
          width={width}
        />
      ))}
    </div>
  );
}
/** A short section should never leave a tall empty column beside a long one. */
function BalancedTemplateRow({
  ctx,
  plan,
  sections,
  spans,
  width,
}: {
  ctx: Ctx;
  plan: PageLayout;
  sections: HomeSection[];
  spans: number[];
  width: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [stacked, setStacked] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || sections.length < 2 || stacked) return;
    const measure = () => {
      const heights = Array.from(el.children).map(
        (child) => child.getBoundingClientRect().height,
      );
      const shortest = Math.min(...heights),
        tallest = Math.max(...heights);
      if (
        shortest < 4 ||
        (tallest - shortest > 160 && tallest > shortest * 1.55)
      )
        setStacked(true);
    };
    const observer = new ResizeObserver(measure);
    Array.from(el.children).forEach((child) => observer.observe(child));
    measure();
    return () => observer.disconnect();
  }, [sections.length, stacked]);
  const gap = ctx.mobile
    ? Math.min(24, plan.mobileGap)
    : Math.min(32, plan.gap);
  return (
    <div
      ref={ref}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
        gap,
        alignItems: "start",
        minWidth: 0,
      }}
    >
      {sections.map((section, index) => {
        const span = stacked ? 12 : spans[index];
        const slotWidth = span === 12 ? width : ((width - gap) * span) / 12;
        const framed = plan.treatment === "panels" && section.id !== "hero";
        const ruled = plan.treatment === "rules" && section.id !== "hero";
        const local = { ...ctx, mobile: ctx.mobile || slotWidth < 620 };
        return (
          <div
            key={section.id}
            className="empty:hidden"
            data-layout-section={section.id}
            style={{
              gridColumn: `span ${span}`,
              minWidth: 0,
              padding: framed
                ? local.mobile
                  ? "16px 0"
                  : 20
                : ruled
                  ? "20px 0 0"
                  : undefined,
              border: framed ? "1px solid var(--s-border)" : undefined,
              borderTop: ruled ? "1px solid var(--s-border)" : undefined,
              borderRadius: framed ? plan.radius : undefined,
              background: framed ? "var(--s-surface)" : undefined,
            }}
          >
            <SectionRenderer section={section} ctx={local} />
          </div>
        );
      })}
    </div>
  );
}
