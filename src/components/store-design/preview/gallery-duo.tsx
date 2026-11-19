"use client";

import { type GalleryItem, type HomeSection } from "@/lib/store-design/types";
import { galleryImagePosition } from "@/lib/store-design/template-gallery";
import { Block, Link } from "./blocks";
import { CAT_FADE } from "./category-tiles";
import { type Ctx } from "./types";

export const DUO_DEMO: GalleryItem[] = [
  {
    id: "duo-1",
    imageUrl: "",
    caption: "The votes are in",
    price: "",
    url: "",
    eyebrow: "Summer",
    buttonText: "Shop now",
    color: "#E7DCCB",
    tone: "dark",
  },
  {
    id: "duo-2",
    imageUrl: "",
    caption: "Light is in",
    price: "",
    url: "",
    eyebrow: "New",
    buttonText: "Shop now",
    color: "#CBD5DB",
    tone: "dark",
  },
];
/**
 * Casual gallery: large photo tiles, two per row, headline and button in the
 * bottom-left corner. One tile per photo; a leftover last tile spans the row.
 */
export function DuoGallery({ ctx, section }: { ctx: Ctx; section: HomeSection }) {
  const { mobile, interactive } = ctx;
  const real = ctx.d.galleryItems.filter(
    (g) => g.imageUrl || g.caption || g.badge,
  );
  const demo = !interactive && real.length === 0;
  const items = demo ? DUO_DEMO : real;
  if (items.length === 0) return null;
  const odd = items.length % 2 === 1;

  return (
    <Block ctx={ctx}>
      <h2 className="sr-only">{section.title || "Featured"}</h2>
      <div
        className="grid"
        style={{
          gap: 4,
          gridTemplateColumns: mobile
            ? "minmax(0, 1fr)"
            : "repeat(2, minmax(0, 1fr))",
        }}
      >
        {items.map((g, i) => {
          const wide = !mobile && odd && i === items.length - 1 && i > 0;
          const light = g.tone === "light";
          const ink = light ? "#ffffff" : "#111111";
          const label = g.caption || g.buttonText || "View";
          return (
            <figure
              key={g.id}
              className="@container group relative isolate m-0 min-w-0 overflow-hidden"
              style={{
                aspectRatio: wide ? "2.4 / 1" : mobile ? "4 / 5" : "1 / 1.05",
                gridColumn: wide ? "1 / -1" : undefined,
                background: g.color || "var(--s-surface)",
                color: ink,
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
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.03]"
                />
              )}
              {light && g.imageUrl && (
                <span
                  className="pointer-events-none absolute inset-0 -z-10"
                  style={{ background: CAT_FADE.soft }}
                  aria-hidden
                />
              )}
              <div
                className="flex h-full flex-col items-start justify-end"
                style={{
                  padding: "clamp(16px, 5cqw, 36px)",
                  gap: "clamp(8px, 2.5cqw, 14px)",
                }}
              >
                {g.eyebrow && (
                  <p className="text-[10px] font-medium uppercase leading-none tracking-[0.12em] opacity-80">
                    {g.eyebrow}
                  </p>
                )}
                {g.badge && (
                  <p
                    className="font-semibold leading-none tracking-tight"
                    style={{ fontSize: "clamp(36px, 14cqw, 80px)" }}
                  >
                    {g.badge}
                  </p>
                )}
                {g.caption && (
                  <p
                    className="font-semibold leading-[1.05] tracking-tight"
                    style={{
                      fontSize: "clamp(22px, 7cqw, 40px)",
                      maxWidth: "14ch",
                    }}
                  >
                    {g.caption}
                  </p>
                )}
                {g.buttonText && (!interactive || !!g.url) && (
                  <span
                    className="inline-flex h-9 items-center px-5 text-xs font-semibold"
                    style={{ background: "#ffffff", color: "#111111" }}
                  >
                    {g.buttonText}
                  </span>
                )}
              </div>
              {interactive && g.url && (
                <Link
                  on
                  href={g.url}
                  title={label}
                  className="absolute inset-0 z-10"
                >
                  <span className="sr-only">{label}</span>
                </Link>
              )}
            </figure>
          );
        })}
      </div>
    </Block>
  );
}
