import { type Category, type StoreDesign } from "@/lib/store-design/types";
import { type CSSProperties } from "react";

/* ------------------------------------------------------------------ */
/* Tokens                                                              */
/* ------------------------------------------------------------------ */

export const aspectCss = {
  square: "1 / 1",
  portrait: "3 / 4",
  landscape: "4 / 3",
} as const;
export const muted: CSSProperties = { color: "var(--s-muted)" };
export const CTA_BG = "var(--s-primary)";
export const tint = (c: string, pct: number) =>
  `color-mix(in srgb, ${c} ${pct}%, var(--s-bg))`;
/* ------------------------------------------------------------------ */
/* Page structure per template                                         */
/*   dashboard: side menu + cart rail (app-like, dense)                */
/*   topnav:    full-width top bar, bold headings, tighter rhythm      */
/*   editorial: centered brand, text menu, quiet headings, airy rhythm */
/* ------------------------------------------------------------------ */

type Shell = "dashboard" | "topnav" | "editorial" | "street";
/* Empty on purpose: every template uses the dashboard structure.
 * Add entries (e.g. fashion: "editorial") to try the other structures. */
const SHELL_BY_TEMPLATE: Record<string, Shell> = {
  /* Streetwear: centered wordmark header, full-width page, flat footer. */
  streetwear: "street",
  yokai: "street",
};
export const shellOf = (d: StoreDesign): Shell =>
  SHELL_BY_TEMPLATE[d.template] ?? "dashboard";
export const SHELL_CLASS: Record<Shell, string> = {
  dashboard: "",
  topnav: "[&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:tracking-tight",
  editorial:
    "[&_h2]:text-[15px] [&_h2]:font-medium [&_h2]:uppercase [&_h2]:tracking-[0.18em]",
  street:
    "[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:uppercase [&_h2]:tracking-[0.16em]",
};
/** Space between homepage sections: [mobile, desktop]. null keeps the default. */
export const SHELL_GAP: Record<Shell, [string, string] | null> = {
  dashboard: null,
  topnav: ["28px", "36px"],
  editorial: ["44px", "64px"],
  street: ["36px", "64px"],
};
/** Letter-tile colours that follow the seller's theme. */
export const THUMB_THEME = "bg-[color:var(--s-surface)] text-[color:var(--s-text)]";
/**
 * Category image. Works even if the shared Category type has no imageUrl
 * field yet; once you add it to the type this is simply a typed read.
 */
export const catImage = (c: Category): string | null =>
  (c as Category & { imageUrl?: string | null }).imageUrl ?? null;
/* Frosted surface for the header, dock and floating controls. */
export const GLASS: CSSProperties = {
  background: "color-mix(in srgb, var(--s-bg) 86%, transparent)",
  color: "var(--s-text)",
  backdropFilter: "blur(16px) saturate(130%)",
  WebkitBackdropFilter: "blur(16px) saturate(130%)",
  border: "1px solid var(--s-border)",
  boxShadow: "var(--sf-shadow-sm)",
};
/* Solid "ink" button/chip: text colour on page background. */
export const INK: CSSProperties = {
  background: "var(--s-text)",
  color: "var(--s-bg)",
};
/* Light glass pill that carries the product name over the photo. */
export const NAME_PILL: CSSProperties = {
  background: "rgba(255,255,255,.78)",
  color: "#000",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
};
