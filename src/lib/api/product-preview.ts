/**
 * Where the "eye" button should open a product.
 *
 * A live (active) product opens its real store page. A hidden product is not
 * on the public store yet, so it opens the owner-only preview page, which
 * shows it exactly as customers will see it once it is active.
 */
export function productPreviewHref(
  slug: string,
  product: { id: string; isActive: boolean },
): string {
  const base = `/store/${slug}/products/${product.id}`;
  return product.isActive ? base : `${base}/preview`;
}
