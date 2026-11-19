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
[data-pookie] { --pk-hearts: ${HEARTS_TILE}; --pk-gingham: ${GINGHAM}; --pk-heart: ${HEART_ICON}; }

/* 1. Page: floating hearts behind everything */
[data-pookie-page] { position: relative; isolation: isolate; }
[data-pookie-page]::before {
  content: ""; position: fixed; inset: 0; z-index: -1; pointer-events: none;
  background: var(--s-secondary); opacity: .13;
  -webkit-mask-image: var(--pk-hearts); mask-image: var(--pk-hearts);
  -webkit-mask-size: 230px; mask-size: 230px;
}

/* 2. Hero: a faint heart layer over the banner (keeps the photo/gradient visible) */
[data-pookie] [data-sf="hero"] { position: relative; overflow: hidden; border-radius: 28px; }
[data-pookie] [data-sf="hero"]::after {
  content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
  background: #fff; opacity: .16;
  -webkit-mask-image: var(--pk-hearts); mask-image: var(--pk-hearts);
  -webkit-mask-size: 190px; mask-size: 190px;
}

/* 3. Section wrapper: soft rounded panel */
[data-pookie] [data-sf="section"] {
  background: color-mix(in srgb, #fff 62%, transparent);
  border: 1px solid color-mix(in srgb, var(--s-secondary) 26%, transparent);
  border-radius: 28px;
  padding: 18px 20px 20px;
  box-shadow: 0 10px 30px -18px color-mix(in srgb, var(--s-primary) 45%, transparent),
              inset 0 1px 0 #fff;
}
@media (max-width: 767px) {
  [data-pookie] [data-sf="section"] { padding: 14px 12px 16px; border-radius: 24px; }
}

/* 4. Offer banners: gingham with a pink border */
[data-pookie] [data-sf="promo"] {
  background-color: color-mix(in srgb, #fff 70%, transparent);
  background-image: var(--pk-gingham);
  border: 1px solid color-mix(in srgb, var(--s-secondary) 35%, transparent);
  border-radius: 28px; padding: 18px 20px 20px;
  box-shadow: 0 10px 30px -18px color-mix(in srgb, var(--s-primary) 45%, transparent);
}

/* 5. Benefit strip: pill with a dashed scalloped edge */
[data-pookie] [data-sf="trust"] {
  background: color-mix(in srgb, #fff 80%, transparent);
  border: 2px dashed color-mix(in srgb, var(--s-secondary) 55%, transparent);
  border-radius: 999px; padding: 10px 22px;
}
@media (max-width: 767px) {
  [data-pookie] [data-sf="trust"] { border-radius: 24px; padding: 12px; }
}

[data-pookie] [data-sf="trust"] > div { background: transparent !important; border: 0 !important; }

/* Section titles get a little heart */
[data-pookie] #store-feed h2 { color: var(--s-primary); letter-spacing: -0.01em; }
[data-pookie] #store-feed h2::after {
  content: ""; display: inline-block; width: .62em; height: .62em; margin-left: .4em;
  background: var(--s-secondary); vertical-align: baseline;
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
