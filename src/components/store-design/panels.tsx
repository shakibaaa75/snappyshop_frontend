"use client";

// Public entry point. The implementation now lives in ./editor-panels/*.
// Everything that used to be exported from this file is still exported here.

export type { PanelProps, ShopNameControls } from "./editor-panels/types";
export { IdentityPanel } from "./editor-panels/identity-panel";
export { ThemePanel } from "./editor-panels/theme-panel";
export { ProductCardsPanel } from "./editor-panels/product-cards-panel";
export { ProductsPanel } from "./editor-panels/products-panel";
export { ProductPagePanel } from "./editor-panels/product-page-panel";
export { HomepagePanel } from "./editor-panels/homepage-panel";
export { SectionArrangementPanel } from "./editor-panels/section-arrangement-panel";
export { HeaderPanel } from "./editor-panels/header-panel";
export { ShopOptionsPanel } from "./editor-panels/shop-options-panel";
export { DeliveryPanel } from "./editor-panels/delivery-panel";
export { TrustPanel } from "./editor-panels/trust-panel";
export { AboutPanel } from "./editor-panels/about-panel";
export { ContactPanel } from "./editor-panels/contact-panel";
export { SeoPanel } from "./editor-panels/seo-panel";
