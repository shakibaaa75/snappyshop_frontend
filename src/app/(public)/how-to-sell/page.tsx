import Link from "next/link";

export const metadata = { title: "How to sell on Snappy | Snappy" };

export default function Page() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">How to sell on Snappy</h1>
      <p className="mb-8 mt-3 leading-7 text-muted-foreground">From opening your store to managing your first order.</p>
      <section id="register" className="scroll-mt-[calc(var(--market-header-height,120px)+24px)] border-t py-6">
        <h2 className="text-lg font-semibold">Create your seller account</h2>
        <p className="mb-3 mt-2 leading-7 text-muted-foreground">Choose seller registration and follow the setup steps to verify your email and add your store details.</p>
        <Link href="/register?role=seller" className="font-medium underline underline-offset-4">Register as a seller</Link>
      </section>
      <section id="listings" className="scroll-mt-[calc(var(--market-header-height,120px)+24px)] border-t py-6">
        <h2 className="text-lg font-semibold">Prepare your listings</h2>
        <p className="mb-3 mt-2 leading-7 text-muted-foreground">In your seller dashboard, add photos, prices and stock. For products with sizes or colors, set up the available combinations.</p>
        <Link href="/seller/dashboard" className="font-medium underline underline-offset-4">Open seller dashboard</Link>
      </section>
      <section id="delivery" className="scroll-mt-[calc(var(--market-header-height,120px)+24px)] border-t py-6">
        <h2 className="text-lg font-semibold">Set delivery charges</h2>
        <p className="mb-3 mt-2 leading-7 text-muted-foreground">In your delivery settings, enter rates for inside and outside Dhaka. Use product-specific rates when an item needs a different charge.</p>
        <Link href="/seller/setup" className="font-medium underline underline-offset-4">Go to your store</Link>
      </section>
      <section id="orders" className="scroll-mt-[calc(var(--market-header-height,120px)+24px)] border-t py-6">
        <h2 className="text-lg font-semibold">Manage incoming orders</h2>
        <p className="mb-3 mt-2 leading-7 text-muted-foreground">Use Orders in the dashboard to review purchases, check selected variants and update delivery and payment status.</p>
        <Link href="/seller/dashboard" className="font-medium underline underline-offset-4">View seller dashboard</Link>
      </section>
    </article>
  );
}
