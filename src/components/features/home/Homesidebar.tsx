"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Armchair,
  ArrowRight,
  BookOpen,
  Car,
  Gamepad2,
  HeartPulse,
  Home,
  LayoutGrid,
  Shirt,
  ShoppingBasket,
  Smartphone,
  Sparkles,
  Store,
  Tag,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { chipClass } from "@/components/features/home/SectionState";
import { useMainTypes } from "@/lib/query/marketplace";
import { homeHref, mainIdOf } from "@/lib/query/category-nav";

/** Height of one row. The sliding notch moves in steps of this value. */
const ROW_H = 52;

export type SideLink = {
  icon: LucideIcon;
  label: string;
  href: string;
  /** Main Type ID (e.g. "fashion") used in /?category=… (also read by HomeShell) */
  slug?: string;
};

/** Icon per Main Type ID (IDs come from the platform taxonomy). */
const MAIN_ICONS: Record<string, LucideIcon> = {
  fashion: Shirt,
  electronics: Smartphone,
  "home-and-living": Armchair,
  "beauty-and-personal-care": Sparkles,
  "sports-and-outdoors": Trophy,
  "toys-and-games": Gamepad2,
  "health-and-wellness": HeartPulse,
  "books-and-stationery": BookOpen,
  groceries: ShoppingBasket,
  automotive: Car,
};

export const mainIcon = (id: string): LucideIcon => MAIN_ICONS[id] ?? Tag;

const HOME_LINK: SideLink = { icon: Home, label: "Home", href: "/" };
const ALL_LINK: SideLink = {
  icon: LayoutGrid,
  label: "All categories",
  href: "/?view=categories",
};

/**
 * Home + one row per Main Type (from the platform taxonomy, so the IDs always
 * match what the backend filters on) + "All categories".
 * Every link stays on "/" and only changes the query string, so the page
 * (and this sidebar) never unmounts. HomeShell reads the same query.
 */
function useSideLinks() {
  const { mains: loaded, isPending: queryPending } = useMainTypes();

  // The server always renders this before any data exists. Another component
  // may already have filled the shared query cache by the time this one
  // hydrates, so the first client render must pretend there is no data too;
  // otherwise React reports a hydration mismatch. Real data shows right after.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const mains = hydrated ? loaded : [];
  const isPending = hydrated ? queryPending : true;

  const links = useMemo<SideLink[]>(
    () => [
      HOME_LINK,
      ...mains.map((m) => ({
        icon: mainIcon(m.id),
        label: m.name,
        href: homeHref({ category: m.id }),
        slug: m.id,
      })),
      ALL_LINK,
    ],
    [mains],
  );
  return { links, isPending };
}

/** Which row does the URL belong to? (-1 = none) */
function indexFromUrl(
  links: SideLink[],
  pathname: string,
  category: string | null,
  view: string | null,
) {
  if (pathname !== "/") return -1;
  // "fashion.hoodie" highlights the Fashion row too.
  if (category) return links.findIndex((l) => l.slug === mainIdOf(category));
  if (view === "categories") return links.length - 1;
  return 0;
}

export function HomeSidebar() {
  const pathname = usePathname();
  const params = useSearchParams();
  const { links, isPending } = useSideLinks();
  const fromUrl = indexFromUrl(
    links,
    pathname,
    params.get("category"),
    params.get("view"),
  );

  const [selected, setSelected] = useState(fromUrl);
  useEffect(() => setSelected(fromUrl), [fromUrl]);

  const shown = Math.max(selected, 0);
  const hasActive = selected >= 0;

  return (
    <aside className="market-sidebar hidden px-2 lg:block">
      <div className="space-y-5">
        <nav
          aria-label="Categories"
          className="relative rounded-[28px] bg-[#17645F] pb-3 dark:bg-black"
        >
          <p className="px-5 pb-2 pt-5 text-xs font-medium text-white/70">
            Shop by category
          </p>

          <div
            className="relative"
            style={{ height: (links.length + (isPending ? 4 : 0)) * ROW_H }}
            aria-busy={isPending}
          >
            {/* Sliding bubble behind the active icon */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 z-0 transition-[transform,opacity] duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
              style={{
                height: ROW_H,
                transform: `translateY(${shown * ROW_H}px)`,
                opacity: hasActive ? 1 : 0,
              }}
            >
              <span className="absolute left-[11px] top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-[#FF6845] dark:bg-white" />
            </div>

            {/* Rows */}
            <ul className="relative z-10">
              {links.map((l, i) => {
                const active = i === selected;
                return (
                  <li key={l.label} style={{ height: ROW_H }}>
                    <Link
                      href={l.href}
                      scroll={false}
                      onClick={(event) => {
                        if (
                          event.button !== 0 ||
                          event.metaKey ||
                          event.ctrlKey ||
                          event.shiftKey ||
                          event.altKey
                        )
                          return;
                        setSelected(i);
                      }}
                      aria-current={active ? "page" : undefined}
                      className="group flex h-full items-center gap-4 pl-[11px] pr-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF6845]"
                    >
                      {/* Active icon sits on the coral bubble, so it is white */}
                      <l.icon
                        className={`h-5 w-5 shrink-0 transition-colors duration-200 ${
                          active
                            ? "text-white dark:text-[#FF4D3D]"
                            : "text-white/65 group-hover:text-white"
                        }`}
                        strokeWidth={1.75}
                      />
                      {/* Active label stays white on the blue panel */}
                      <span
                        className={`min-w-0 flex-1 truncate transition-colors duration-200 ${
                          active
                            ? "font-semibold text-white"
                            : "text-white/75 group-hover:text-white"
                        }`}
                      >
                        {l.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Support small businesses: plain white card. Hidden on short screens
            so the nav never gets cut off. */}
        <Link
          href="/sellers"
          className="group relative block min-h-[170px] rounded-3xl border border-border bg-card p-5 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[#17645F] dark:focus-visible:ring-[#D93A2B] focus-visible:ring-offset-2 [@media(max-height:860px)]:hidden"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#17645F] dark:bg-[#D93A2B] text-white">
            <Store className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </span>
          <p className="mt-3 text-lg font-bold leading-tight tracking-tight text-primary [text-wrap:balance]">
            Support Small Businesses
          </p>
          <p className="mt-1.5 max-w-[160px] text-xs leading-snug text-primary/75">
            Shop from independent sellers across Bangladesh.
          </p>
          <span className="absolute bottom-4 right-4 grid h-9 w-9 place-items-center rounded-full bg-[#FF6845] text-white transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none">
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>
    </aside>
  );
}

/**
 * Phone / tablet version of the sidebar: a sideways-scrolling row of chips.
 * Same links, same URLs, so HomeShell swaps the content below it.
 */
export function MobileCategoryBar() {
  const pathname = usePathname();
  const params = useSearchParams();
  const { links } = useSideLinks();
  const active = indexFromUrl(
    links,
    pathname,
    params.get("category"),
    params.get("view"),
  );

  const scroller = useRef<HTMLUListElement>(null);
  const chips = useRef<(HTMLAnchorElement | null)[]>([]);

  // Keep the active chip centred in the row.
  useEffect(() => {
    const box = scroller.current;
    const chip = chips.current[active];
    if (!box || !chip) return;
    box.scrollTo({
      left: chip.offsetLeft - (box.clientWidth - chip.clientWidth) / 2,
      behavior: "smooth",
    });
  }, [active]);

  return (
    <nav aria-label="Categories" className="mb-5 lg:hidden">
      <ul
        ref={scroller}
        className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1 sm:-mx-6 sm:px-6"
      >
        {links.map((l, i) => (
          <li key={l.label} className="shrink-0">
            <Link
              href={l.href}
              ref={(el) => {
                chips.current[i] = el;
              }}
              aria-current={i === active ? "page" : undefined}
              className={chipClass(i === active)}
            >
              <l.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
