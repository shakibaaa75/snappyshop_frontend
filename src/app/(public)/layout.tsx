import { Suspense } from "react";
import { Footer } from "@/components/shared/Footer";
import { Navbar } from "@/components/shared/Header";
import { MobileCategoryBar } from "@/components/features/home/Homesidebar";
import { MARKETPLACE_THEME } from "@/lib/marketplace-theme";
import "./marketplace.css";

// Theme tokens for the marketplace, scoped to this layout (shadcn-style HSL triplets).
// Theme tokens live in one place so the seller dashboard can share them.
const THEME = MARKETPLACE_THEME;

// Category bar: restyles the nav rendered by <MobileCategoryBar />.
const DEPARTMENTS =
  "[&_nav]:m-0 [&_nav]:block [&_nav]:py-[5px] lg:[&_nav]:py-1 [&_ul]:m-0 [&_ul]:gap-1 [&_ul]:p-0 lg:[&_ul]:[justify-content:safe_center] [&_a]:border-0 [&_a]:bg-transparent [&_a]:px-3 [&_a]:text-foreground [&_a:hover]:bg-muted [&_a[aria-current=page]]:bg-primary [&_a[aria-current=page]]:text-primary-foreground [&_a[aria-current=page]:hover]:bg-primary [&_svg]:hidden";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`marketplace-public relative flex min-h-screen flex-col bg-background text-foreground ${THEME}`}
    >
      <Navbar />
      <div
        className={`mx-auto w-full max-w-[var(--market-width)] px-[var(--gutter)] ${DEPARTMENTS}`}
      >
        <Suspense fallback={<div className="h-10" />}>
          <MobileCategoryBar />
        </Suspense>
      </div>
      <main className="min-w-0 flex-1">{children}</main>
      <Footer />
    </div>
  );
}
