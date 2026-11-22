"use client";

import { type HomeSection, usesYokaiLayout } from "@/lib/store-design/types";
import { FeaturedReviews } from "@/components/reviews/Reviews";
import { AllProducts } from "./all-products";
import { Categories } from "./category-section";
import { Countdown } from "./countdown";
import { Gallery } from "./gallery-extra";
import { HeroBanner } from "./hero-banner";
import { YokaiHero } from "./hero-yokai";
import { ProductsSection } from "./product-sections";
import { Promo, Spotlight } from "./promo-sections";
import { Story } from "./story";
import { TrustBar } from "./trust-bar";
import { type Ctx } from "./types";

export function SectionRenderer({
  section,
  ctx,
}: {
  section: HomeSection;
  ctx: Ctx;
}) {
  switch (section.id) {
    case "reviews":
      return <FeaturedReviews design={ctx.d} />;
    case "hero":
      return usesYokaiLayout(ctx.d) ? (
        <YokaiHero ctx={ctx} />
      ) : (
        <HeroBanner ctx={ctx} />
      );
    case "trust":
      return <TrustBar ctx={ctx} section={section} />;
    case "categories":
      return <Categories ctx={ctx} section={section} />;
    case "featured":
    case "bestSellers":
    case "newArrivals":
      return <ProductsSection ctx={ctx} section={section} />;
    case "spotlight":
      return <Spotlight ctx={ctx} section={section} />;
    case "promo":
      return <Promo ctx={ctx} section={section} />;
    case "allProducts":
      return <AllProducts ctx={ctx} section={section} />;
    case "story":
      return <Story ctx={ctx} section={section} />;
    case "countdown":
      return <Countdown ctx={ctx} section={section} />;
    case "gallery":
      return <Gallery ctx={ctx} section={section} />;
    default:
      return null;
  }
}
