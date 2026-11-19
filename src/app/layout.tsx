import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
import { SiteCookieBanner } from "@/components/legal/SiteCookieBanner";
import "./globals.css";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ShopBD — Bangladesh Multi-Vendor Marketplace",
  description:
    "Discover unique products from trusted local sellers across Bangladesh.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontSans.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
        <SiteCookieBanner />
      </body>
    </html>
  );
}
