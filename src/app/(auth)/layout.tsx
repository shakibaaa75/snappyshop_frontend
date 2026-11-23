import Link from "next/link";
import { AuthBrand } from "@/components/features/auth/AuthShell";
import "./auth.css";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="account-entry">
      <header>
        <AuthBrand />
        <Link href="/products">Browse products</Link>
      </header>
      <main>{children}</main>
    </div>
  );
}
