import type { Metadata } from "next";
import OrderClient from "./order-client";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Order confirmed",
    robots: { index: false, follow: false },
  };
}

export default function OrderPage() {
  return <OrderClient />;
}
