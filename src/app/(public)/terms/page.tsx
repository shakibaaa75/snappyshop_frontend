import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { terms } from "@/lib/legal/content";

export const metadata: Metadata = {
  title: "Terms & Conditions | ShopBD",
  description:
    "The terms for using ShopBD as a buyer or seller.",
};

export default function Page() {
  return <LegalPage doc={terms} />;
}
