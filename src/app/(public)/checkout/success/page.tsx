import type { Metadata } from "next";
import SuccessClient from "./success-client";

export const metadata: Metadata = { title: "Order placed" };

export default function CheckoutSuccessPage() {
  return <SuccessClient />;
}
