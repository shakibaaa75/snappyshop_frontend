"use client";

import Link from "next/link";
import { type CSSProperties, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Shirt, ShoppingBag } from "lucide-react";
import { publicLooks, publicLooksKey } from "@/lib/api/looks-public";
import { type HomeSection, type TemplateId } from "@/lib/store-design/types";
import { Block } from "@/components/store-design/preview/blocks";
import { type Ctx } from "@/components/store-design/preview/types";
import { cn } from "@/lib/utils";

/**
 * "Try the Look" home section. Opens /store/{slug}/try-the-look.
 *
 * It is a normal home section, so the seller places it in Section arrangement.
 * The seller can override the style, photo layout, photo side and colors
 * in Section settings (HomeSection.looks*). Left on "auto", colors come from
 * the store theme, and the DESIGN follows the template:
 *
 *   pookie  Grocery: soft pink, floating hearts, dashed line, tilted photos
 *   soft    friendly templates: tinted, waves, tilted photos
 *   clean   minimal / editorial templates: flat, thin lines, straight photos
 *   bold    sporty / street / tech templates: solid brand block, hard edges
 *
 * Layout reacts to the container width (not the browser), so the mobile
 * preview inside a desktop browser is correct. Nothing is shown to shoppers
 * when the store has no published looks; the editor preview shows samples.
 */

type Look = "pookie" | "soft" | "clean" | "bold";
type Layout = "tilted" | "row";

const HEX = /^#[0-9a-f]{6}$/i;
const validHex = (v?: string) => (v && HEX.test(v.trim()) ? v.trim() : "");

/** White or near-black, whichever reads better on the given hex color. */
function readableOn(hex: string, light = "#ffffff", dark = "#111111") {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.5 ? dark : light;
}

const BOLD: TemplateId[] = [
  "urban",
  "streetwear",
  "sport",
  "night-sale",
  "edge",
  "tech",
  "yokai",
];
const SOFT: TemplateId[] = [
  "kids",
  "bangla-bazaar",
  "promo",
  "marketplace",
  "beauty",
  "skincare",
];

export function looksTheme(template: TemplateId): Look {
  if (template === "grocery") return "pookie";
  if (BOLD.includes(template)) return "bold";
  if (SOFT.includes(template)) return "soft";
  return "clean";
}

const DEFAULT_SUBTITLE =
  "See complete outfits on real models, then shop each piece.";

const HEART =
  "M12 21s-7-4.6-9.6-9.2C.7 8.5 2.5 4.4 6.4 4.4c2.2 0 4 1.3 5.6 3.3 1.6-2 3.4-3.3 5.6-3.3 3.9 0 5.7 4.1 4 7.4C19 16.4 12 21 12 21z";

/* ------------------------------------------------------------------ */
/* Decoration                                                          */
/* ------------------------------------------------------------------ */

function Hanger({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 8.2V7a2 2 0 1 1 2-2" />
      <path d="M12 8.2 3.2 15.3a1.3 1.3 0 0 0 .8 2.3h16a1.3 1.3 0 0 0 .8-2.3L12 8.2z" />
    </svg>
  );
}

function Sparks({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M8 8 6 20" />
      <path d="M22 5l10 11" />
      <path d="M32 24l12 2" />
    </svg>
  );
}

function Scribble() {
  return (
    <svg
      viewBox="0 0 200 20"
      preserveAspectRatio="none"
      fill="none"
      stroke="var(--s-secondary)"
      strokeWidth="4"
      strokeLinecap="round"
      className="pointer-events-none absolute -bottom-2 left-0 h-3 w-full"
      aria-hidden="true"
    >
      <path d="M3 13c40-9 110-10 192-5" />
      <path d="M22 18c40-6 90-7 140-4" strokeWidth="3" opacity=".7" />
    </svg>
  );
}

function Waves() {
  return (
    <svg
      viewBox="0 0 1200 200"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 w-full"
      aria-hidden="true"
    >
      <path
        d="M0 120c140-60 300-40 460 10s330 70 520-10c90-38 170-30 220-5v85H0z"
        fill="var(--s-secondary)"
        opacity=".14"
      />
      <path
        d="M0 170c200-50 380-10 560 20s420 10 640-45v55H0z"
        fill="var(--s-secondary)"
        opacity=".12"
      />
    </svg>
  );
}

/** Pookie only: small hearts of different sizes scattered over the banner. */
function Hearts() {
  const spots: { x: string; y: string; s: number; r: number; o: number }[] = [
    { x: "4%", y: "12%", s: 22, r: -14, o: 0.28 },
    { x: "47%", y: "8%", s: 14, r: 12, o: 0.3 },
    { x: "92%", y: "14%", s: 26, r: 10, o: 0.26 },
    { x: "50%", y: "82%", s: 18, r: -8, o: 0.28 },
    { x: "3%", y: "78%", s: 16, r: 16, o: 0.26 },
    { x: "94%", y: "76%", s: 20, r: -12, o: 0.3 },
  ];
  return (
    <>
      {spots.map((h, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className="pointer-events-none absolute"
          style={{
            left: h.x,
            top: h.y,
            width: h.s,
            height: h.s,
            transform: `rotate(${h.r}deg)`,
            opacity: h.o,
            fill: "var(--s-secondary)",
          }}
          aria-hidden="true"
        >
          <path d={HEART} />
        </svg>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Photo card                                                          */
/* ------------------------------------------------------------------ */

type Slot = { src?: string; alt: string };

function Photo({ slot, round }: { slot: Slot; round: string }) {
  return (
    <div
      className={cn("relative h-full w-full overflow-hidden", round)}
      style={{
        background:
          "linear-gradient(160deg, color-mix(in srgb, var(--s-secondary) 14%, var(--s-bg)), color-mix(in srgb, var(--s-secondary) 30%, var(--s-bg)))",
      }}
    >
      {slot.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={slot.src}
          alt={slot.alt}
          loading="lazy"
          className="h-full w-full object-cover object-top"
        />
      ) : (
        <div
          className="grid h-full w-full place-items-center"
          style={{ color: "var(--s-secondary)" }}
        >
          <Shirt className="h-1/3 w-1/3 opacity-60" />
        </div>
      )}
    </div>
  );
}

function Bag({ look }: { look: Look }) {
  return (
    <span
      className={cn(
        "absolute -bottom-2 -right-2 z-10 grid h-9 w-9 place-items-center @[720px]:-bottom-3 @[720px]:-right-3 @[720px]:h-14 @[720px]:w-14",
        look === "bold" ? "rounded-none" : "rounded-full",
        look === "clean"
          ? "ring-2 ring-[color:var(--s-bg)] @[720px]:ring-[3px]"
          : "ring-[3px] ring-white @[720px]:ring-4",
      )}
      style={{
        background:
          look === "clean" ? "var(--s-primary)" : "var(--s-secondary)",
        color:
          look === "clean"
            ? "var(--s-on-primary, #fff)"
            : "var(--s-on-secondary, #fff)",
      }}
    >
      <ShoppingBag className="h-4 w-4 @[720px]:h-6 @[720px]:w-6" />
    </span>
  );
}

/** Tilted, white-framed cards with a ring behind (pookie, soft). */
function Tilted({ slots, look }: { slots: Slot[]; look: Look }) {
  const left = slots.length >= 3 ? slots[1] : null;
  const right = slots.length >= 2 ? slots[slots.length >= 3 ? 2 : 1] : null;
  const frame =
    "absolute aspect-[3/4] rounded-[14px] bg-white p-[4px] shadow-[0_18px_30px_-16px_rgba(60,10,30,.45)] transition-transform duration-500 group-hover:-translate-y-1 @[720px]:rounded-[24px] @[720px]:p-[6px]";
  const round = "rounded-[10px] @[720px]:rounded-[19px]";
  return (
    <div
      className="relative z-10 mx-auto h-[190px] w-full max-w-[520px] @[720px]:h-[340px]"
      style={{ color: "var(--s-secondary)" }}
    >
      <div
        className="absolute left-[2%] right-[2%] top-[22%] h-[56%] -rotate-[8deg] rounded-[50%] border-[1.5px] opacity-70"
        style={{ borderColor: "currentColor" }}
        aria-hidden="true"
      />
      {left && (
        <div
          className={cn(frame, "bottom-[4%] left-[1%] w-[33%] -rotate-[7deg]")}
        >
          <Photo slot={left} round={round} />
        </div>
      )}
      {right && (
        <div
          className={cn(frame, "bottom-[8%] right-[1%] w-[33%] rotate-[7deg]")}
        >
          <Photo slot={right} round={round} />
        </div>
      )}
      <div
        className={cn(
          frame,
          "bottom-0 left-1/2 z-10 w-[42%] -translate-x-1/2 group-hover:-translate-y-2",
        )}
      >
        <Photo slot={slots[0]} round={round} />
        <Bag look={look} />
      </div>
      <Sparks className="absolute -top-1 left-[64%] z-20 h-5 w-6 @[720px]:h-9 @[720px]:w-10" />
    </div>
  );
}

/** Straight row of photos (clean, bold). */
function Row({ slots, look }: { slots: Slot[]; look: Look }) {
  const bold = look === "bold";
  const shown = slots.slice(0, 3);
  // Put the first look in the middle when there are three.
  const ordered = shown.length === 3 ? [shown[1], shown[0], shown[2]] : shown;
  const centreIndex = shown.length === 3 ? 1 : 0;
  return (
    <div className="relative z-10 mx-auto flex h-[170px] w-full max-w-[520px] items-end justify-center gap-2 @[720px]:h-[320px] @[720px]:gap-3">
      {ordered.map((slot, i) => {
        const centre = i === centreIndex;
        return (
          <div
            key={i}
            className={cn(
              "relative aspect-[3/4] min-w-0 flex-1 transition-transform duration-500",
              centre
                ? "group-hover:-translate-y-2"
                : "max-w-[30%] group-hover:-translate-y-1",
              bold ? "rounded-none" : "rounded-xl",
            )}
            style={{
              flexGrow: centre ? 1.25 : 1,
              background: "var(--s-bg)",
              padding: bold ? 0 : 4,
              border: bold
                ? "3px solid var(--s-text)"
                : "1px solid var(--s-border)",
              boxShadow: bold
                ? "6px 6px 0 var(--s-secondary)"
                : "0 14px 24px -18px rgba(0,0,0,.35)",
            }}
          >
            <Photo slot={slot} round={bold ? "" : "rounded-lg"} />
            {centre && <Bag look={look} />}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

export function StoreLooksBanner({
  ctx,
  section,
}: {
  ctx: Ctx;
  section: HomeSection;
}) {
  const { d, interactive } = ctx;
  const store = d.storeSlug;
  const look: Look =
    section.looksStyle && section.looksStyle !== "auto"
      ? section.looksStyle
      : looksTheme(d.template);

  const { data } = useQuery({
    queryKey: publicLooksKey.list(store, "", 3),
    queryFn: () => publicLooks.list({ store, limit: 3 }),
    staleTime: 60_000,
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !!store,
  });

  const looks = data ?? [];
  // Shoppers see it only with real looks. The editor preview shows samples.
  const demo = !interactive;
  if (looks.length === 0 && !demo) return null;

  const slots: Slot[] =
    looks.length > 0
      ? looks.map((l) => ({ src: l.modelImageUrl, alt: l.title }))
      : [{ alt: "" }, { alt: "" }, { alt: "" }];

  const title = section.title.trim() || "Try the Look";
  const subtitle = section.subtitle ?? DEFAULT_SUBTITLE;
  const words = title.split(/\s+/);
  const last = words.length > 1 ? words.pop()! : "";
  const lead = words.join(" ");

  const pookie = look === "pookie";
  const soft = look === "soft" || pookie;
  const clean = look === "clean";
  const bold = look === "bold";

  const layout: Layout =
    section.looksLayout && section.looksLayout !== "auto"
      ? section.looksLayout
      : soft
        ? "tilted"
        : "row";
  const imageLeft = section.looksImageSide === "left";

  // Seller colors override the theme variables for this banner only.
  const bgC = validHex(section.looksBgColor);
  const accentC = validHex(section.looksAccentColor);
  const textC = validHex(section.looksTextColor);
  const vars: Record<string, string> = {};
  if (bgC) {
    vars["--s-bg"] = bgC;
    vars["--s-surface"] = bgC;
    vars["--s-text"] = textC || readableOn(bgC);
  } else if (textC) {
    vars["--s-text"] = textC;
  }
  if (accentC) {
    vars["--s-primary"] = accentC;
    vars["--s-secondary"] = accentC;
    vars["--s-on-primary"] = readableOn(accentC);
    vars["--s-on-secondary"] = readableOn(accentC);
  }
  // Bold paints the whole banner with the main color, so the background
  // option replaces it there.
  const boldBg = bgC || "var(--s-primary)";
  const boldInk = bgC ? textC || readableOn(bgC) : "var(--s-on-primary, #fff)";

  const box: CSSProperties = bold
    ? {
        background: boldBg,
        color: boldInk,
        borderRadius: 0,
      }
    : clean
      ? {
          background: "var(--s-surface)",
          border: "1px solid var(--s-border)",
          borderRadius: 16,
        }
      : {
          background:
            "linear-gradient(120deg, color-mix(in srgb, var(--s-secondary) 7%, var(--s-bg)), color-mix(in srgb, var(--s-secondary) 24%, var(--s-bg)))",
          border:
            "1px solid color-mix(in srgb, var(--s-secondary) 22%, transparent)",
          borderRadius: 24,
        };

  const ink = bold
    ? boldInk
    : textC
      ? textC
      : bgC
        ? "var(--s-text)"
        : soft
          ? "color-mix(in srgb, var(--s-primary) 78%, #000)"
          : "var(--s-text)";
  const body = bold
    ? `color-mix(in srgb, ${boldInk} 82%, transparent)`
    : "color-mix(in srgb, var(--s-text) 72%, transparent)";

  const content: ReactNode = (
    <>
      {soft && <Waves />}
      {pookie && <Hearts />}
      {pookie && (
        <div
          className="pointer-events-none absolute inset-1.5 rounded-[20px] border-2 border-dashed @[720px]:inset-2 @[720px]:rounded-[26px]"
          style={{
            borderColor:
              "color-mix(in srgb, var(--s-primary) 45%, transparent)",
          }}
          aria-hidden="true"
        />
      )}

      <div className="relative z-10 min-w-0">
        {/* Label */}
        <span
          className={cn(
            "inline-flex max-w-full items-center gap-1.5 text-[11px] font-semibold @[720px]:gap-2 @[720px]:text-sm",
            soft && "rounded-full px-3 py-1.5 @[720px]:px-4 @[720px]:py-2",
            clean && "uppercase tracking-[.18em]",
            bold &&
              "bg-[var(--s-secondary)] px-3 py-1.5 uppercase tracking-[.14em]",
          )}
          style={{
            background: soft
              ? "color-mix(in srgb, var(--s-secondary) 16%, var(--s-bg))"
              : undefined,
            color: bold
              ? "var(--s-on-secondary, #111)"
              : clean
                ? "var(--s-primary)"
                : ink,
          }}
        >
          <Hanger className="h-4 w-4 shrink-0 @[720px]:h-5 @[720px]:w-5" />
          <span className="truncate">Outfit Inspiration</span>
        </span>

        {/* Title */}
        <h2
          className={cn(
            "relative mt-3 inline-block max-w-full font-extrabold leading-[1.1] tracking-tight @[720px]:mt-4 @[720px]:leading-[1.05]",
            bold
              ? "text-[1.6rem] font-black uppercase @[720px]:text-6xl"
              : "text-[1.75rem] @[720px]:text-6xl",
          )}
          style={{ color: ink }}
        >
          {lead}
          {lead && last && " "}
          {last &&
            (soft ? (
              <span className="relative inline-block">
                {last}
                <Scribble />
              </span>
            ) : (
              <span
                className="relative inline-block"
                style={{
                  boxShadow: bold
                    ? "inset 0 -.22em 0 var(--s-secondary)"
                    : "inset 0 -.14em 0 color-mix(in srgb, var(--s-primary) 30%, transparent)",
                }}
              >
                {last}
              </span>
            ))}
          {soft && (
            <Sparks className="absolute -right-6 -top-4 h-6 w-7 @[720px]:-right-11 @[720px]:-top-6 @[720px]:h-10 @[720px]:w-12" />
          )}
        </h2>

        {subtitle && (
          <p
            className="mt-3 max-w-md text-[13px] leading-relaxed @[720px]:mt-5 @[720px]:text-xl"
            style={{ color: body }}
          >
            {subtitle}
          </p>
        )}

        {/* Button */}
        <span
          className={cn(
            "mt-4 inline-flex h-10 items-center gap-2 px-5 text-sm font-semibold transition-[gap,transform] duration-300 group-hover:gap-3 group-active:scale-[.98] @[720px]:mt-7 @[720px]:h-14 @[720px]:gap-3 @[720px]:px-9 @[720px]:text-lg @[720px]:group-hover:gap-4",
            bold
              ? "rounded-none uppercase tracking-wide"
              : clean
                ? "rounded-xl"
                : "rounded-full",
            !clean && "shadow-[0_14px_24px_-12px_rgba(0,0,0,.45)]",
          )}
          style={
            bold
              ? {
                  background: "var(--s-secondary)",
                  color: "var(--s-on-secondary, #111)",
                }
              : {
                  background: "var(--s-primary)",
                  color: "var(--s-on-primary, #fff)",
                }
          }
        >
          Try the Look
          <ArrowRight className="h-4 w-4 @[720px]:h-5 @[720px]:w-5" />
        </span>
      </div>

      <div className={cn("min-w-0", imageLeft && "@[720px]:order-first")}>
        {layout === "tilted" ? (
          <Tilted slots={slots} look={look} />
        ) : (
          <Row slots={slots} look={look} />
        )}
      </div>
    </>
  );

  const cls = cn(
    "group relative isolate grid items-center gap-5 overflow-hidden px-4 py-5 @[720px]:gap-6 @[720px]:px-12 @[720px]:py-12",
    imageLeft
      ? "@[720px]:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]"
      : "@[720px]:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]",
  );

  return (
    <div className="@container w-full min-w-0" style={vars as CSSProperties}>
      <Block ctx={ctx} sf="looks">
        {demo ? (
          <div className={cls} style={box}>
            {content}
          </div>
        ) : (
          <Link
            href={`/store/${store}/try-the-look`}
            aria-label="Try the Look"
            className={cls}
            style={box}
          >
            {content}
          </Link>
        )}
      </Block>
    </div>
  );
}
