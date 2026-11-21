import Link from "next/link";
import "./auth.css";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="account-entry">
      <header>
        <Link href="/" className="entry-logo">
          ShopBD
        </Link>
        <Link href="/products">Browse products</Link>
      </header>
      <main>{children}</main>
    </div>
  );
}
