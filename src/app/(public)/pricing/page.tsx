import type { Metadata } from "next";
import { PricingClient } from "./pricing-client";

export const metadata: Metadata = {
  title: "Pricing | ShopBD",
  description:
    "Start selling for free, or pick a Pro or Business pack to grow your store.",
};

export default function PricingPage() {
  return <PricingClient />;
}
