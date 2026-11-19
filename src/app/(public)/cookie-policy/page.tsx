import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { cookiePolicy } from "@/lib/legal/content";

export const metadata: Metadata = {
  title: "Cookie Policy | ShopBD",
  description:
    "The cookies and similar technologies ShopBD uses, and how to control them.",
};

export default function Page() {
  return <LegalPage doc={cookiePolicy} />;
}
