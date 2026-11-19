import "./marketplace.css";
import { Navbar } from "@/components/shared/Header";
import { HideOnStorefront } from "@/components/HideOnStorefront";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="marketplace-public relative flex min-h-screen flex-col bg-background">
      <HideOnStorefront>
        <Navbar />
      </HideOnStorefront>
      <main className="flex-1">{children}</main>
    </div>
  );
}
