import Link from "next/link";

export const metadata = { title: "About Snappy | Snappy" };

export default function Page() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">About Snappy</h1>
      <p className="mb-8 mt-3 leading-7 text-muted-foreground">Snappy brings independent stores across Bangladesh into one marketplace. Browse products from different sellers, or visit a store to see its full collection.</p>
      <section id="shopping" className="scroll-mt-[calc(var(--market-header-height,120px)+24px)] border-t py-6">
        <h2 className="text-lg font-semibold">Shop across stores</h2>
        <p className="mb-3 mt-2 leading-7 text-muted-foreground">Each product page shows the seller, photos, price and available options. Use the heart to save a product to your wishlist.</p>
        <Link href="/products" className="font-medium underline underline-offset-4">Explore the marketplace</Link>
      </section>
      <section id="selling" className="scroll-mt-[calc(var(--market-header-height,120px)+24px)] border-t py-6">
        <h2 className="text-lg font-semibold">Sell on Snappy</h2>
        <p className="mb-3 mt-2 leading-7 text-muted-foreground">Create a seller account to publish products, set delivery charges and manage orders from your dashboard.</p>
        <Link href="/how-to-sell" className="font-medium underline underline-offset-4">Read the selling guide</Link>
      </section>
    </article>
  );
}
