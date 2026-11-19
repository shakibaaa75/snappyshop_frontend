"use client";

import {
  type Category,
  type HomeSection,
  usesDropLayout,
} from "@/lib/store-design/types";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { img } from "@/lib/images";
import { resolveCategories } from "@/lib/store-design/utilts";
import { Block, Heading, Link, Placeholder } from "./blocks";
import { ClassicCategoryList } from "./category-list";
import { CategoryRail, CollectionGrid } from "./category-rail";
import {
  CAT_ASPECT,
  CAT_GAP,
  catPhoto,
  catRadius,
  CatTile,
} from "./category-tiles";
import { bentoLayout } from "./gallery-bento";
import { muted } from "./tokens";
import { type Ctx } from "./types";

function CategoryList({ ctx, list }: { ctx: Ctx; list: Category[] }) {
  const { d, mobile, products, interactive } = ctx;
  const o = d.categoryOptions;
  const gap = CAT_GAP[o.gap];
  const style = d.categoryStyle;

  if (style === "tiles") {
    const cols = mobile ? 2 : Math.min(5, Math.max(2, o.columns));
    return (
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          columnGap: gap,
          rowGap: o.label === "below" ? Math.max(gap, 16) : gap,
        }}
      >
        {list.map((c) => (
          <CatTile
            key={c.id}
            c={c}
            ctx={ctx}
            o={o}
            aspect={CAT_ASPECT[o.aspect]}
          />
        ))}
      </div>
    );
  }

  if (style === "banner") {
    const cols = mobile ? 1 : Math.min(3, Math.max(1, o.columns));
    /* "portrait" and "square" make poor banners; they still work, just tall. */
    return (
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          columnGap: gap,
          rowGap: gap,
        }}
      >
        {list.map((c) => (
          <CatTile
            key={c.id}
            c={c}
            ctx={ctx}
            o={o}
            aspect={
              mobile && o.aspect === "wide"
                ? CAT_ASPECT.landscape
                : CAT_ASPECT[o.aspect]
            }
            labelSize="lg"
          />
        ))}
      </div>
    );
  }

  if (style === "rail" && usesDropLayout(d)) {
    return <CollectionGrid ctx={ctx} list={list} />;
  }
  if (style === "rail") return <CategoryRail ctx={ctx} list={list} />;

  if (style === "strip") {
    const cols = mobile ? 1.6 : Math.min(5, Math.max(2, o.columns));
    return (
      <div
        className={cn(
          "no-scrollbar flex snap-x snap-mandatory overflow-x-auto [-webkit-overflow-scrolling:touch]",
          mobile && "-mx-4 scroll-px-4 px-4",
        )}
        style={{ gap }}
      >
        {list.map((c) => (
          <div
            key={c.id}
            className="shrink-0 snap-start"
            style={{
              width: `calc((100% - ${gap * (Math.ceil(cols) - 1)}px) / ${cols + 0.35})`,
              minWidth: mobile ? 150 : 180,
            }}
          >
            <CatTile
              c={c}
              ctx={ctx}
              o={{ ...o, label: "inside" }}
              aspect={CAT_ASPECT[o.aspect]}
              forceInside
            />
          </div>
        ))}
      </div>
    );
  }

  if (style === "mosaic") {
    const chunks: Category[][] = [];
    for (let i = 0; i < list.length; i += 4) chunks.push(list.slice(i, i + 4));
    return (
      <div className="flex flex-col" style={{ gap }}>
        {chunks.map((chunk, ci) => {
          const layout = bentoLayout(chunk.length, ci % 2 === 1);
          return (
            <div
              key={ci}
              className="grid"
              style={{
                gap,
                ...(mobile
                  ? { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }
                  : {
                      gridTemplateColumns: layout.cols,
                      gridTemplateRows: chunk.length > 2 ? "1fr 1fr" : "1fr",
                      aspectRatio: layout.ratio,
                    }),
              }}
            >
              {chunk.map((c, i) => {
                const slot = layout.slots[i];
                return (
                  <div
                    key={c.id}
                    className="min-w-0"
                    style={
                      mobile
                        ? {
                            gridColumn:
                              slot.role === "small" ? "span 1" : "1 / -1",
                            aspectRatio:
                              slot.role === "small"
                                ? "1 / 1"
                                : slot.role === "tall"
                                  ? "5 / 4"
                                  : "2 / 1",
                          }
                        : { gridColumn: slot.col, gridRow: slot.row }
                    }
                  >
                    <CatTile
                      c={c}
                      ctx={ctx}
                      o={o}
                      fill
                      forceInside
                      labelSize={slot.role === "small" ? "sm" : "lg"}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  /* list */
  const center = o.align === "center";
  return (
    <ul
      className="m-0 list-none p-0"
      style={{ borderTop: "1px solid var(--s-border)" }}
    >
      {list.map((c) => {
        const photo = catPhoto(c, products);
        const n = products.filter((p) => p.categoryId === c.id).length;
        return (
          <li key={c.id} style={{ borderBottom: "1px solid var(--s-border)" }}>
            <Link
              on={interactive}
              href={`/store/${d.storeSlug}/products?category=${c.id}`}
              className={cn(
                "group flex items-center gap-4 py-4 transition-opacity active:opacity-70",
                center && "justify-center",
              )}
            >
              {o.showImage && (
                <span
                  className="relative h-14 w-14 shrink-0 overflow-hidden"
                  style={{
                    borderRadius: catRadius(ctx, o, true),
                    background: "var(--s-surface)",
                  }}
                >
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img(photo, { width: 200 })}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span
                      className="flex h-full w-full items-center justify-center text-lg font-semibold opacity-50"
                      aria-hidden
                    >
                      {c.emoji || c.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </span>
              )}
              <span
                className={cn(
                  "min-w-0 text-lg font-medium leading-tight sm:text-xl",
                  !center && "flex-1 truncate",
                  o.textCase === "upper" && "uppercase tracking-[0.08em]",
                )}
              >
                {c.name}
              </span>
              {o.showCount && (
                <span className="shrink-0 text-xs tabular-nums" style={muted}>
                  {n} {n === 1 ? "item" : "items"}
                </span>
              )}
              {o.showArrow && (
                <ArrowRight
                  className="h-4 w-4 shrink-0 transition-transform motion-safe:group-hover:translate-x-1"
                  aria-hidden
                />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
export function Categories({ ctx, section }: { ctx: Ctx; section: HomeSection }) {
  const list = resolveCategories(ctx.d, ctx.products, ctx.categories);
  const o = ctx.d.categoryOptions;
  const classic = ["circles", "cards", "chips"].includes(ctx.d.categoryStyle);
  return (
    <Block ctx={ctx}>
      {o.eyebrow && (
        <p
          className="mb-1 text-[10px] font-medium uppercase leading-none tracking-[0.14em]"
          style={muted}
        >
          {o.eyebrow}
        </p>
      )}
      {usesDropLayout(ctx.d) && !classic ? (
        <div className="mb-6 text-center">
          <h2 className="uppercase leading-tight tracking-[0.16em]">
            {section.title || "Shop by collection"}
          </h2>
        </div>
      ) : (
        <Heading
          title={section.title || "Category"}
          href={`/store/${ctx.d.storeSlug}/products`}
          on={ctx.interactive}
        />
      )}
      {list.length === 0 ? (
        <Placeholder>Choose which categories to show.</Placeholder>
      ) : classic ? (
        <div
          className={
            o.textCase === "upper" ? "uppercase tracking-wide" : undefined
          }
        >
          <ClassicCategoryList ctx={ctx} list={list} />
        </div>
      ) : (
        <CategoryList ctx={ctx} list={list} />
      )}
    </Block>
  );
}
