"use client";
import {
  AddReviewButton,
  ProductReviews,
  ReviewScore,
} from "@/components/reviews/Reviews";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import {
  toggleWishlistItem,
  useWishlisted,
} from "@/lib/store-design/use-wishlist";
import { useMarketplaceProducts } from "@/lib/query/marketplace";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api/auth";
import { trackAnalyticsEvent } from "@/lib/api/analytics";
import { shouldCountView } from "@/lib/api/analytics-visitor";
import { qk } from "@/lib/query/keys";
import { formatPrice } from "@/lib/format";
import { recordProductView } from "@/lib/viewed-products";
import {
  marketplaceProductHref,
  storeHref,
} from "@/lib/query/marketplace-links";
import { lineKey, useCartStrict } from "@/lib/store-design/cart";
import { usePublicDelivery } from "@/lib/delivery/use-delivery";
import { chargesFor } from "@/lib/delivery/pricing";
import type { Product } from "@/lib/store-design/types";
import {
  allProductImages,
  comboLabel,
  effectivePrice,
  findCombination,
  productImages,
  variantImageIndex,
  variantOptions,
  type Selection,
} from "@/lib/store-design/variants";

import {
  TopSellingCard,
  type CardProduct,
} from "@/components/features/TopSellingCard";
type Props = {
  related: CardProduct[];
  category?: string;
  product: Product;
  seller: string;
  slug: string;
  paused?: boolean;
};

export default function MarketplaceProduct({
  product,
  seller,
  slug,
  paused,
  category,
  related,
}: Props) {
  const cart = useCartStrict();
  const me = useQuery({
    queryKey: qk.auth.me,
    queryFn: authApi.me,
    retry: false,
    staleTime: 60_000,
  });
  useEffect(() => {
    if (me.isFetched && !me.data && shouldCountView(slug, product.id)) {
      trackAnalyticsEvent({
        kind: "product_view",
        storeSlug: slug,
        productId: product.id,
      }).catch(() => {});
    }
  }, [me.isFetched, me.data, product.id, slug]);

  // Remember this product for the home page's "Recently viewed" row.
  useEffect(() => {
    recordProductView({
      id: product.id,
      slug,
      storeName: seller || slug,
      title: product.name,
      price: product.price,
      compareAtPrice: product.comparePrice,
      image: allProductImages(product)[0],
    });
  }, [product, slug, seller]);

  const delivery = usePublicDelivery(slug);
  const charges = delivery.data && chargesFor(delivery.data, product.id);
  const [selection, setSelection] = useState<Selection>({});
  const [photo, setPhoto] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState("Description");
  const wished = useWishlisted(slug, product.id);
  const more = useMarketplaceProducts(
    { sort: "top_selling", limit: 12 },
    { enabled: related.length < 4 },
  );
  const suggestions = [...related];
  for (const item of more.data?.items ?? []) {
    if (suggestions.length >= 4) break;
    const sameProduct = (p: CardProduct) =>
      p.store.slug === item.store.slug && p.id === item.id;
    if (
      (item.id !== product.id || item.store.slug !== slug) &&
      !suggestions.some(sameProduct)
    ) {
      suggestions.push(item);
    }
  }
  const options = variantOptions(product);
  const combo = findCombination(product, selection);
  const pictures = allProductImages(product);
  const price = effectivePrice(product, combo);
  const picked = options.length === 0 || !!combo;
  const stock = combo?.stock ?? (options.length ? 0 : product.stock);
  const key = lineKey({ productId: product.id, variantId: combo?.id });
  const inCart = cart.lines.find((line) => lineKey(line) === key)?.qty ?? 0;
  const available = Math.max(0, stock - inCart);
  const qty = Math.min(quantity, Math.max(available, 1));

  function pick(optionId: string, valueId: string) {
    // Keep compatible choices and clear conflicting choices for the buyer.
    const next = { ...selection, [optionId]: valueId };
    const matches = (product.combinations ?? []).filter(
      (c) => c.valueIds[optionId] === valueId,
    );
    const valid = matches.some((c) =>
      Object.entries(next).every(([id, v]) => c.valueIds[id] === v),
    );
    const chosen = valid ? next : { [optionId]: valueId };
    setSelection(chosen);
    const image = variantImageIndex(
      pictures,
      findCombination(product, chosen) ?? matches[0] ?? null,
    );
    if (image >= 0) setPhoto(image);
    setQuantity(1);
  }

  function add() {
    if (!cart.ready || paused || !picked || inCart > 0 || available < qty) return;
    cart.addItem(
      product,
      qty,
      combo
        ? {
            id: combo.id,
            label: comboLabel(product, combo),
            price,
            sku: combo.sku,
            imageUrl: productImages(product, combo)[0],
          }
        : undefined,
      true,
    );
  }

  const tabs = ["Description", "Additional information", "Reviews"];
  const specs = [
    ...(product.attributes ?? []),
    ...options.map((o) => ({
      key: o.name,
      value: o.values.map((v) => v.label).join(", "),
    })),
  ];
  return (
    <article className="mx-auto max-w-[1160px] px-[clamp(16px,4vw,54px)] pb-16 [&_:is(button,a,input):focus-visible]:[outline:2px_solid_#0C68F6] [&_:is(button,a,input):focus-visible]:[outline-offset:2px]">
      <div className="mx-auto mb-[clamp(30px,4vw,52px)] mt-[clamp(16px,2.5vw,32px)] grid grid-cols-2 items-start gap-[clamp(28px,5vw,66px)] max-[740px]:grid-cols-1 [&>section]:min-w-0">
        <section aria-label="Product photos">
          <div className="relative grid aspect-square place-items-center overflow-hidden rounded-[14px] border border-[#e1e4df] bg-[#f5f5f6] text-[#505651]">
            {pictures[photo] ? (
              <Image
                src={pictures[photo]}
                alt={product.name}
                fill
                priority
                sizes="(min-width: 900px) 500px, 90vw"
                className="object-contain"
              />
            ) : (
              <span>No photo available</span>
            )}
            {pictures.length > 1 && (
              <>
                <button
                  className="absolute top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-[#dde1db] bg-white text-[#21242a] shadow-[0_2px_8px_#12241812] left-3"
                  aria-label="Previous photo"
                  onClick={() =>
                    setPhoto((photo + pictures.length - 1) % pictures.length)
                  }
                >
                  <ChevronLeft />
                </button>
                <button
                  className="absolute top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-[#dde1db] bg-white text-[#21242a] shadow-[0_2px_8px_#12241812] right-3"
                  aria-label="Next photo"
                  onClick={() => setPhoto((photo + 1) % pictures.length)}
                >
                  <ChevronRight />
                </button>
              </>
            )}
          </div>
          {pictures.length > 1 && (
            <div className="flex gap-2 overflow-x-auto px-0.5 py-1.5">
              {pictures.map((url, i) => (
                <button
                  key={url}
                  aria-label={`View photo ${i + 1}`}
                  aria-pressed={photo === i}
                  onClick={() => setPhoto(i)}
                  className="relative aspect-square flex-none basis-[70px] overflow-hidden rounded-[9px] border-2 border-transparent bg-[#f5f5f6] aria-pressed:border-[#0C68F6] max-[740px]:basis-16"
                >
                  <Image
                    src={url}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </section>
        <section className="grid gap-3 self-start py-1">
          {category && (
            <p className="text-[.8125rem] font-semibold tracking-[.025em] opacity-80">
              {category}
            </p>
          )}
          <h1 className="text-[clamp(1.75rem,3.2vw,2.8rem)] font-[650] leading-[1.12] tracking-[-.035em] [overflow-wrap:anywhere]">
            {product.name}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="#product-information"
              onClick={() => setTab("Reviews")}
              className="inline-flex w-fit items-center gap-1.5 text-sm"
            >
              <ReviewScore product={product.id} />
            </a>
            <AddReviewButton product={product.id} />
          </div>
          <div className="flex items-baseline gap-2.5 text-[clamp(1.5rem,2.5vw,2rem)] tracking-[-.025em]">
            <strong>{formatPrice(price)}</strong>{" "}
            {!!product.comparePrice && product.comparePrice > price && (
              <del className="text-base opacity-65">
                {formatPrice(product.comparePrice)}
              </del>
            )}
          </div>
          {product.description && (
            <p className="line-clamp-3 opacity-80">{product.description}</p>
          )}
          {options.map((o) => (
            <fieldset key={o.id}>
              <legend className="mb-1.5 font-semibold">{o.name}</legend>
              <div className="flex flex-wrap items-center gap-2">
                {o.values.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => pick(o.id, v.id)}
                    disabled={
                      !product.combinations?.some(
                        (c) => c.valueIds[o.id] === v.id,
                      )
                    }
                    aria-pressed={selection[o.id] === v.id}
                    className="flex min-h-10 items-center gap-1.5 rounded-lg border border-[#cad0d8] px-2.5 py-1.5 disabled:cursor-not-allowed disabled:opacity-50 aria-pressed:border-[#0C68F6] aria-pressed:shadow-[inset_0_0_0_1px_#0C68F6]"
                  >
                    {v.colorHex && (
                      <i
                        className="h-4 w-4 rounded-full border border-[#aaa]"
                        style={{ backgroundColor: v.colorHex }}
                      />
                    )}
                    {v.label}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}
          <p className="justify-self-start rounded-full bg-[#edf2ff] px-2.5 py-[3px] text-[.8rem] text-[#0C68F6]">
            {paused
              ? "Seller is away"
              : !picked
                ? "Choose your options"
                : stock > 0
                  ? "In stock"
                  : "Sold out"}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <label className="rounded-lg border border-[#cad0d8] px-2.5 py-1.5 text-sm">
              Qty{" "}
              <input
                aria-label="Quantity"
                className="w-[3em] bg-transparent p-1 disabled:cursor-not-allowed disabled:opacity-50"
                type="number"
                min={1}
                max={available || 1}
                value={inCart || qty}
                disabled={!available || paused || inCart > 0}
                onChange={(e) =>
                  setQuantity(
                    Math.min(
                      available,
                      Math.max(1, Math.floor(Number(e.target.value)) || 1),
                    ),
                  )
                }
              />
            </label>
            <button
              className="rounded-[10px] bg-[#0C68F6] px-5 py-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              onClick={add}
              disabled={!cart.ready || paused || !picked || !available || inCart > 0}
            >
              {inCart > 0 ? "Added" : "Add to cart"}
            </button>
            {cart.count > 0 && (
              <Link
                className="rounded-[10px] bg-[#0C68F6] px-5 py-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                href="/checkout"
              >
                Checkout
              </Link>
            )}
            <button
              className="rounded-full border border-[#bbc2bc] p-2.5"
              aria-pressed={wished}
              aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
              onClick={() => toggleWishlistItem(slug, product.id)}
            >
              <Heart size={20} fill={wished ? "currentColor" : "none"} />
            </button>
          </div>
          <div aria-live="polite" className="empty:-my-1.5">
            {inCart > 0 && (
              <p>
                Added to your cart.{" "}
                <Link href="/cart" className="underline">
                  View cart
                </Link>
              </p>
            )}
          </div>
          <div className="border-t border-[#dde0e5] pt-3.5 text-sm leading-[1.7] opacity-80">
            <p>
              Sold by{" "}
              <Link
                href={storeHref({ slug })}
                className="underline underline-offset-[3px]"
              >
                {seller || slug}
              </Link>
            </p>
            {combo?.sku && <p>SKU {combo.sku}</p>}
            {charges && (
              <p>
                Inside Dhaka {formatPrice(charges.insideDhaka)}, outside Dhaka{" "}
                {formatPrice(charges.outsideDhaka)}
              </p>
            )}
            {!!delivery.data?.freeDeliveryThreshold && (
              <p>
                Free delivery from{" "}
                {formatPrice(delivery.data.freeDeliveryThreshold)}
              </p>
            )}
          </div>
        </section>
      </div>
      <section
        id="product-information"
        className="scroll-mt-[calc(var(--market-header-height,100px)+16px)]"
        aria-label="Product information"
      >
        <div
          className="mb-[18px] flex justify-center gap-[clamp(10px,3vw,36px)] border-b border-[#dde0e5] max-[740px]:text-sm"
          aria-label="Information sections"
          role="group"
        >
          {tabs.map((t) => (
            <button
              key={t}
              aria-pressed={t === tab}
              onClick={() => setTab(t)}
              aria-controls="product-panel"
              className="border-b-[3px] border-transparent px-0.5 py-2 aria-pressed:border-[#0C68F6] aria-pressed:font-[650]"
            >
              {t}
            </button>
          ))}
        </div>
        <div
          id="product-panel"
          className="min-h-[110px] [overflow-wrap:anywhere]"
          aria-label={tab}
          role="region"
        >
          {tab === "Description" && (
            <p className="whitespace-pre-line">
              {product.description ||
                "The seller hasn’t added a description yet."}
            </p>
          )}
          {tab === "Additional information" &&
            (specs.length ? (
              <table className="w-full border-collapse overflow-hidden rounded-[10px] text-left">
                <thead className="bg-[#f1f4fa] text-[#21242a]">
                  <tr>
                    <th scope="col" className="px-4 py-2.5">
                      Feature
                    </th>
                    <th scope="col" className="px-4 py-2.5">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {specs.map((s, i) => (
                    <tr
                      key={i}
                      className="even:bg-[#f5f5f6] even:text-[#21242a]"
                    >
                      <th
                        scope="row"
                        className="w-[32%] px-4 py-2.5 font-medium"
                      >
                        {s.key}
                      </th>
                      <td className="px-4 py-2.5">{s.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No additional specifications available.</p>
            ))}
          {tab === "Reviews" && <ProductReviews product={product.id} />}
        </div>
      </section>
      {suggestions.length > 0 && (
        <section className="mt-[clamp(36px,6vw,84px)]">
          <h2 className="mb-6 text-center text-[clamp(1.6rem,3vw,2.25rem)] font-[650] tracking-[-.03em]">
            You may also like
          </h2>
          <div className="grid grid-cols-4 gap-[clamp(12px,2vw,24px)] max-[740px]:grid-cols-2">
            {suggestions.map((p) => (
              <TopSellingCard
                key={marketplaceProductHref(p.store.slug, p.id)}
                product={p}
              />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
