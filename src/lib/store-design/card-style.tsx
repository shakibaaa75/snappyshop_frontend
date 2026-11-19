"use client";

import { useEffect, type CSSProperties, type ReactNode } from "react";
import { defaultCardCustom, fontOptions, type StoreDesign } from "./types";
import { loadFont, readableOn } from "./utilts";

const SHADOWS = {
  none: "none",
  soft: "0 2px 10px rgba(0,0,0,.08)",
  strong: "0 18px 40px -12px rgba(0,0,0,.35)",
} as const;

/** WCAG-style contrast ratio between two hex colors. */
function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    let h = hex.replace("#", "");
    if (h.length === 3)
      h = h
        .split("")
        .map((c) => c + c)
        .join("");
    const [r, g, bl] = [0, 2, 4].map((i) => {
      const v = parseInt(h.slice(i, i + 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Wraps a product card and applies the seller's card style overrides. */
export function CardScope({
  d,
  children,
}: {
  d: StoreDesign;
  children: ReactNode;
}) {
  const s = d.cardCustom ?? defaultCardCustom;

  // Cards always use the store font, even when a parent sets its own.
  useEffect(() => loadFont(d.fontFamily), [d.fontFamily]);
  const font = fontOptions.find((f) => f.id === d.fontFamily) ?? fontOptions[0];

  const vars: Record<string, string> = { fontFamily: font.stack };
  const attrs: Record<string, string> = {};

  if (s.bg) {
    vars["--c-bg"] = s.bg;
    attrs["data-bg"] = "1";
  }
  if (s.text) {
    vars["--c-text"] = s.text;
    vars["--s-muted"] = `color-mix(in srgb, ${s.text} 62%, transparent)`;
    attrs["data-text"] = "1";
  }
  if (s.title) {
    vars["--c-title"] = s.title;
    attrs["data-title"] = "1";
  }
  if (s.accent) {
    vars["--s-primary"] = s.accent;
    vars["--s-on-primary"] = readableOn(s.accent);
  }
  if (s.border) {
    vars["--c-border"] = s.border;
    attrs["data-border"] = "1";
  }
  if (s.radius >= 0) {
    vars["--c-radius"] = `${s.radius}px`;
    attrs["data-radius"] = "1";
  }
  if (s.buttonRadius >= 0) {
    vars["--c-btn-radius"] = `${s.buttonRadius}px`;
    attrs["data-btn-radius"] = "1";
  }
  if (s.shadow !== "default") {
    vars["--c-shadow"] = SHADOWS[s.shadow];
    attrs["data-shadow"] = "1";
  }

  /* Template-driven card colors. Cards read these with a fallback, e.g.
     var(--s-sale, #dc2626), so an empty value keeps the original look. */
  if (s.sale) {
    vars["--s-sale"] = s.sale;
    vars["--s-on-sale"] = readableOn(s.sale);
  }
  if (s.dark) {
    vars["--s-dark"] = s.dark;
  }
  if (s.highlight) {
    vars["--s-highlight"] = s.highlight;
    vars["--s-on-highlight"] = readableOn(s.highlight);
    /* Rating stars use the accent only when it stays readable on the page. */
    if (contrast(s.highlight, d.bgColor) >= 1.5) vars["--s-star"] = s.highlight;
  }

  if (s.accent2) {
    vars["--s-accent2"] = s.accent2;
    vars["--s-on-accent2"] = readableOn(s.accent2);
  }

  /* Seller overrides also map onto the variables every card reads, so they
     work on every card style without extra global CSS. */
  if (s.bg) {
    vars["--s-surface"] = s.bg;
    vars["--s-dark"] = s.bg;
  }
  if (s.text) vars["--s-text"] = s.text;
  if (s.title) vars["--s-title"] = s.title;
  if (s.border) vars["--s-border"] = s.border;

  return (
    <div
      className="sf-card-scope"
      // display: contents keeps the wrapper out of the layout, so cards sit
      // in grids and rows exactly as they would without it.
      style={{ display: "contents", ...(vars as CSSProperties) }}
      {...attrs}
    >
      {children}
    </div>
  );
}
