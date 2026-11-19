import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { privacy } from "@/lib/legal/content";

export const metadata: Metadata = {
  title: "Privacy Policy | ShopBD",
  description:
    "How ShopBD collects, uses and protects your personal data.",
};

export default function Page() {
  return <LegalPage doc={privacy} />;
}
