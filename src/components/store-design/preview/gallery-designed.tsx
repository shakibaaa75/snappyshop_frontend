"use client";

import { type GalleryItem, type HomeSection } from "@/lib/store-design/types";
import {
  galleryImagePosition,
  templateGallery,
} from "@/lib/store-design/template-gallery";
import { useRef } from "react";
import { Block, Link } from "./blocks";
import { useGalleryAutoScroll } from "./gallery-autoscroll";
import { GALLERY_DEMO } from "./gallery-demo";
import { muted } from "./tokens";
import { type Ctx } from "./types";

export function DesignedGallery({ ctx, section }: { ctx: Ctx; section: HomeSection }) {
  const { d, mobile, interactive } = ctx;
  const layout = templateGallery(d.template, d.galleryLayout);
  const real = d.galleryItems.filter((g) => g.imageUrl || g.caption || g.color);
  const items: GalleryItem[] =
    !interactive && real.length === 0 ? GALLERY_DEMO : real;
  const railRef = useRef<HTMLDivElement>(null);
  useGalleryAutoScroll(
    railRef,
    layout.mode === "rail" && !!d.galleryAutoScroll && items.length > 1,
    d.galleryScrollSpeed,
    layout.id + items.length,
  );
  if (!items.length) return null;
  const rail = layout.mode === "rail";
  const columns = mobile ? Math.min(2, layout.columns) : layout.columns;
  const gap = mobile ? 14 : Math.max(20, layout.gap);
  const rowHeight = mobile ? 110 : 150;
  const overlay =
    layout.caption === "overlay" &&
    layout.cells.some((cell) => cell.columns > 1);
  const side = layout.caption === "side" && !mobile;
  const shape = layout.shape;
  const radius =
    shape === "circle"
      ? "50%"
      : shape === "arch"
        ? "48% 48% 8px 8px"
        : shape === "blob"
          ? "35% 12% 30% 12%"
          : shape === "soft"
            ? "16px"
            : shape === "ticket"
              ? "20px 4px 20px 4px"
              : "0";
  const cut =
    shape === "cut"
      ? "polygon(8% 0,100% 0,92% 100%,0 100%)"
      : shape === "bevel"
        ? "polygon(0 0,90% 0,100% 10%,100% 100%,10% 100%,0 90%)"
        : undefined;
  return (
    <Block ctx={ctx}>
      <div
        style={{
          marginBottom: 24,
          textAlign: shape === "circle" || shape === "arch" ? "center" : "left",
        }}
      >
        <h2 className="text-2xl font-semibold tracking-tight">
          {section.title || "The collection"}
        </h2>
        {d.gallerySubtitle && (
          <p className="mt-2 text-sm" style={muted}>
            {d.gallerySubtitle}
          </p>
        )}
      </div>
      <div
        ref={railRef}
        data-template-gallery={d.template}
        data-gallery-layout={layout.id}
        style={{
          display: rail ? "flex" : "grid",
          gridTemplateColumns: rail
            ? undefined
            : `repeat(${columns}, minmax(0, 1fr))`,
          gridAutoRows: rail ? undefined : `minmax(${rowHeight}px, auto)`,
          gap,
          alignItems: "stretch",
          overflowX: rail ? "auto" : undefined,
          scrollSnapType: rail ? "x proximity" : undefined,
          padding: shape === "print" || shape === "film" ? 10 : 0,
          paddingBottom: rail ? 20 : undefined,
        }}
      >
        {items.map((g, index) => {
          const cell = layout.cells[index % layout.cells.length];
          const rows = mobile ? Math.min(cell.rows, 3) : cell.rows;
          const hasText = !!(
            g.caption ||
            g.price ||
            g.eyebrow ||
            g.badge ||
            g.buttonText
          );
          const light = g.tone !== "dark";
          return (
            <figure
              key={g.id}
              style={{
                margin: 0,
                minWidth: 0,
                position: "relative",
                gridColumn: rail
                  ? undefined
                  : `span ${Math.min(cell.columns, columns)}`,
                gridRow: rail ? undefined : `span ${rows}`,
                flex: rail
                  ? `0 0 ${mobile ? "78%" : `${Math.max(22, 90 / layout.columns)}%`}`
                  : undefined,
                height: rail ? rows * rowHeight : undefined,
                scrollSnapAlign: rail ? "start" : undefined,
                paddingTop: !mobile && index % 2 ? layout.stagger : 0,
                transform:
                  !mobile && shape === "print"
                    ? `rotate(${index % 2 ? 1.5 : -1.5}deg)`
                    : undefined,
                borderBottom:
                  shape === "shelf" ? "5px solid var(--s-border)" : undefined,
              }}
            >
              <Link
                on={interactive && !!g.url}
                href={g.url || "#"}
                className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  display: "flex",
                  flexDirection: side
                    ? index % 2
                      ? "row-reverse"
                      : "row"
                    : "column",
                  height: "100%",
                  minWidth: 0,
                  position: "relative",
                  padding:
                    shape === "print"
                      ? "10px 10px 20px"
                      : shape === "film"
                        ? "10px 6px"
                        : 0,
                  background:
                    shape === "print" ? "var(--s-surface)" : undefined,
                  border:
                    shape === "outline" || shape === "bevel"
                      ? "1px solid var(--s-border)"
                      : undefined,
                  borderTop:
                    shape === "film" ? "6px dotted var(--s-border)" : undefined,
                  borderBottom:
                    shape === "film" ? "6px dotted var(--s-border)" : undefined,
                }}
              >
                <div
                  style={{
                    position: "relative",
                    flex: side ? "0 0 55%" : "1 1 0",
                    minHeight: 0,
                    minWidth: 0,
                    borderRadius: radius,
                    clipPath: cut,
                    overflow: "hidden",
                    background: g.color || "var(--s-surface)",
                  }}
                >
                  {g.imageUrl && (
                    <img
                      src={g.imageUrl}
                      alt={g.caption || "Gallery image"}
                      loading="lazy"
                      decoding="async"
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit:
                          g.imageFit === "contain" ? "contain" : "cover",
                        objectPosition: galleryImagePosition(g),
                      }}
                    />
                  )}
                </div>
                {hasText && (
                  <div
                    style={{
                      position: overlay ? "absolute" : "relative",
                      left: overlay ? 0 : undefined,
                      right: overlay ? 0 : undefined,
                      bottom: overlay ? 0 : undefined,
                      padding: overlay
                        ? "48px 22px 22px"
                        : side
                          ? 20
                          : "14px 2px",
                      minWidth: 0,
                      flex: side ? "1 1 0" : undefined,
                      maxHeight: overlay ? "100%" : side ? undefined : "48%",
                      overflow: "auto",
                      overflowWrap: "anywhere",
                      background: overlay
                        ? `linear-gradient(transparent, ${light ? "rgba(0,0,0,.8)" : "rgba(255,255,255,.94)"})`
                        : undefined,
                      color: overlay
                        ? light
                          ? "#fff"
                          : "#111"
                        : "var(--s-text)",
                      textAlign:
                        shape === "circle" || shape === "arch"
                          ? "center"
                          : "left",
                    }}
                  >
                    {layout.caption === "numbered" && (
                      <span
                        style={{
                          display: "block",
                          fontSize: 10,
                          opacity: 0.65,
                          marginBottom: 6,
                        }}
                      >
                        {String(index + 1).padStart(2, "0")} / COLLECTION
                      </span>
                    )}
                    {g.eyebrow && (
                      <span
                        style={{
                          display: "block",
                          fontSize: 10,
                          letterSpacing: ".12em",
                          marginBottom: 6,
                        }}
                      >
                        {g.eyebrow}
                      </span>
                    )}
                    {g.badge && (
                      <strong
                        style={{ display: "block", fontSize: mobile ? 24 : 36 }}
                      >
                        {g.badge}
                      </strong>
                    )}
                    {g.caption && (
                      <span
                        style={{
                          display: "block",
                          fontSize: overlay && !mobile ? 23 : 14,
                          fontWeight: 600,
                          lineHeight: 1.25,
                        }}
                      >
                        {g.caption}
                      </span>
                    )}
                    {g.price && (
                      <span
                        style={{ display: "block", fontSize: 12, marginTop: 6 }}
                      >
                        {g.price}
                      </span>
                    )}
                    {g.buttonText && g.url && (
                      <span
                        style={{
                          display: "inline-block",
                          marginTop: 10,
                          paddingBottom: 3,
                          borderBottom: "1px solid currentColor",
                          fontSize: 11,
                        }}
                      >
                        {g.buttonText} →
                      </span>
                    )}
                  </div>
                )}
              </Link>
            </figure>
          );
        })}
      </div>
    </Block>
  );
}
