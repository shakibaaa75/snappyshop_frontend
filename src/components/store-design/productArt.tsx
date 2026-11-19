import { cn } from "@/lib/utils";
import { img } from "@/lib/images";
import type { Product } from "@/lib/store-design/types";

/**
 * Product image, or a soft gradient with an emoji when there is no image yet.
 * Cloudinary URLs are automatically resized to `width` for fast delivery.
 */
export function ProductArt({
  product,
  className,
  emojiClassName,
  width = 400,
}: {
  product: Product;
  className?: string;
  emojiClassName?: string;
  width?: number;
}) {
  if (product.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={img(product.imageUrl, { width, height: width })}
        alt={product.name}
        loading="lazy"
        width={width}
        height={width}
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center",
        className,
      )}
      style={{
        background: `linear-gradient(135deg, hsl(${product.hue} 70% 93%), hsl(${product.hue} 60% 80%))`,
      }}
    >
      <span className={cn("select-none text-3xl", emojiClassName)} aria-hidden>
        {product.emoji}
      </span>
    </div>
  );
}
