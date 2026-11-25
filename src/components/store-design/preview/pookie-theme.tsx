"use client";

import { type CSSProperties } from "react";
import { type StoreDesign } from "@/lib/store-design/types";

/**
 * "Pookie" look for the Grocery template: soft pink page with floating hearts,
 * rounded section wrappers, gingham offer banners and a scalloped benefit strip.
 *
 * Everything is scoped to `[data-pookie]`, so other templates are untouched.
 * Colors come from the seller's theme variables (--s-primary, --s-secondary,
 * --s-bg), so a different colorway recolors the hearts too.
 */
export const isPookie = (d: StoreDesign) => d.template === "grocery";

const svg = (body: string, w: number, h: number) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>${body}</svg>`,
  )}")`;

const HEART =
  "M12 21s-7-4.6-9.6-9.2C.7 8.5 2.5 4.4 6.4 4.4c2.2 0 4 1.3 5.6 3.3 1.6-2 3.4-3.3 5.6-3.3 3.9 0 5.7 4.1 4 7.4C19 16.4 12 21 12 21z";

/** Black hearts of different sizes and tilts. Used as a mask, so only the shape matters. */
const heart = (x: number, y: number, s: number, r: number) =>
  `<path transform='translate(${x} ${y}) rotate(${r} ${12 * s} ${12 * s}) scale(${s})' d='${HEART}'/>`;

const HEARTS_TILE = svg(
  [
    heart(14, 10, 1.3, -14),
    heart(96, 34, 0.7, 12),
    heart(54, 78, 1, 8),
    heart(150, 96, 1.5, -10),
    heart(24, 130, 0.6, 18),
    heart(104, 150, 0.9, -6),
    heart(176, 20, 0.55, 10),
  ].join(""),
  200,
  190,
);

/** Gingham check: two translucent bands that darken where they cross. */
const GINGHAM = svg(
  "<rect width='12' height='24' fill='#F06292' fill-opacity='.22'/><rect width='24' height='12' fill='#F06292' fill-opacity='.22'/>",
  24,
  24,
);

const HEART_ICON = svg(`<path d='${HEART}'/>`, 24, 24);

const CSS = `
[data-pookie] {
  --pk-hearts: ${HEARTS_TILE}; --pk-gingham: ${GINGHAM}; --pk-heart: ${HEART_ICON};
  /* One spacing scale for every panel, so edges line up. */
  --pk-pad-x: 20px; --pk-pad-y: 20px; --pk-radius: 28px; --pk-gutter: 16px;
}
@media (max-width: 767px) {
  [data-pookie] { --pk-pad-x: 14px; --pk-pad-y: 16px; --pk-radius: 24px; }
}

/* 1. Page: floating hearts behind everything */
[data-pookie-page] { position: relative; isolation: isolate; }
[data-pookie-page]::before {
  content: ""; position: fixed; inset: 0; z-index: -1; pointer-events: none;
  background: var(--s-secondary); opacity: .13;
  -webkit-mask-image: var(--pk-hearts); mask-image: var(--pk-hearts);
  -webkit-mask-size: 230px; mask-size: 230px;
}

/* 2. Hero: a faint heart layer over the banner (keeps the photo/gradient visible) */
[data-pookie] [data-sf="hero"] { position: relative; overflow: hidden; border-radius: var(--pk-radius); }
[data-pookie] [data-sf="hero"]::after {
  content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
  background: #fff; opacity: .16;
  -webkit-mask-image: var(--pk-hearts); mask-image: var(--pk-hearts);
  -webkit-mask-size: 190px; mask-size: 190px;
}
@media (max-width: 767px) {
  /* The mobile hero runs edge to edge: round only the bottom corners. */
  [data-pookie] [data-sf="hero"] { border-radius: 0 0 var(--pk-radius) var(--pk-radius); }
}

/* 3. Section + offer panels: same box model.
   NOTE: the mobile preview is a prop, not a viewport, so media queries are not
   reliable for it. Block adds the "px-4" class on mobile, so we key off that. */
[data-pookie] [data-sf="section"],
[data-pookie] [data-sf="promo"] {
  box-sizing: border-box;
  padding: var(--pk-pad-y) var(--pk-pad-x);
  border-radius: var(--pk-radius);
  border: 1px solid color-mix(in srgb, var(--s-secondary) 28%, transparent);
  box-shadow: 0 10px 30px -18px color-mix(in srgb, var(--s-primary) 45%, transparent),
              inset 0 1px 0 #fff;
}
[data-pookie] [data-sf="section"] {
  background: color-mix(in srgb, #fff 62%, transparent);
}
[data-pookie] [data-sf="promo"] {
  background-color: color-mix(in srgb, #fff 70%, transparent);
  background-image: var(--pk-gingham);
}

/* Mobile blocks (the ones Block gives px-4): outer gutter as a margin, tighter padding. */
[data-pookie] [data-sf].px-4:not([data-sf="looks"]) {
  --pk-pad-x: 14px; --pk-pad-y: 16px; --pk-radius: 24px;
  margin-inline: var(--pk-gutter);
}

/* Mobile scrollers use -mx-4 px-4 to bleed to the screen edge. Inside a panel they
   must bleed only to the panel edge, so cards never run past the rounded border. */
[data-pookie] [data-sf] .no-scrollbar.overflow-x-auto {
  margin-inline: calc(var(--pk-pad-x) * -1);
  padding-inline: var(--pk-pad-x);
  scroll-padding-inline: var(--pk-pad-x);
}

/* 5. Benefit strip: dashed rounded panel (a full pill clips the title and the cards). */
[data-pookie] [data-sf="trust"] {
  box-sizing: border-box;
  background: color-mix(in srgb, #fff 80%, transparent);
  border: 2px dashed color-mix(in srgb, var(--s-secondary) 55%, transparent);
  border-radius: 32px;
  padding: 16px 24px 12px;
}
[data-pookie] [data-sf="trust"].px-4 {
  border-radius: var(--pk-radius);
  padding: 14px var(--pk-pad-x) 12px;
}
[data-pookie] [data-sf="trust"] > div {
  background: transparent !important; border: 0 !important;
  padding: 4px 0; gap: 16px;
}
/* Mobile trust scroller: keep cards inside the dashed border */
[data-pookie] [data-sf="trust"] > div.overflow-x-auto { padding: 0 var(--pk-pad-x) 4px; }

/* Section titles: heart sits on the text's optical centre, never alone on a new line */
[data-pookie] #store-feed h2 { color: var(--s-primary); letter-spacing: -0.01em; }
[data-pookie] #store-feed h2::after {
  content: ""; display: inline-block; width: .62em; height: .62em; margin-left: .4em;
  background: var(--s-secondary); vertical-align: -0.02em;
  -webkit-mask: var(--pk-heart) center / contain no-repeat; mask: var(--pk-heart) center / contain no-repeat;
}

/* 6. Sidebar and right rail panels: tiny hearts on the surface */
[data-pookie] aside {
  background-image: linear-gradient(180deg, color-mix(in srgb, #fff 55%, transparent), transparent 70%) !important;
  border-color: color-mix(in srgb, var(--s-secondary) 28%, transparent) !important;
  box-shadow: 0 10px 30px -20px color-mix(in srgb, var(--s-primary) 45%, transparent);
}

/* Footer: pink wash */
[data-pookie] footer {
  background-image: linear-gradient(180deg, color-mix(in srgb, var(--s-secondary) 14%, transparent), transparent) !important;
}
`;

export function PookieStyles() {
  return <style dangerouslySetInnerHTML={{ __html: CSS }} />;
}

/** Soft glows behind the hearts. Replaces the flat page background for the Grocery template. */
export function pookiePageBackground(d: StoreDesign): CSSProperties | null {
  if (!isPookie(d)) return null;
  return {
    background: [
      "radial-gradient(52rem 26rem at 8% -6%, color-mix(in srgb, var(--s-secondary) 26%, transparent), transparent 70%)",
      "radial-gradient(46rem 28rem at 100% 38%, color-mix(in srgb, var(--s-secondary) 20%, transparent), transparent 70%)",
      "radial-gradient(40rem 24rem at 0% 100%, color-mix(in srgb, var(--s-primary) 12%, transparent), transparent 70%)",
      "var(--s-bg)",
    ].join(", "),
  };
}
