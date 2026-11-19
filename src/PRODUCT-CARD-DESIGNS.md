# Storefront product card designs

All optional product-card implementations, their registry, labels, and picker thumbnails live in `components/features/Storecards.tsx`.

## Available variants

- Built into `components/store-design/Storepreview.tsx`: `classic`, `tile`, `minimal`, `editorial`
- In `components/features/Storecards.tsx`: `glass`, `light`, `overlay`, `outline`, `compact`, `spotlight`, `showcase`, `orb`, `fade`, `noir`, `ticket`, `pastel`, `popout`, `chipped`, `brand`, `rail`

The seller picker is in `components/store-design/panels.tsx`. The allowed values and saved-design validation list are in `lib/store-design/types.ts` (`CardVariant` and `CARD_VARIANTS`). The preview uses the `EXTRA_CARDS` registry from `Storecards.tsx` before falling back to its built-in layouts.

All variants reuse the existing product model, cart, wishlist, sale/stock labels, seller colors, and display toggles where applicable. No backend schema change was required because `cardVariant` is already part of the store design configuration and normalization allow-list.

## Build verification

The supplied archive does not include `package.json`, a lockfile, or Next.js build configuration, so a full application build could not be run. TypeScript/TSX syntax transpilation was checked for 118 source files with no syntax errors. Run the project's normal build in the complete repository to confirm dependency-aware type checking and runtime behavior.
