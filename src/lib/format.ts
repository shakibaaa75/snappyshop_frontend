export const formatPrice = (n: number) => `৳${n.toLocaleString("en-US")}`;

export const formatCount = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n);

/** Whole-number discount percent, 0 when the product is not on sale. */
export function productDiscount(p: { price: number; compareAtPrice?: number }) {
  return p.compareAtPrice && p.compareAtPrice > p.price
    ? Math.round((1 - p.price / p.compareAtPrice) * 100)
    : 0;
}