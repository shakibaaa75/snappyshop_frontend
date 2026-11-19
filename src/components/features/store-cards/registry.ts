import { type ComponentType } from "react";
import { type CardVariant } from "@/lib/store-design/types";
import { ArchCard } from "./arch-card";
import { AtelierCard } from "./atelier-card";
import { AuraCard } from "./aura-card";
import { BrandCard } from "./brand-card";
import { CatalogCard } from "./catalog-card";
import { ChippedCard } from "./chipped-card";
import { CompactCard } from "./compact-card";
import { DropCard } from "./drop-card";
import { FadeCard } from "./fade-card";
import { FrostCard } from "./frost-card";
import { GlassCard } from "./glass-card";
import { GridCard } from "./grid-card";
import { LightCard } from "./light-card";
import { LuxeCard } from "./luxe-card";
import { NoirCard } from "./noir-card";
import { OrbCard } from "./orb-card";
import { OutlineCard } from "./outline-card";
import { OverlayCard } from "./overlay-card";
// import { PastelCard } from "./pastel-card";
import { PookieCard } from "./pookie-card";
import { PopoutCard } from "./popout-card";
import { RailCard } from "./rail-card";
import { SheenCard } from "./sheen-card";
import { ShowcaseCard } from "./showcase-card";
import { SkinCard } from "./skin-card";
import { SpotlightCard } from "./spotlight-card";
import { TicketCard } from "./ticket-card";
import { type CardProps } from "./types";
import { YokaiCard } from "./yokai-card";

/* ------------------------------------------------------------------ */
/* Registry                                                            */
/* ------------------------------------------------------------------ */

export const PREMIUM_CARDS: Partial<
  Record<CardVariant, ComponentType<CardProps>>
> = {
  atelier: AtelierCard,
  arch: ArchCard,
  aura: AuraCard,
  luxe: LuxeCard,
  grid: GridCard,
  frost: FrostCard,
  sheen: SheenCard,
  skin: SkinCard,
};
export const EXTRA_CARDS: Partial<
  Record<CardVariant, ComponentType<CardProps>>
> = {
  glass: GlassCard,
  light: LightCard,
  overlay: OverlayCard,
  outline: OutlineCard,
  compact: CompactCard,
  spotlight: SpotlightCard,
  showcase: ShowcaseCard,
  orb: OrbCard,
  fade: FadeCard,
  noir: NoirCard,
  ticket: TicketCard,
  // pastel: PastelCard,
  popout: PopoutCard,
  chipped: ChippedCard,
  brand: BrandCard,
  rail: RailCard,
  catalog: CatalogCard,
  drop: DropCard,
  yokai: YokaiCard,
  pookie: PookieCard,
  ...PREMIUM_CARDS,
};
