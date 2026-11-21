import { Suspense } from "react";
import { Footer } from "@/components/shared/Footer";
import { Navbar } from "@/components/shared/Header";
import { MobileCategoryBar } from "@/components/features/home/Homesidebar";
import "./marketplace.css";

// Theme tokens for the marketplace, scoped to this layout (shadcn-style HSL triplets).
const THEME =
  "[--background:0_0%_100%] [--foreground:224_19%_9%] [--card:0_0%_100%] [--card-foreground:var(--foreground)] [--popover:var(--card)] [--popover-foreground:var(--foreground)] [--muted:225_12%_96%] [--muted-foreground:222_9%_37%] [--secondary:var(--muted)] [--secondary-foreground:var(--foreground)] [--border:220_12%_88%] [--input:var(--border)] [--primary:216.41_92.86%_50.59%] [--accent:var(--primary)] [--ring:var(--primary)] [--primary-foreground:0_0%_100%] [--accent-foreground:var(--primary-foreground)] [--gutter:clamp(16px,3.4vw,48px)] [--market-width:1400px] " +
  "dark:[--background:226_19%_10%] dark:[--card:226_16%_14%] dark:[--foreground:220_20%_95%] dark:[--muted:222_14%_20%] dark:[--muted-foreground:218_13%_75%] dark:[--border:220_13%_29%]";

// Category bar: restyles the nav rendered by <MobileCategoryBar />.
const DEPARTMENTS =
  "[&_nav]:m-0 [&_nav]:block [&_nav]:border-b [&_nav]:py-[5px] lg:[&_nav]:py-1 [&_ul]:m-0 [&_ul]:gap-1 [&_ul]:p-0 lg:[&_ul]:[justify-content:safe_center] [&_a]:border-0 [&_a]:bg-transparent [&_a]:px-3 [&_a]:text-foreground [&_a:hover]:bg-muted [&_a[aria-current=page]]:bg-muted [&_svg]:hidden";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`marketplace-public relative flex min-h-screen flex-col bg-background text-foreground ${THEME}`}>
      <Navbar />
      <div className={`mx-auto w-full max-w-[var(--market-width)] px-[var(--gutter)] ${DEPARTMENTS}`}>
        <Suspense fallback={<div className="h-10" />}>
          <MobileCategoryBar />
        </Suspense>
      </div>
      <main className="min-w-0 flex-1">{children}</main>
      <Footer />
    </div>
  );
}
