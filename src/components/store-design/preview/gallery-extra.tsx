"use client";

import { type GalleryItem, type HomeSection } from "@/lib/store-design/types";
import {
  galleryImagePosition,
  isScrollingGallery,
  templateGallery,
} from "@/lib/store-design/template-gallery";
import { type ReactNode, useRef, useState } from "react";
import { img } from "@/lib/images";
import { Block, Link } from "./blocks";
import { CAT_FADE } from "./category-tiles";
import { useGalleryAutoScroll } from "./gallery-autoscroll";
import { BentoGallery } from "./gallery-bento";
import { Coverflow } from "./gallery-coverflow";
import { GALLERY_DEMO } from "./gallery-demo";
import { DesignedGallery } from "./gallery-designed";
import { DuoGallery } from "./gallery-duo";
import { PhotoGallery } from "./gallery-photo";
import { muted } from "./tokens";
import { type Ctx } from "./types";

/**
 * Masonry, Feature, Polaroid and Marquee galleries. They share one heading
 * and one tile; only the arrangement changes.
 */
function GalleryExtra({
  ctx,
  section,
  style,
}: {
  ctx: Ctx;
  section: HomeSection;
  style: "masonry" | "feature" | "polaroid" | "marquee";
}) {
  const { d, mobile, interactive } = ctx;
  const real = d.galleryItems.filter((g) => g.imageUrl || g.caption || g.color);
  const demo = !interactive && real.length === 0;
  const marqueeRef = useRef<HTMLDivElement>(null);
  useGalleryAutoScroll(
    marqueeRef,
    style === "marquee" && !!d.galleryAutoScroll && real.length > 1,
    d.galleryScrollSpeed,
    String(real.length),
  );
  const items = demo ? GALLERY_DEMO : real;
  if (items.length === 0) return null;

  const radius = d.buttonRadius === "full" ? 20 : Math.round(ctx.radius * 1.2);
  const ratios = ["4 / 5", "1 / 1", "3 / 4", "4 / 3", "4 / 5", "1 / 1"];

  /* One photo. `fill` stretches it to its grid cell instead of a ratio. */
  const tile = (
    g: GalleryItem,
    o: { ratio?: string; fill?: boolean; below?: boolean; r?: number } = {},
  ) => {
    const inner = (
      <>
        <div
          className="relative w-full overflow-hidden"
          style={{
            aspectRatio: o.fill ? undefined : o.ratio,
            height: o.fill ? "100%" : undefined,
            minHeight: o.fill ? 120 : undefined,
            borderRadius: o.r ?? radius,
            background: g.color || "var(--s-surface)",
          }}
        >
          {g.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              style={{
                objectPosition: galleryImagePosition(g),
                objectFit: g.imageFit === "contain" ? "contain" : "cover",
              }}
              src={img(g.imageUrl, { width: 900 })}
              alt={g.caption || ""}
              loading="lazy"
              decoding="async"
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.04]"
            />
          ) : (
            <span
              className="absolute inset-0 flex items-center justify-center text-xs opacity-50"
              aria-hidden
            >
              {g.caption}
            </span>
          )}
          {!o.below && g.caption && g.imageUrl && (
            <span
              className="absolute inset-x-0 bottom-0 p-3 text-sm font-semibold text-white"
              style={{ background: CAT_FADE.soft }}
            >
              {g.caption}
              {g.price && (
                <span className="ml-2 font-normal opacity-85">{g.price}</span>
              )}
            </span>
          )}
        </div>
        {o.below && (g.caption || g.price) && (
          <p className="mt-2 flex items-baseline justify-between gap-2 text-sm">
            <span className="truncate font-medium">{g.caption}</span>
            {g.price && <span style={muted}>{g.price}</span>}
          </p>
        )}
      </>
    );
    return interactive && g.url ? (
      <Link
        on
        href={g.url}
        title={g.caption || "View"}
        className="group block h-full"
      >
        {inner}
      </Link>
    ) : (
      <div className="group h-full">{inner}</div>
    );
  };

  let body: ReactNode;
  if (style === "masonry") {
    body = (
      <div style={{ columnCount: mobile ? 2 : 3, columnGap: mobile ? 8 : 14 }}>
        {items.map((g, i) => (
          <div
            key={g.id}
            className="mb-3 break-inside-avoid sm:mb-3.5"
            style={{ breakInside: "avoid" }}
          >
            {tile(g, { ratio: ratios[i % ratios.length] })}
          </div>
        ))}
      </div>
    );
  } else if (style === "feature") {
    const [first, ...rest] = items;
    const small = rest.slice(0, 4);
    body = mobile ? (
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">{tile(first, { ratio: "4 / 3" })}</div>
        {small.map((g) => (
          <div key={g.id}>{tile(g, { ratio: "1 / 1" })}</div>
        ))}
      </div>
    ) : (
      <div
        className="grid gap-3.5"
        style={{
          gridTemplateColumns: "2fr 1fr 1fr",
          gridTemplateRows: "repeat(2, minmax(0, 1fr))",
          aspectRatio: "2.1 / 1",
        }}
      >
        <div style={{ gridRow: "1 / span 2" }}>
          {tile(first, { fill: true })}
        </div>
        {small.map((g) => (
          <div key={g.id} className="min-h-0">
            {tile(g, { fill: true })}
          </div>
        ))}
      </div>
    );
  } else if (style === "polaroid") {
    const tilt = [-2.5, 1.8, -1.2, 2.4, -1.8, 1.4];
    body = (
      <div
        className="grid"
        style={{
          gap: mobile ? 14 : 28,
          gridTemplateColumns: `repeat(${mobile ? 2 : Math.min(4, Math.max(3, items.length))}, minmax(0, 1fr))`,
          padding: mobile ? "6px 4px" : "10px 8px",
        }}
      >
        {items.map((g, i) => (
          <div
            key={g.id}
            className="transition-transform duration-300 hover:!rotate-0 hover:scale-[1.03]"
            style={{
              transform: `rotate(${tilt[i % tilt.length]}deg)`,
              background: "#fff",
              color: "#111",
              padding: "8px 8px 0",
              boxShadow:
                "0 2px 4px rgba(16,16,24,.08), 0 14px 26px -12px rgba(16,16,24,.3)",
            }}
          >
            {tile(g, { ratio: "1 / 1", r: 0 })}
            <p className="truncate px-1 py-2.5 text-center text-xs font-medium">
              {g.caption || "\u00a0"}
            </p>
          </div>
        ))}
      </div>
    );
  } else {
    body = (
      <div ref={marqueeRef} className="flex gap-3 overflow-x-auto pb-4">
        {items.map((g) => (
          <div
            key={g.id}
            className="shrink-0"
            style={{ width: mobile ? 180 : 260 }}
          >
            {tile(g, { ratio: "3 / 4", below: true })}
          </div>
        ))}
      </div>
    );
  }

  return (
    <Block ctx={ctx}>
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 className="text-xl font-bold leading-tight tracking-tight">
          {section.title || "Gallery"}
        </h2>
        {d.gallerySubtitle && (
          <p className="max-w-md text-sm" style={muted}>
            {d.gallerySubtitle}
          </p>
        )}
      </div>
      {body}
      {style === "feature" && items.length > 5 && (
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          {items.slice(5).map((g) => (
            <div key={g.id}>{tile(g, { ratio: "1 / 1", below: true })}</div>
          ))}
        </div>
      )}
    </Block>
  );
}
export function Gallery({ ctx, section }: { ctx: Ctx; section: HomeSection }) {
  const plan = templateGallery(ctx.d.template, ctx.d.galleryLayout);
  const [paused, setPaused] = useState(false);
  const scoped = {
    ...ctx,
    d: {
      ...ctx.d,
      galleryStyle: plan.base,
      galleryAutoScroll: !!ctx.d.galleryAutoScroll && !paused,
    },
  };
  const props = { ctx: scoped, section };
  let content: ReactNode;
  switch (plan.renderer) {
    case "coverflow":
      content = <Coverflow {...props} />;
      break;
    case "bento":
      content = <BentoGallery {...props} />;
      break;
    case "duo":
      content = <DuoGallery {...props} />;
      break;
    case "masonry":
    case "feature":
    case "polaroid":
    case "marquee":
      content = <GalleryExtra {...props} style={plan.renderer} />;
      break;
    case "grid":
    case "strip":
    case "staggered":
      content = <PhotoGallery {...props} />;
      break;
    default:
      content = <DesignedGallery {...props} />;
  }
  return (
    <div>
      {content}
      {ctx.d.galleryAutoScroll && isScrollingGallery(plan) && (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => setPaused((value) => !value)}
            aria-pressed={paused}
            className="rounded-full border px-4 py-2 text-xs focus-visible:outline focus-visible:outline-2"
            style={{ borderColor: "var(--s-border)" }}
          >
            {paused ? "Resume scrolling" : "Pause scrolling"}
          </button>
        </div>
      )}
    </div>
  );
}
