import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { refund } from "@/lib/legal/content";

export const metadata: Metadata = {
  title: "Return & Refund Policy | ShopBD",
  description:
    "Order returns and per-minute subscription refunds at ShopBD.",
};

export default function Page() {
  return <LegalPage doc={refund} />;
}
