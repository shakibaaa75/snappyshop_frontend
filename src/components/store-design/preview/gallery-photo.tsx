"use client";

import { type GalleryItem, type HomeSection } from "@/lib/store-design/types";
import { galleryImagePosition } from "@/lib/store-design/template-gallery";
import { cn } from "@/lib/utils";
import { Block, Link } from "./blocks";
import { GalleryStrip } from "./gallery-strip";
import { muted } from "./tokens";
import { type Ctx } from "./types";

export function PhotoGallery({ ctx, section }: { ctx: Ctx; section: HomeSection }) {
  const { d, mobile, interactive } = ctx;
  const real = d.galleryItems.filter((g) => g.imageUrl);
  /* The editor shows empty frames so sellers see where photos go */
  const demo = !interactive && real.length === 0;
  const items: GalleryItem[] = demo
    ? [1, 2, 3].map((n) => ({
        id: `demo-${n}`,
        imageUrl: "",
        caption: "Add your photos",
        price: "",
        url: "",
      }))
    : real;
  if (items.length === 0) return null;
  const style = d.galleryStyle;

  /* Look follows the active template: corner shape, photo ratio, column
     count, tile surface and heading alignment all come from the design. */
  const tileRadius =
    d.buttonRadius === "full" ? 24 : Math.round(ctx.radius * 1.5);
  const aspect =
    d.imageAspectRatio === "square"
      ? "1 / 1"
      : d.imageAspectRatio === "landscape"
        ? "4 / 3"
        : style === "strip"
          ? "3 / 4"
          : "4 / 5";
  const cols = mobile ? 2 : Math.min(4, Math.max(2, d.productsPerRow));
  const tileSurface =
    d.cardStyle === "soft"
      ? "color-mix(in srgb, var(--s-highlight, var(--s-surface)) 45%, var(--s-bg))"
      : "var(--s-surface)";
  const tileBorder =
    d.cardStyle === "bordered" ? "1px solid var(--s-border)" : undefined;
  const centeredHead = d.headerStyle === "centered";

  const cell = (g: GalleryItem, i: number, clone = false) => (
    <figure
      key={clone ? `${g.id}-clone` : g.id}
      {...(i === items.length - 1 && !clone ? { "data-strip-last": "" } : {})}
      {...(i === 0 && clone ? { "data-strip-clone": "" } : {})}
      {...(clone
        ? {
            "aria-hidden": true,
            ref: (n: HTMLElement | null) => n?.setAttribute("inert", ""),
          }
        : {})}
      className={cn(
        "min-w-0",
        style === "strip" &&
          (mobile
            ? "w-[62%] shrink-0 snap-start"
            : "w-[22%] shrink-0 snap-start"),
        style === "staggered" && i % 2 === 1 && (mobile ? "mt-8" : "mt-12"),
      )}
    >
      <Link on={interactive && !!g.url} href={g.url || "#"} className="block">
        <div
          className="w-full overflow-hidden"
          style={{
            aspectRatio: aspect,
            background: tileSurface,
            border: tileBorder,
            borderRadius: tileRadius,
          }}
        >
          {g.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              style={{
                objectPosition: galleryImagePosition(g),
                objectFit: g.imageFit === "contain" ? "contain" : "cover",
              }}
              src={g.imageUrl}
              alt={g.caption}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          )}
        </div>
      </Link>
      {(g.caption || g.price) && (
        <figcaption className="mt-3 flex items-baseline justify-between gap-3 text-xs">
          <span className="truncate">{g.caption}</span>
          <span className="shrink-0 tabular-nums" style={muted}>
            {g.price}
          </span>
        </figcaption>
      )}
    </figure>
  );

  return (
    <Block ctx={ctx}>
      <div
        className={cn(
          "mb-6 flex gap-4",
          centeredHead
            ? "flex-col items-center text-center"
            : mobile
              ? "flex-col"
              : "items-end justify-between",
        )}
      >
        <h2 className="text-3xl font-medium leading-tight tracking-tight">
          {section.title || "The collection"}
        </h2>
        {d.gallerySubtitle && (
          <p
            className={cn(
              "text-xs leading-relaxed",
              centeredHead ? "max-w-[420px]" : "max-w-[260px]",
            )}
            style={muted}
          >
            {d.gallerySubtitle}
          </p>
        )}
      </div>
      {style === "strip" ? (
        <GalleryStrip
          items={items}
          renderCell={cell}
          auto={!!d.galleryAutoScroll && !demo}
          speed={d.galleryScrollSpeed}
        />
      ) : (
        <div
          className="grid items-start gap-4"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          }}
        >
          {items.map((g, i) => cell(g, i))}
        </div>
      )}
    </Block>
  );
}
