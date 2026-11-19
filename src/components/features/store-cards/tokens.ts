import { type CSSProperties } from "react";

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/*                                                                     */
/* One easing, one shadow pair, one focus ring. Every card uses these  */
/* so the whole catalogue feels like one family.                       */
/*                                                                     */
/* Template-driven colors (set by CardScope from design.cardCustom):   */
/*   --s-sale / --s-on-sale          sale badge + wishlist heart       */
/*   --s-dark                        Fade / Noir / Luxe / Glass panel  */
/*   --s-highlight / --s-on-highlight  accent: Luxe gold, rings, price */
/*   --s-accent2 / --s-on-accent2    second accent: dark-card buttons, */
/*                                   Light/Pastel/Luxe edges           */
/* Each is read with a fallback, so an empty value keeps the old look. */
/* ------------------------------------------------------------------ */

export const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";
export const LIFT = `transition-[transform,box-shadow] duration-300 ${EASE} motion-safe:hover:-translate-y-0.5`;
export const ART_MOTION = `h-full w-full transition-transform duration-700 ${EASE} motion-safe:group-hover:scale-[1.03]`;
export const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--s-primary)]";
export const SH_REST =
  "shadow-[0_1px_2px_rgba(16,16,24,.06),0_4px_12px_-4px_rgba(16,16,24,.10)]";
export const SH_HOVER =
  "hover:shadow-[0_2px_4px_rgba(16,16,24,.06),0_14px_24px_-10px_rgba(16,16,24,.20)]";
export const SH_CSS =
  "0 1px 2px rgba(16,16,24,.06), 0 4px 12px -4px rgba(16,16,24,.12)";
export const SH_DEEP = "0 2px 4px rgba(0,0,0,.2), 0 16px 32px -12px rgba(0,0,0,.5)";
export const aspectCss = {
  square: "1 / 1",
  portrait: "3 / 4",
  landscape: "4 / 3",
} as const;
/** Photo shape: the seller's choice, else the card's own ratio. */
export function cardImageRatio(
  d: { cardCustom?: { imageRatio?: string } },
  fallback: string,
): string {
  const r = d.cardCustom?.imageRatio;
  return r === "square" || r === "portrait" || r === "landscape"
    ? aspectCss[r]
    : fallback;
}
/** Photo fit: class for the <img>. Empty = keep the card's own look. */
export function cardImageFit(d: {
  cardCustom?: { imageFit?: string };
}): string {
  const f = d.cardCustom?.imageFit;
  return f === "cover" ? "!object-cover" : f === "contain" ? "!object-contain" : "";
}
export const GOLD = "var(--s-highlight, #e9cf86)";
/** Star color. Uses the template accent when it is readable on the page, else amber. */
export const STAR: CSSProperties = { color: "var(--s-star, #fbbf24)" };
/** Foreground / secondary text colors per surface type. */
export const TONES = {
  light: { fg: "var(--s-text)", muted: "var(--s-muted)" },
  dark: { fg: "#fff", muted: "rgba(255,255,255,.72)" },
  brand: {
    fg: "var(--s-on-primary)",
    muted: "color-mix(in srgb, var(--s-on-primary) 78%, transparent)",
  },
  gold: {
    fg: "#fff",
    muted: "color-mix(in srgb, var(--s-highlight, #e9cf86) 85%, transparent)",
  },
} as const;
export type Tone = keyof typeof TONES;
/** Button looks. Sizes are passed separately via className. */
export const BTN = {
  primary: { background: "var(--s-primary)", color: "var(--s-on-primary)" },
  light: {
    background: "var(--s-accent2, #fff)",
    color: "var(--s-on-accent2, #111)",
  },
  outline: {
    background: "transparent",
    color: "var(--s-text)",
    border: "1px solid var(--s-text)",
  },
  brand: { background: "var(--s-on-primary)", color: "var(--s-primary)" },
  gold: { background: GOLD, color: "var(--s-on-highlight, #1a1405)" },
  accent: {
    background: "var(--s-highlight, var(--s-primary))",
    color: "var(--s-on-highlight, var(--s-on-primary))",
  },
} satisfies Record<string, CSSProperties>;
export type BtnKind = keyof typeof BTN;
/** Sizes */
export const SZ_ROUND = "h-10 w-10 rounded-full";
/* Narrow cards (2 per row on phones, 5 per row) show the icon only; the label
   appears once the card itself is 230px wide. */
export const SZ_PILL =
  "h-10 w-10 rounded-full px-0 text-xs font-semibold @[230px]:w-auto @[230px]:px-4";
export const SZ_BLOCK = "h-10 w-full rounded-full text-xs font-semibold";
/** Standard bordered surface. */
export const surface = (extra?: CSSProperties): CSSProperties => ({
  background: "var(--s-surface)",
  border: "1px solid var(--s-border)",
  color: "var(--s-text)",
  ...extra,
});