import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { FaFacebookF, FaInstagram, FaYoutube, FaTiktok } from "react-icons/fa6";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CookieSettingsButton } from "@/components/legal/SiteCookieBanner";

const quick = [
  ["Home", "/"],
  ["Categories", "/categories"],
  ["Sellers", "/sellers"],
  ["Deals", "/deals"],
];
const support = [
  ["Help Center", "/help"],
  ["Return & Refund Policy", "/refund-policy"],
  ["Terms & Conditions", "/terms"],
  ["Privacy Policy", "/privacy"],
  ["Cookie Policy", "/cookie-policy"],
];

function Col({ title, items }: { title: string; items: string[][] }) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">{title}</h4>
      <ul className="space-y-2 text-xs text-primary-foreground/70">
        {items.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 grid gap-10 md:grid-cols-[1.2fr_1fr_1fr_1fr_1.6fr]">
        <div className="space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2 font-extrabold text-xl"
          >
            <ShoppingBag className="h-6 w-6 text-accent" /> ShopBD
          </Link>
          <p className="text-xs text-primary-foreground/70">
            Local Products. Bigger Dreams.
          </p>
        </div>
        <Col title="Quick Links" items={quick} />
        <Col title="Support" items={support} />
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Follow Us</h4>
          <div className="flex gap-3">
            {[FaFacebookF, FaInstagram, FaYoutube, FaTiktok].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="Social link"
                className="h-8 w-8 rounded-full bg-white/10 grid place-items-center hover:bg-accent"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        <form className="space-y-3">
          <h4 className="text-sm font-semibold">Subscribe to our newsletter</h4>
          <p className="text-xs text-primary-foreground/70">
            Get the latest deals and updates.
          </p>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter your email"
              className="bg-white text-foreground h-10"
            />
            <Button
              type="submit"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Subscribe
            </Button>
          </div>
        </form>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex justify-between text-[11px] text-primary-foreground/60">
          <span className="flex items-center gap-3">
            <span>
              © {new Date().getFullYear()} ShopBD. All rights reserved.
            </span>
            <CookieSettingsButton className="underline underline-offset-2 hover:text-white" />
          </span>
          <span className="flex items-center gap-1">
            Made with <Heart className="h-3 w-3 fill-red-500 text-red-500" /> in
            Bangladesh
          </span>
        </div>
      </div>
    </footer>
  );
}
