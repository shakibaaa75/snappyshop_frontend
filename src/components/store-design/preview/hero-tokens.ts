import { type HeroStyle } from "@/lib/store-design/types";

/* ------------------------------------------------------------------ */
/* Hero banner carousel                                                */
/* ------------------------------------------------------------------ */

export interface Slide {
  id: string;
  title: string;
  subtitle: string;
  button: string;
  url: string;
  image: string;
  color: string;
  style?: HeroStyle;
}
export const INTERNAL = /^\/(about|contact|wishlist|cart)(\/|$)/;
/** [mobile, desktop] */
export const HERO_HEIGHT = {
  sm: [190, 270],
  md: [220, 340],
  lg: [280, 440],
  xl: [340, 540],
} as const;
export const HERO_TITLE = {
  sm: ["1.35rem", "1.9rem"],
  md: ["1.65rem", "2.35rem"],
  lg: ["2rem", "3rem"],
  xl: ["2.3rem", "3.75rem"],
} as const;
export const HERO_RADIUS = { none: 0, md: 16, lg: 24, xl: 32 } as const;
export const HERO_FOCUS = {
  top: "center top",
  center: "center center",
  bottom: "center bottom",
} as const;
export const HERO_ALIGN = {
  left: "items-start text-left",
  center: "items-center text-center",
  right: "items-end text-right",
} as const;
export const HERO_VALIGN = {
  top: "justify-start",
  middle: "justify-center",
  bottom: "justify-end",
} as const;
export const HERO_SHAPE = {
  pill: "rounded-full",
  rounded: "rounded-xl",
  square: "rounded-none",
} as const;
