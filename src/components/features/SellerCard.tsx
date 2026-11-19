import Link from "next/link";
import { BadgeCheck, Package, Star, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { img } from "@/lib/images";
import type { Store } from "@/types";

/** Instagram-story gradient: yellow/orange (bottom-left) to pink/purple (top-right). */
const STORY_RING =
  "linear-gradient(to top right, #fdc830 0%, #f37335 22%, #ee2a7b 55%, #c026d3 78%, #7c3aed 100%)";

/** Stable hue from the seller id so cover-less stores still get their own colour. */
function hueFrom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
}

/**
 * Premium seller card: cover image, round story-ring logo overlapping the
 * cover, name + verified tick, a short "what they sell" line and quick stats.
 */
export function SellerCard({
  store,
  className,
}: {
  store: Store;
  className?: string;
}) {
  const initial = (store.name || "S").trim().charAt(0).toUpperCase();
  const hue = hueFrom(store.id || store.slug || store.name);

  const sells = store.description?.trim() || "";

  const stats: Array<{ key: string; icon: React.ReactNode; text: string }> = [];
  if (typeof store.productCount === "number" && store.productCount > 0)
    stats.push({
      key: "p",
      icon: <Package className="h-3 w-3" />,
      text: `${store.productCount} ${store.productCount === 1 ? "product" : "products"}`,
    });
  if (store.rating)
    stats.push({
      key: "r",
      icon: <Star className="h-3 w-3 fill-amber-400 text-amber-400" />,
      text: store.rating.toFixed(1),
    });
  if (store.followers)
    stats.push({
      key: "f",
      icon: <Users className="h-3 w-3" />,
      text: `${store.followers}`,
    });

  return (
    <Link
      href={`/store/${store.slug}`}
      title={store.name}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border bg-card text-left",
        "transition-[transform,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "hover:-translate-y-1 hover:border-foreground/25",
        className,
      )}
    >
      {/* Cover */}
      <div
        className="relative h-24 w-full overflow-hidden"
        style={{
          background: `linear-gradient(135deg, hsl(${hue} 78% 82%), hsl(${(hue + 48) % 360} 80% 74%))`,
        }}
      >
        {store.banner && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img(store.banner, { width: 640, height: 192 })}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
          />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/15 to-transparent" />
      </div>

      {/* Logo with story ring, overlapping the cover */}
      <div className="relative z-10 -mt-10 flex justify-start px-4">
        <span className="relative">
          <span
            className="block rounded-full p-[3px] transition-transform duration-300 group-hover:scale-105"
            style={{ background: STORY_RING }}
          >
            <span className="block rounded-full bg-card p-[3px]">
              {store.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img(store.logo, { width: 144, height: 144 })}
                  alt=""
                  width={72}
                  height={72}
                  loading="lazy"
                  className="h-[72px] w-[72px] rounded-full bg-muted object-cover"
                />
              ) : (
                <span
                  aria-hidden
                  className="grid h-[72px] w-[72px] place-items-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600"
                >
                  {initial}
                </span>
              )}
            </span>
          </span>
          {store.isVerified && (
            <BadgeCheck
              aria-label="Verified seller"
              className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-card text-sky-500"
            />
          )}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
        <h3 className="truncate text-[15px] font-semibold tracking-tight group-hover:underline">
          {store.name}
        </h3>

        <p className="mt-1 line-clamp-2 min-h-[2.1rem] text-xs leading-snug text-muted-foreground">
          {sells || "Independent seller on ShopBD"}
        </p>

        {stats.length > 0 && (
          <ul className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-3 text-[11px] text-muted-foreground">
            {stats.map((s) => (
              <li key={s.key} className="inline-flex items-center gap-1">
                {s.icon}
                {s.text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Link>
  );
}
