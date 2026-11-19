import type { Metadata } from "next";
import CartClient from "./cart-client";

export const metadata: Metadata = { title: "Shopping Cart" };

export default function CartPage() {
  return <CartClient />;
}
