import Link from "next/link";
import { CookieSettingsButton } from "@/components/legal/SiteCookieBanner";
import styles from "./footer.module.css";

const groups = [
  {
    title: "Buy",
    links: [
      ["Browse products", "/products"],
      ["Shop by category", "/?view=categories"],
      ["Today’s deals", "/products?deals=1"],
      ["Explore stores", "/sellers"],
    ],
  },
  {
    title: "Sell",
    links: [
      ["Start selling", "/register?role=seller"],
      ["How to sell", "/how-to-sell"],
      ["Plans and pricing", "/pricing"],
      ["Seller dashboard", "/seller/dashboard"],
    ],
  },
  {
    title: "Your account",
    links: [
      ["Create an account", "/register"],
      ["Sign in", "/login"],
      ["Wishlist", "/wishlist"],
      ["My orders", "/account/orders"],
    ],
  },
  {
    title: "About Snappy",
    links: [
      ["Our marketplace", "/about"],
      ["Discover looks", "/looks"],
      ["Meet the sellers", "/sellers"],
    ],
  },
  {
    title: "Help and support",
    links: [
      ["Help center", "/help"],
      ["Contact a seller", "/help#contact-seller"],
      ["Returns and refunds", "/refund-policy"],
      ["Reset your password", "/forgot-password"],
    ],
  },
];

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <nav className={styles.columns} aria-label="Footer">
          {groups.map((group) => (
            <div key={group.title}>
              <h2>{group.title}</h2>
              <ul>
                {group.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href}>{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className={styles.legal}>
          <span>© {new Date().getFullYear()} Snappy</span>
          <Link href="/terms">Terms of use</Link>
          <Link href="/privacy">Privacy policy</Link>
          <Link href="/cookie-policy">Cookie policy</Link>
          <CookieSettingsButton className={styles.settings} />
        </div>
      </div>
    </footer>
  );
}
