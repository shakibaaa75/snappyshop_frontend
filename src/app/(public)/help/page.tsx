import Link from "next/link";

export const metadata = { title: "Help center | Snappy" };

export default function Page() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Help center</h1>
      <p className="mb-8 mt-3 leading-7 text-muted-foreground">Find help with purchases, store questions and account access.</p>
      <section id="orders" className="scroll-mt-[calc(var(--market-header-height,120px)+24px)] border-t py-6">
        <h2 className="text-lg font-semibold">Find an order</h2>
        <p className="mb-3 mt-2 leading-7 text-muted-foreground">Sign in to the buyer account you used at checkout and open My orders to see your purchase details.</p>
        <Link href="/account/orders" className="font-medium underline underline-offset-4">My orders</Link>
      </section>
      <section id="contact-seller" className="scroll-mt-[calc(var(--market-header-height,120px)+24px)] border-t py-6">
        <h2 className="text-lg font-semibold">Contact a seller</h2>
        <p className="mb-3 mt-2 leading-7 text-muted-foreground">Open the store from the Sold by link on a product page, or find it in the seller directory. Use the contact details the seller has published. For order questions, include your order number.</p>
        <Link href="/sellers" className="font-medium underline underline-offset-4">Find a store</Link>
      </section>
      <section id="returns" className="scroll-mt-[calc(var(--market-header-height,120px)+24px)] border-t py-6">
        <h2 className="text-lg font-semibold">Returns and refunds</h2>
        <p className="mb-3 mt-2 leading-7 text-muted-foreground">Check the return and refund policy for the steps that apply to your purchase.</p>
        <Link href="/refund-policy" className="font-medium underline underline-offset-4">Read the refund policy</Link>
      </section>
      <section id="account" className="scroll-mt-[calc(var(--market-header-height,120px)+24px)] border-t py-6">
        <h2 className="text-lg font-semibold">Recover your account</h2>
        <p className="mb-3 mt-2 leading-7 text-muted-foreground">Request a reset code using your registered email address and enter it on the password reset page.</p>
        <Link href="/forgot-password" className="font-medium underline underline-offset-4">Request a reset code</Link>
      </section>
    </article>
  );
}
