import type { Metadata } from "next";
import CheckoutClient from "./checkout-client";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Checkout",
    robots: { index: false, follow: false },
  };
}

export default function CheckoutPage() {
  return <CheckoutClient />;
}
