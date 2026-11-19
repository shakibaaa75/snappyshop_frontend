"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Minus, Plus } from "lucide-react";

export function AddToCartForm({
  productId,
  inStock,
}: {
  productId: string;
  inStock: boolean;
}) {
  const [qty, setQty] = useState(1);

  return (
    <div className="mt-4 flex flex-col gap-4 border-t pt-6">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Quantity:</span>
        <div className="flex items-center border rounded-full">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-8 w-8"
            onClick={() => setQty(Math.max(1, qty - 1))}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-8 text-center font-semibold">{qty}</span>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-8 w-8"
            onClick={() => setQty(qty + 1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Button
        size="lg"
        className="rounded-full w-full md:w-auto"
        disabled={!inStock}
        onClick={() => {
          // Placeholder: real cart actions live in the store pages.
          void qty;
          void productId;
        }}
      >
        <ShoppingCart className="mr-2 h-5 w-5" />
        {inStock ? "Add to Cart" : "Out of Stock"}
      </Button>
    </div>
  );
}
