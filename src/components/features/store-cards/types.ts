import {
  type Category,
  type Product,
  type StoreDesign,
} from "@/lib/store-design/types";

/* ------------------------------------------------------------------ */
/* Public types                                                        */
/* ------------------------------------------------------------------ */

export interface CardCtx {
  d: StoreDesign;
  interactive: boolean;
  categories: Category[];
}
export interface CardProps {
  p: Product;
  ctx: CardCtx;
}
