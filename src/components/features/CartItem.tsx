"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import type { CartLine } from "@/lib/store-design/cart";

/** The old prop shape. Still accepted so any file that was not updated keeps working. */
interface LegacyItem {
  id: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
  storeName?: string;
}

interface CartItemProps {
  line?: CartLine;
  /** @deprecated use `line`. */
  item?: LegacyItem;
  /** Link to the product page. */
  href?: string;
  /** Warning shown under the item (price changed, low stock, unavailable...). */
  notice?: { text: string; tone: "info" | "warn" | "error" };
  /** Hard cap for the + button (from live stock). Undefined = no cap. */
  maxQty?: number;
  onQty?: (qty: number) => void;
  onRemove?: () => void;
}

const TONE = {
  info: "text-sky-700 dark:text-sky-300",
  warn: "text-amber-700 dark:text-amber-300",
  error: "text-red-600 dark:text-red-400",
} as const;

export function CartItem({
  line: lineProp,
  item,
  href = "#",
  notice,
  maxQty,
  onQty = () => {},
  onRemove = () => {},
}: CartItemProps) {
  const line: CartLine | undefined =
    lineProp ??
    (item
      ? {
          productId: item.id,
          name: item.title,
          price: item.price,
          qty: item.quantity,
          imageUrl: item.image,
          emoji: "",
          hue: 0,
          storeName: item.storeName,
        }
      : undefined);
  if (!line) return null;

  const atMax = maxQty !== undefined && line.qty >= maxQty;

  return (
    <div className="flex gap-4 border-b py-4 last:border-b-0">
      <Link
        href={href}
        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-24 sm:w-24"
      >
        <Image
          src={line.imageUrl || "/placeholder-product.jpg"}
          alt={line.name}
          fill
          sizes="96px"
          className="object-cover"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <Link
            href={href}
            className="line-clamp-2 text-sm font-semibold text-foreground hover:underline"
          >
            {line.name}
          </Link>
          {line.variantLabel && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {line.variantLabel}
            </p>
          )}
          {notice && (
            <p className={`mt-1 text-xs font-medium ${TONE[notice.tone]}`}>
              {notice.text}
            </p>
          )}
        </div>

        <div className="mt-2 flex items-end justify-between gap-3">
          <div className="flex items-center rounded-full border">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Decrease quantity"
              className="h-8 w-8 rounded-full"
              onClick={() => onQty(line.qty - 1)}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center text-sm font-medium">
              {line.qty}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Increase quantity"
              disabled={atMax}
              className="h-8 w-8 rounded-full"
              onClick={() => onQty(line.qty + 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <div className="text-right">
            <p className="text-sm font-bold text-primary">
              {formatPrice(line.price * line.qty)}
            </p>
            {line.qty > 1 && (
              <p className="text-xs text-muted-foreground">
                {formatPrice(line.price)} each
              </p>
            )}
          </div>
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Remove ${line.name}`}
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
