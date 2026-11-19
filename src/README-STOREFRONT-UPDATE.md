# ShopBD storefront update

Drop these folders over your project (`app/`, `components/`, `lib/`, `types/`).
This archive has no `package.json` or Next config — keep your own.

## Round 3: cart, search, hero, polish

### 1. Cart no longer destroys navigation
- Header cart icon (desktop + mobile top + mobile dock) opens a **slide-over cart sheet** instead of navigating away.
- The tabs shell, header, and dock stay mounted; no remount or layout flash.
- Sheet supports qty, remove, subtotal, checkout link, and “View full cart” to the existing `/cart` page.
- Full cart page is unchanged for deep links and checkout flow.

### 2. Real product search
- Replaced the non-functional form (`action="/products"`) with client-side search over the store’s products.
- Desktop: search field in the header (md+).
- Mobile / feed: search bar in the shop feed (when `showSearch` is on).
- Clear button, empty state, keyboard Escape, click-outside to dismiss results.
- Results link to product pages; no duplicate API calls (filters in-memory product list).

### 3. Hero redesign
- Clearer hierarchy: store label, title, subtitle, CTA with arrow.
- Tighter radius (`rounded-2xl` / `3xl`), less “uppercase mega title” noise.
- Split / image / centered layouts still respect seller settings (`heroLayout`, banners, autoplay, tone).
- Product thumbs and promo slides preserved.

### 4. Visual polish (less generic AI look)
- Header / dock: `rounded-2xl` instead of full pills; quieter active nav (soft fill vs gradient pill).
- Glass tokens: slightly stronger opacity, softer blur, restrained shadow.
- Hero and nav spacing aligned for a more commercial storefront feel.
- Seller customization (colors, logo, fonts, sections, templates) is unchanged.

### 5. Transitions / a11y
- Existing tab fade and `prefers-reduced-motion` rules kept.
- Cart sheet uses Radix Sheet animations; cart icon is a button so focus/aria work without route change.

## Not verified in this environment
No `package.json` in the archive, so `next build` / browser runs were not executed here.
Please run your usual build and click through: cart sheet open/close, search, tabs, hero breakpoints, and a themed seller storefront.
