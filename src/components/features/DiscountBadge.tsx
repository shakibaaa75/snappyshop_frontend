import { productDiscount } from "@/lib/format";

export function DiscountBadge({
  price,
  compareAtPrice,
}: {
  price: number;
  compareAtPrice?: number;
}) {
  if (
    !Number.isFinite(price) ||
    price < 0 ||
    compareAtPrice === undefined ||
    !Number.isFinite(compareAtPrice) ||
    compareAtPrice <= price
  )
    return null;

  const percent = productDiscount({ price, compareAtPrice });
  const label =
    percent === 0 ? "<1" : percent === 100 && price > 0 ? ">99" : percent;

  return (
    <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-[#FF653F] px-2 py-1 text-xs font-bold leading-none text-neutral-900">
      {label}% OFF
    </span>
  );
}
