"use client";

// Public entry point. The implementation now lives in ./store-cards/*.
// Everything that used to be exported from this file is still exported here.

export type { CardCtx } from "./store-cards/types";
export { PREMIUM_CARDS, EXTRA_CARDS } from "./store-cards/registry";
export { CARD_VARIANT_LABELS } from "./store-cards/labels";
export { pickPreviewProduct, CardPreview } from "./store-cards/card-preview";
