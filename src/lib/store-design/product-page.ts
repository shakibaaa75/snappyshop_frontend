/**
 * Product page look, shared by the live page and the editor preview so the
 * two can never drift apart. Everything here reads the seller's design.
 */
import type { CSSProperties } from "react";
import { radiusPx } from "./utilts";
import type { ProductLayout, StoreDesign } from "./types";

/** Corner radius (px) for product photos and panels, from the template's shape. */
export function productRadius(d: Pick<StoreDesign, "buttonRadius">): number {
  return d.buttonRadius === "full" ? 28 : Math.round(radiusPx[d.buttonRadius] * 2.25);
}

/**
 * Corner radius (px) for small controls (buttons, quantity stepper, option
 * chips, tabs), from the template's shape. Pill templates stay pills and
 * square templates stay square.
 */
export function controlRadius(d: Pick<StoreDesign, "buttonRadius">): number {
  return d.buttonRadius === "full" ? 9999 : radiusPx[d.buttonRadius];
}

/** Main grid columns on desktop, per layout. Full class names so Tailwind sees them. */
export const PRODUCT_GRID_COLS: Record<ProductLayout, string> = {
  app: "lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]",
  split: "lg:grid-cols-2",
  "gallery-left": "lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]",
  editorial: "lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)]",
  "gallery-right": "lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]",
  wide: "lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]",
  portrait: "lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]",
  // One column: big photo on top, details underneath, narrower page.
  stacked: "lg:grid-cols-1 lg:max-w-[860px]",
};

/** Shape of the main photo on desktop. Full class names so Tailwind sees them. */
export const PRODUCT_IMAGE_LG_ASPECT: Record<ProductLayout, string> = {
  app: "lg:aspect-square",
  split: "lg:aspect-[4/5]",
  "gallery-left": "lg:aspect-square",
  "gallery-right": "lg:aspect-square",
  editorial: "lg:aspect-square",
  wide: "lg:aspect-[4/3]",
  portrait: "lg:aspect-[3/4]",
  stacked: "lg:aspect-[16/10]",
};

/** Same shapes as above, for the editor preview (inline style). */
export const PRODUCT_IMAGE_RATIO: Record<ProductLayout, string> = {
  app: "1 / 1",
  split: "4 / 5",
  "gallery-left": "1 / 1",
  "gallery-right": "1 / 1",
  editorial: "1 / 1",
  wide: "4 / 3",
  portrait: "3 / 4",
  stacked: "16 / 10",
};

/**
 * How each layout looks on a PHONE. Desktop is handled by the maps above.
 * - inset: photo sits inside the page margins as a rounded card (otherwise it
 *   runs edge to edge under the top bar)
 * - thumbs: where the small photos go (side columns, over the bottom edge, a
 *   row under the photo, or none when every photo is stacked)
 * - sheet: details slide up over the photo as a rounded sheet (otherwise they
 *   start below it)
 * - stackAll: every photo shown one under the other (no thumbnails)
 * Full class names so Tailwind sees them.
 */
export interface PhoneStyle {
  aspect: string;
  ratio: string;
  inset: boolean;
  thumbs: "right" | "left" | "bottom" | "row" | "none";
  sheet: boolean;
  stackAll: boolean;
}

export const PRODUCT_PHONE: Record<ProductLayout, PhoneStyle> = {
  app: { aspect: "aspect-[4/5]", ratio: "4 / 5", inset: false, thumbs: "right", sheet: true, stackAll: false },
  split: { aspect: "aspect-square", ratio: "1 / 1", inset: true, thumbs: "row", sheet: false, stackAll: false },
  "gallery-left": { aspect: "aspect-[4/5]", ratio: "4 / 5", inset: false, thumbs: "left", sheet: true, stackAll: false },
  "gallery-right": { aspect: "aspect-square", ratio: "1 / 1", inset: false, thumbs: "row", sheet: false, stackAll: false },
  editorial: { aspect: "aspect-[4/5]", ratio: "4 / 5", inset: false, thumbs: "none", sheet: false, stackAll: true },
  wide: { aspect: "aspect-[4/3]", ratio: "4 / 3", inset: false, thumbs: "bottom", sheet: false, stackAll: false },
  portrait: { aspect: "aspect-[3/4]", ratio: "3 / 4", inset: false, thumbs: "bottom", sheet: true, stackAll: false },
  stacked: { aspect: "aspect-[4/5]", ratio: "4 / 5", inset: true, thumbs: "bottom", sheet: false, stackAll: false },
};

/** Buy button: solid (template radius), outline, or pill. */
export function buyButtonStyle(
  d: Pick<StoreDesign, "productButtonStyle" | "buttonRadius">,
  accent: string,
  accentOn: string,
): CSSProperties {
  const square = d.buttonRadius === "full" ? 9999 : radiusPx[d.buttonRadius];
  switch (d.productButtonStyle) {
    case "outline":
      return {
        background: "transparent",
        color: accent,
        border: `1.5px solid ${accent}`,
        borderRadius: square,
      };
    case "rounded":
      return { background: accent, color: accentOn, borderRadius: 9999 };
    default:
      return { background: accent, color: accentOn, borderRadius: square };
  }
}

/**
 * Whether an option group should show, given the seller's picker toggles.
 * Only color and size groups can be switched off; anything else always shows.
 * A hidden group keeps its default choice, so the product stays buyable.
 */
export function optionVisible(
  name: string,
  d: Pick<StoreDesign, "showProductColorPicker" | "showProductSizePicker">,
): boolean {
  const n = name.toLowerCase();
  if (/colou?r/.test(n)) return d.showProductColorPicker;
  if (/size/.test(n)) return d.showProductSizePicker;
  return true;
}