"use client";

import { type GalleryItem, type HomeSection } from "@/lib/store-design/types";
import { galleryImagePosition } from "@/lib/store-design/template-gallery";
import { type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { radiusPx, readableOn } from "@/lib/store-design/utilts";
import { Block, Link } from "./blocks";
import { type Ctx } from "./types";

/* ------------------------------------------------------------------ */
/* Bento gallery                                                       */
/*                                                                     */
/* The "Grid" gallery layout on the Bento templates: a tight mosaic of */
/* campaign tiles. Each tile is a photo (or a solid color) with its    */
/* own eyebrow, headline and button; one tile can carry a big offer    */
/* figure such as "50%". Four photos make one mosaic (tall tile left,  */
/* wide tile top right, two small tiles below); more photos start a    */
/* new mosaic, mirrored so the page does not look stamped.             */
/* ------------------------------------------------------------------ */

type BentoRole = "tall" | "wide" | "small";
interface BentoSlot {
  role: BentoRole;
  col: string;
  row: string;
}
interface BentoLayout {
  cols: string;
  ratio: string;
  slots: BentoSlot[];
}
export function bentoLayout(n: number, mirror: boolean): BentoLayout {
  switch (n) {
    case 4:
      return mirror
        ? {
            cols: "3fr 3fr 4fr",
            ratio: "2 / 1",
            slots: [
              { role: "tall", col: "3", row: "1 / span 2" },
              { role: "wide", col: "1 / span 2", row: "1" },
              { role: "small", col: "1", row: "2" },
              { role: "small", col: "2", row: "2" },
            ],
          }
        : {
            cols: "4fr 3fr 3fr",
            ratio: "2 / 1",
            slots: [
              { role: "tall", col: "1", row: "1 / span 2" },
              { role: "wide", col: "2 / span 2", row: "1" },
              { role: "small", col: "2", row: "2" },
              { role: "small", col: "3", row: "2" },
            ],
          };
    case 3:
      return mirror
        ? {
            cols: "6fr 4fr",
            ratio: "2 / 1",
            slots: [
              { role: "tall", col: "2", row: "1 / span 2" },
              { role: "small", col: "1", row: "1" },
              { role: "small", col: "1", row: "2" },
            ],
          }
        : {
            cols: "4fr 6fr",
            ratio: "2 / 1",
            slots: [
              { role: "tall", col: "1", row: "1 / span 2" },
              { role: "small", col: "2", row: "1" },
              { role: "small", col: "2", row: "2" },
            ],
          };
    case 2:
      return {
        cols: mirror ? "6fr 4fr" : "4fr 6fr",
        ratio: "2.4 / 1",
        slots: [
          { role: "wide", col: "1", row: "1" },
          { role: "wide", col: "2", row: "1" },
        ],
      };
    default:
      return {
        cols: "1fr",
        ratio: "3 / 1",
        slots: [{ role: "wide", col: "1", row: "1" }],
      };
  }
}
const BENTO_DEMO: GalleryItem[] = [
  {
    id: "demo-1",
    imageUrl: "",
    caption: "Your headline here",
    price: "",
    url: "",
    eyebrow: "New season",
    buttonText: "Shop now",
  },
  {
    id: "demo-2",
    imageUrl: "",
    caption: "Tell shoppers what is new",
    price: "",
    url: "",
    eyebrow: "Featured",
    buttonText: "Shop now",
  },
  {
    id: "demo-3",
    imageUrl: "",
    caption: "Another collection",
    price: "",
    url: "",
    eyebrow: "Collection",
    buttonText: "Shop now",
  },
  {
    id: "demo-4",
    imageUrl: "",
    caption: "A big offer",
    price: "",
    url: "",
    badge: "50%",
    buttonText: "Shop now",
  },
];
function BentoTile({
  g,
  role,
  demo,
  ctx,
  style,
}: {
  g: GalleryItem;
  role: BentoRole;
  demo: boolean;
  ctx: Ctx;
  style?: CSSProperties;
}) {
  const { d, mobile, interactive } = ctx;
  const hasImage = !!g.imageUrl;
  const solid = !hasImage;
  /* Text color: on a solid tile it is picked for contrast; on a photo it is
     the seller's choice (dark text for light photos, light for dark). */
  const fill =
    g.color || (demo && !g.badge ? "var(--s-surface)" : "var(--s-primary)");
  const ink = solid
    ? g.color
      ? readableOn(g.color)
      : demo && !g.badge
        ? "var(--s-text)"
        : "var(--s-on-primary)"
    : g.tone === "light"
      ? "#ffffff"
      : "#111111";
  const centered = !!g.badge;
  const showButton = !!g.buttonText && (!interactive || !!g.url);
  const radius = Math.min(radiusPx[d.buttonRadius], 6);
  const label = g.caption || g.buttonText || "View";

  return (
    <figure
      className="@container group relative isolate m-0 min-w-0 overflow-hidden"
      style={{
        background: fill,
        color: ink,
        borderRadius: radius,
        ...(mobile
          ? {
              gridColumn: role === "small" ? "span 1" : "1 / -1",
              aspectRatio:
                role === "small"
                  ? "1 / 1"
                  : role === "tall"
                    ? "5 / 4"
                    : "2 / 1",
            }
          : null),
        ...style,
      }}
    >
      {hasImage && (
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
      <div
        className={cn(
          "flex h-full flex-col",
          centered
            ? "items-center justify-center text-center"
            : "items-start justify-start",
        )}
        style={{
          padding: "clamp(14px, 6cqw, 28px)",
          gap: "clamp(8px, 3cqw, 14px)",
        }}
      >
        {g.eyebrow && (
          <p
            className="text-[10px] font-medium uppercase leading-none tracking-[0.1em]"
            style={{ opacity: 0.7 }}
          >
            {g.eyebrow}
          </p>
        )}
        {g.caption && (
          <p
            className="font-medium leading-[1.1] tracking-tight"
            style={{
              fontSize: "clamp(17px, 7cqw, 30px)",
              maxWidth: centered ? "14ch" : "13ch",
            }}
          >
            {g.caption}
          </p>
        )}
        {g.badge && (
          <p
            className="font-semibold leading-none tracking-tight"
            style={{ fontSize: "clamp(40px, 24cqw, 88px)" }}
          >
            {g.badge}
          </p>
        )}
        {showButton && (
          <span
            className="inline-flex h-8 items-center px-4 text-[11px] font-semibold"
            style={{
              background: "#ffffff",
              color: "#111111",
              borderRadius: radius,
            }}
          >
            {g.buttonText}
          </span>
        )}
      </div>
      {interactive && g.url && (
        <Link on href={g.url} title={label} className="absolute inset-0 z-10">
          <span className="sr-only">{label}</span>
        </Link>
      )}
    </figure>
  );
}
export function BentoGallery({ ctx, section }: { ctx: Ctx; section: HomeSection }) {
  const { d, mobile, interactive } = ctx;
  /* A tile needs a photo, or at least some text to show on a solid color. */
  const real = d.galleryItems.filter((g) => g.imageUrl || g.caption || g.badge);
  const demo = !interactive && real.length === 0;
  const items = demo ? BENTO_DEMO : real;
  if (items.length === 0) return null;

  const chunks: GalleryItem[][] = [];
  for (let i = 0; i < items.length; i += 4) chunks.push(items.slice(i, i + 4));

  return (
    <Block ctx={ctx}>
      <h2 className="sr-only">{section.title || "The collection"}</h2>
      <div className="flex flex-col" style={{ gap: 4 }}>
        {chunks.map((chunk, ci) => {
          const layout = bentoLayout(chunk.length, ci % 2 === 1);
          return (
            <div
              key={ci}
              className="grid"
              style={{
                gap: 4,
                ...(mobile
                  ? { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }
                  : {
                      gridTemplateColumns: layout.cols,
                      gridTemplateRows: chunk.length > 2 ? "1fr 1fr" : "1fr",
                      aspectRatio: layout.ratio,
                    }),
              }}
            >
              {chunk.map((g, i) => (
                <BentoTile
                  key={g.id}
                  g={g}
                  role={layout.slots[i].role}
                  demo={demo}
                  ctx={ctx}
                  style={
                    mobile
                      ? undefined
                      : {
                          gridColumn: layout.slots[i].col,
                          gridRow: layout.slots[i].row,
                        }
                  }
                />
              ))}
            </div>
          );
        })}
      </div>
    </Block>
  );
}
