"use client";

import { type Category } from "@/lib/store-design/types";
import { cn } from "@/lib/utils";
import { CategoryThumb } from "@/components/seller/CategoryThumb";
import { Link } from "./blocks";
import { catImage, THUMB_THEME } from "./tokens";
import { type Ctx } from "./types";

export function ClassicCategoryList({ ctx, list }: { ctx: Ctx; list: Category[] }) {
  const { d, mobile, products, interactive } = ctx;
  const count = (id: string) =>
    products.filter((p) => p.categoryId === id).length;
  const href = (c: Category) =>
    `/store/${d.storeSlug}/products?category=${c.id}`;

  if (d.categoryStyle === "chips") {
    return (
      <div
        className="flex items-start justify-around gap-4 overflow-x-auto p-6"
        style={{
          background: "var(--s-bg)",
          border: "1px solid var(--s-border)",
          borderRadius: 24,
        }}
      >
        {list.slice(0, 8).map((c) => (
          <Link
            key={c.id}
            on={interactive}
            href={href(c)}
            className="flex w-28 shrink-0 flex-col items-center gap-3 text-center transition-transform active:scale-95"
          >
            <CategoryThumb
              name={c.name}
              imageUrl={catImage(c)}
              className="h-24 w-24 bg-[color:var(--s-surface)] text-[color:var(--s-text)]"
              textClassName="text-3xl"
            />
            <span className="line-clamp-1 text-sm font-semibold">{c.name}</span>
          </Link>
        ))}
      </div>
    );
  }

  if (d.categoryStyle === "cards") {
    return (
      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: `repeat(${mobile ? 2 : Math.min(list.length, 4)}, minmax(0, 1fr))`,
        }}
      >
        {list.map((c) => (
          <Link
            key={c.id}
            on={interactive}
            href={href(c)}
            className="flex w-[92px] shrink-0 snap-start flex-col items-center gap-2 text-center transition-transform active:scale-95"
          >
            <CategoryThumb
              name={c.name}
              imageUrl={catImage(c)}
              className={cn("h-[84px] w-[84px] rounded-[26px]", THUMB_THEME)}
              textClassName="text-3xl"
            />
            <span className="line-clamp-2 text-xs font-semibold leading-tight">
              {c.name}
            </span>
          </Link>
        ))}
      </div>
    );
  }

  if (!mobile) {
    return (
      <div
        className="flex items-start justify-around gap-3 overflow-x-auto p-5"
        style={{
          background: "var(--s-bg)",
          border: "1px solid var(--s-border)",
          borderRadius: 24,
        }}
      >
        {list.slice(0, 8).map((c) => (
          <Link
            key={c.id}
            on={interactive}
            href={href(c)}
            className="flex w-20 shrink-0 flex-col items-center gap-2 text-center transition-transform active:scale-95"
          >
            <CategoryThumb
              name={c.name}
              imageUrl={catImage(c)}
              className="h-14 w-14 bg-[color:var(--s-surface)] text-[color:var(--s-text)]"
              textClassName="text-xl"
            />
            <span className="line-clamp-1 text-xs font-medium">{c.name}</span>
          </Link>
        ))}
      </div>
    );
  }

  // Mobile: soft rounded tiles with a label underneath
  return (
    <div
      className={cn(
        "no-scrollbar flex gap-3 overflow-x-auto [-webkit-overflow-scrolling:touch]",
        mobile && "-mx-4 snap-x snap-mandatory scroll-px-4 px-4",
      )}
    >
      {list.map((c) => (
        <Link
          key={c.id}
          on={interactive}
          href={href(c)}
          className="flex w-[72px] shrink-0 snap-start flex-col items-center gap-2 text-center transition-transform active:scale-95"
        >
          <CategoryThumb
            name={c.name}
            imageUrl={catImage(c)}
            className={cn("h-[64px] w-[64px] rounded-[22px]", THUMB_THEME)}
            textClassName="text-2xl"
          />
          <span className="line-clamp-2 text-[11px] font-semibold leading-tight">
            {c.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
