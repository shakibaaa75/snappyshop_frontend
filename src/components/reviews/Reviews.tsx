"use client";
import { SellerActions } from "./SellerReviewControls";
import Link from "next/link";
import { SocialButtons } from "@/components/features/auth/Authcontrols";
import * as Dialog from "@radix-ui/react-dialog";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/lib/api/http";
import { authApi } from "@/lib/api/auth";
import { qk } from "@/lib/query/keys";
import type { StoreDesign } from "@/lib/store-design/types";

type Review = {
  slug?: string;
  id: string;
  product: string;
  order: string;
  name: string; // product name (as sent by the API)
  buyerName?: string; // name of the buyer who wrote the review
  sellerName?: string; // shop name of the seller who wrote the reply
  sellerLogo?: string; // seller profile picture (empty = show the shop icon)
  variant?: string;
  variantId?: string;
  title: string;
  body: string;
  photos: string[];
  rating: number;
  reply?: string;
  created: string;
  status: string;
  featured?: boolean;
  homepageFeatured?: boolean;
  hiddenInShop?: boolean;
  reported?: boolean;
  revision: number;
  moderation?: string;
  verification?: Record<string, unknown>;
  audit?: { at: string; action: string; detail?: string; actor: string }[];
};
type Page = {
  rows: Review[];
  count: number;
  average: number;
  distribution: number[];
};
type Purchase = {
  order: string;
  number: string;
  variant?: string;
  variantId?: string;
  status: string;
  paid: boolean;
  received?: boolean;
  blocked?: string;
  method: string;
};
const field =
  "min-w-0 max-w-full rounded-xl border border-input bg-background px-3 py-2 text-foreground";
const button =
  "min-h-10 rounded-full border border-input bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50";
const states = [
  "Pending Verification",
  "Pending Moderation",
  "Published",
  "Rejected",
  "Unpublished",
];
/**
 * Public (shopper) lists are served from the cache for a minute and are not
 * polled, so traffic to a popular store does not become API load. Signed-in
 * lists stay fresh, and only dashboards (`poll`) refresh on a timer.
 * Saving or replying still refreshes everything through invalidateQueries.
 */
function useList(path: string, user = "public", enabled = true, poll = false) {
  const isPublic = user === "public";
  return useQuery({
    queryKey: ["reviews", user, path],
    queryFn: ({ signal }) => apiFetch<Page>(path, { signal }),
    enabled,
    staleTime: isPublic ? 60_000 : 0,
    refetchOnMount: isPublic ? true : "always",
    refetchOnWindowFocus: isPublic ? false : "always",
    refetchInterval: poll ? 30000 : false,
  });
}
function useUser() {
  return useQuery({ queryKey: qk.auth.me, queryFn: authApi.me, retry: false });
}
function RatingFilter({
  value,
  change,
}: {
  value: string;
  change: (s: string) => void;
}) {
  return (
    <select
      className={field}
      aria-label="Filter by rating"
      value={value}
      onChange={(e) => change(e.target.value)}
    >
      <option value="">All ratings</option>
      {[5, 4, 3, 2, 1].map((n) => (
        <option key={n} value={n}>
          {n} stars
        </option>
      ))}
    </select>
  );
}
function Card({ r }: { r: Review }) {
  return (
    <article className="min-w-0 border-b py-4 space-y-2">
      <p className="text-sm">
        <strong>{r.rating} / 5 ★</strong> ·{" "}
        {r.status === "Published" ? "Verified purchase" : r.status} ·{" "}
        {new Date(r.created).toLocaleDateString()}
      </p>
      <h3 className="font-semibold">{r.title}</h3>
      {r.variant && <small>{r.variant}</small>}
      <p className="whitespace-pre-line break-words">{r.body}</p>
      {!!r.photos?.length && (
        <div className="flex flex-wrap gap-2">
          {r.photos.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`Customer photo ${i + 1}`}
              width={108}
              height={108}
              loading="lazy"
              className="rounded-md object-cover"
            />
          ))}
        </div>
      )}
      {r.reply && (
        <p className="mt-3 whitespace-pre-wrap break-words rounded-r-xl border-l-2 border-[#0c68f6] bg-muted px-4 py-3 text-sm">
          <strong>Seller reply</strong>
          <br />
          {r.reply}
        </p>
      )}
    </article>
  );
}
/* ------------------------------------------------------------------ */
/* Themed review UI (storefront, marketplace and featured reviews)     */
/* Colours come from the seller template (--s-* variables set by       */
/* themeVars) and fall back to the global shadcn tokens elsewhere.     */
/* ------------------------------------------------------------------ */
const T = {
  primary: "var(--s-primary, hsl(var(--primary)))",
  onPrimary: "var(--s-on-primary, hsl(var(--primary-foreground)))",
  bg: "var(--s-bg, hsl(var(--background)))",
  border: "var(--s-border, hsl(var(--border)))",
  muted: "var(--s-muted, hsl(var(--muted-foreground)))",
  soft: "var(--s-soft, hsl(var(--primary) / 0.1))",
  star: "var(--s-text, hsl(var(--foreground)))",
  radius: "var(--sf-radius-lg, 20px)",
  pill: "var(--pp-btn, 9999px)",
  shadow: "0 1px 2px rgba(0,0,0,.04), 0 8px 22px -12px rgba(0,0,0,.18)",
};
function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-0.5"
      role="img"
      aria-label={`${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          aria-hidden="true"
          style={{ color: T.star, opacity: i <= Math.round(value) ? 1 : 0.18 }}
        >
          <path
            fill="currentColor"
            d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7.1L12 17.6 5.7 21.3l1.7-7.1L2 9.5l7.1-.6L12 2z"
          />
        </svg>
      ))}
    </span>
  );
}
function ReviewCard({ r }: { r: Review }) {
  const buyer = (r.buyerName ?? "").trim() || "Customer";
  const [open, setOpen] = useState(false);
  const long = r.body.length > 120;
  const text = !open && long ? r.body.slice(0, 120).trimEnd() + "… " : r.body;
  return (
    <article
      className="flex min-w-0 flex-col gap-3 p-5"
      style={{
        background: T.bg,
        border: `1px solid ${T.border}`,
        borderRadius: T.radius,
        boxShadow: T.shadow,
      }}
    >
      <header className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-full text-base font-semibold"
          style={{ background: T.primary, color: T.onPrimary }}
        >
          {buyer.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{buyer}</p>
          <p className="text-xs" style={{ color: T.muted }}>
            {new Date(r.created).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <Stars value={r.rating} />
      </header>
      {r.variant && <small style={{ color: T.muted }}>{r.variant}</small>}
      <p className="whitespace-pre-line break-words leading-relaxed">
        {text}
        {long && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="font-semibold hover:underline"
            style={{ color: T.primary }}
          >
            {open ? "See less" : "See more"}
          </button>
        )}
      </p>
      {!!r.photos?.length && (
        <div className="flex flex-wrap gap-2">
          {r.photos.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`Customer photo ${i + 1}`}
              width={80}
              height={80}
              loading="lazy"
              className="size-20 rounded-lg object-cover"
              style={{ border: `1px solid ${T.border}` }}
            />
          ))}
        </div>
      )}
      {r.reply && (
        <div
          className="mt-auto flex items-start gap-3 rounded-2xl p-3"
          style={{ background: T.soft }}
        >
          {r.sellerLogo ? (
            <img
              src={r.sellerLogo}
              alt=""
              width={36}
              height={36}
              loading="lazy"
              className="size-9 shrink-0 rounded-full object-cover"
              style={{ border: `1px solid ${T.border}` }}
            />
          ) : (
            <span
              aria-hidden="true"
              className="grid size-9 shrink-0 place-items-center rounded-full"
              style={{ background: T.bg, border: `1px solid ${T.border}` }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke={T.primary}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 9l1.5-5h15L21 9M3 9v1a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0V9M3 9h18M5 13v7h14v-7M10 20v-4h4v4" />
              </svg>
            </span>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              {(r.sellerName ?? "").trim() || "Seller"}
            </p>
            <p
              className="whitespace-pre-wrap break-words text-sm"
              style={{ color: T.muted }}
            >
              {r.reply}
            </p>
          </div>
        </div>
      )}
    </article>
  );
}
function Paging({
  page,
  size,
  change,
}: {
  page: number;
  size: number;
  change: (p: number) => void;
}) {
  return page || size === 10 ? (
    <div className="flex gap-3 items-center">
      <button
        className={button}
        disabled={!page}
        onClick={() => change(page - 1)}
      >
        Previous
      </button>
      Page {page + 1}
      <button
        className={button}
        disabled={size < 10}
        onClick={() => change(page + 1)}
      >
        Next
      </button>
    </div>
  ) : null;
}
export function ReviewScore({ product }: { product: string }) {
  const q = useList("/reviews?product=" + encodeURIComponent(product));
  return (
    <span>
      {q.data
        ? q.data.count
          ? `${q.data.average.toFixed(1)} ★ · ${q.data.count} reviews`
          : "No reviews yet"
        : "Customer reviews"}
    </span>
  );
}
function readPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(Error("Could not read photo."));
    reader.readAsDataURL(file);
  });
}
function Form({
  p,
  product,
  existing,
  close,
  saved,
}: {
  p: Purchase;
  product: string;
  existing?: Review;
  close: () => void;
  saved: (status: string) => void;
}) {
  const cache = useQueryClient();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      const files = data
        .getAll("photos")
        .filter((f): f is File => f instanceof File && f.size > 0);
      if (files.length > 3 || files.some((f) => f.size > 1024 * 1024))
        throw Error("Choose up to three photos, each under 1 MB.");
      const photos = files.length
        ? await Promise.all(files.map(readPhoto))
        : data.has("remove")
          ? []
          : (existing?.photos ?? []);
      await apiFetch("/buyer/reviews", {
        method: "PUT",
        body: {
          order: p.order,
          product,
          variant: p.variantId ?? "",
          rating: Number(data.get("rating")),
          title: data.get("title"),
          body: data.get("body"),
          photos,
          revision: existing?.revision ?? 0,
        },
      });
      await cache.invalidateQueries({ queryKey: ["reviews"] });
      const current = await apiFetch<Page>(
        "/buyer/reviews?" + new URLSearchParams({ product, order: p.order }),
      ).catch(() => null);
      saved(current?.rows?.[0]?.status ?? "Saved");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={save} className="grid min-w-0 gap-4">
      <label>
        Star rating{" "}
        <select
          name="rating"
          className={field}
          defaultValue={existing?.rating ?? ""}
          required
        >
          <option value="" disabled>
            Choose
          </option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
      </label>
      <input
        className={field}
        name="title"
        required
        maxLength={160}
        defaultValue={existing?.title}
        placeholder="Review title"
        aria-label="Review title"
      />
      <textarea
        className={field}
        rows={4}
        required
        maxLength={4000}
        name="body"
        defaultValue={existing?.body}
        placeholder="How was the product?"
        aria-label="Review text"
      />
      <label className="grid min-w-0 gap-2 rounded-xl border border-dashed border-[#0c68f6] bg-muted p-4">
        <span className="text-sm font-semibold">Add product photos</span>
        <input
          className="block w-full min-w-0 cursor-pointer text-sm file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-[#0c68f6] file:px-4 file:py-2 file:font-semibold file:text-white"
          type="file"
          multiple
          name="photos"
          accept="image/jpeg,image/png"
        />
        <span className="text-xs text-muted-foreground">
          Up to 3 JPEG or PNG photos, 1 MB each.
        </span>
      </label>
      {!!existing?.photos.length && (
        <label>
          <input type="checkbox" name="remove" /> Remove existing photos
        </label>
      )}
      {error && <p role="alert">{error}</p>}
      <div className="flex gap-2">
        <button
          className="min-h-11 rounded-full bg-[#0c68f6] px-5 font-semibold text-white disabled:opacity-60"
          disabled={busy}
        >
          {busy ? "Submitting…" : existing ? "Save changes" : "Submit review"}
        </button>
        <button type="button" onClick={close}>
          Cancel
        </button>
      </div>
    </form>
  );
}
function ReviewNotice({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4 text-center">
      <div
        className="mx-auto grid size-14 place-items-center rounded-2xl text-2xl"
        style={{ background: T.soft, color: T.primary }}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className="space-y-2">
        <h3
          className="text-base font-semibold"
          style={{ color: "var(--s-text, #111827)" }}
        >
          {title}
        </h3>
        <div className="text-sm leading-6" style={{ color: T.muted }}>
          {children}
        </div>
      </div>
    </div>
  );
}
function Composer({
  product,
  close,
  saved,
}: {
  product: string;
  close: () => void;
  saved: (status: string) => void;
}) {
  const user = useQuery({
    queryKey: ["review-dialog-session"],
    queryFn: authApi.me,
    retry: false,
    gcTime: 0,
    refetchOnMount: "always",
  });
  const buyer = user.data?.role === "BUYER" && !user.isFetching && !user.error;
  const cache = useQueryClient();
  const param = encodeURIComponent(product);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState(0);
  const purchases = useQuery({
    queryKey: ["reviews", user.data?.id, "purchases", product],
    enabled: buyer,
    queryFn: () =>
      apiFetch<Purchase[]>("/buyer/review-purchases?product=" + param),
  });
  const p = purchases.data?.[selected];
  const exact = useList(
    "/buyer/reviews?product=" +
      param +
      "&order=" +
      encodeURIComponent(p?.order ?? ""),
    user.data?.id,
    buyer && !!p,
  );
  if (user.isFetching) return <p role="status">Checking your account…</p>;
  if (user.error instanceof ApiError && user.error.status === 401) {
    const next = window.location.pathname + window.location.search;
    return (
      <div className="space-y-4">
        <ReviewNotice icon="🔒" title="Sign in to write a review">
          You need a buyer account to review a product you purchased.
        </ReviewNotice>
        <SocialButtons next={next} />
        <Link
          className="flex min-h-12 items-center justify-center rounded-xl border px-4 text-sm font-semibold"
          style={{ borderColor: T.border, color: T.primary }}
          href="/register"
        >
          Create an account with email
        </Link>
        <Link
          className="block text-center text-sm font-semibold underline"
          style={{ color: T.primary }}
          href={"/login?next=" + encodeURIComponent(next)}
        >
          Log in with email
        </Link>
      </div>
    );
  }
  if (user.error)
    return (
      <button className={button} onClick={() => user.refetch()}>
        Retry account check
      </button>
    );
  if (!buyer)
    return (
      <ReviewNotice icon="👤" title="Buyer account required">
        Sign in with the buyer account used to purchase this product.
      </ReviewNotice>
    );
  if (purchases.error || exact.error)
    return (
      <button
        className={button}
        onClick={() =>
          purchases.error ? purchases.refetch() : exact.refetch()
        }
      >
        Retry loading your purchase
      </button>
    );
  if (!purchases.data || (p && !exact.data))
    return <p role="status">Opening your review…</p>;
  if (!p)
    return (
      <ReviewNotice icon="🛍️" title="Purchase required">
        Only customers who purchased this product can leave a review. After your
        order is delivered, come back to share your experience.
      </ReviewNotice>
    );
  const existing = exact.data?.rows?.find((r) => r.order === p.order);
  return (
    <div className="space-y-3">
      {purchases.data.length > 1 && (
        <label>
          Your purchase{" "}
          <select
            className={field}
            value={selected}
            onChange={(e) => {
              setSelected(Number(e.target.value));
              setMessage("");
            }}
          >
            {purchases.data.map((o, i) => (
              <option key={i} value={i}>
                {o.number} {o.variant}
              </option>
            ))}
          </select>
        </label>
      )}
      {existing && <p>Your review · {existing.status}</p>}
      {p.status === "delivered" && p.paid && !p.received && !p.blocked && (
        <button
          className={button}
          onClick={async () => {
            try {
              await apiFetch("/buyer/review-receipt", {
                method: "POST",
                body: { order: p.order },
              });
              await cache.invalidateQueries({ queryKey: ["reviews"] });
            } catch (err) {
              setMessage((err as Error).message);
            }
          }}
        >
          Confirm I received and paid for this order
        </button>
      )}
      {message && <p role="alert">{message}</p>}
      {p.status !== "delivered" ? (
        <p role="status" className="rounded-lg border bg-muted p-4 text-sm">
          You can write a review only after this order has been delivered.
          Current order status: {p.status}.
        </p>
      ) : (
        <Form
          key={p.order + "/" + (p.variantId ?? "")}
          p={p}
          product={product}
          existing={existing}
          close={close}
          saved={saved}
        />
      )}
    </div>
  );
}

export function AddReviewButton({
  product,
  variant = "outline",
}: {
  product: string;
  variant?: "outline" | "solid";
}) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState("");
  return (
    <div className="space-y-1">
      <Dialog.Root open={open} onOpenChange={setOpen}>
        {variant === "solid" ? (
          <Dialog.Trigger
            className="inline-flex min-h-9 items-center gap-1.5 px-4 text-sm font-semibold transition hover:opacity-90 sm:min-h-11 sm:gap-2 sm:px-6"
            style={{
              background: T.primary,
              color: T.onPrimary,
              borderRadius: T.pill,
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            Add review
          </Dialog.Trigger>
        ) : (
          <Dialog.Trigger className="inline-flex min-h-10 items-center rounded-full border border-current px-4 text-sm font-semibold hover:underline">
            Add review
          </Dialog.Trigger>
        )}
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/55 backdrop-blur-[3px]" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed inset-x-0 bottom-0 z-[101] max-h-[92dvh] overflow-y-auto overscroll-contain rounded-t-2xl border bg-white px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-gray-950 shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[min(32rem,92vw)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:p-6"
            style={{ borderColor: T.border }}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <Dialog.Title className="text-lg font-semibold">
                Add review
              </Dialog.Title>
              <Dialog.Close
                aria-label="Close review dialog"
                className="grid size-10 place-items-center rounded-full text-xl transition hover:opacity-75"
                style={{ background: T.soft, color: T.primary }}
              >
                ×
              </Dialog.Close>
            </div>
            {open && (
              <Composer
                product={product}
                close={() => setOpen(false)}
                saved={(status) => {
                  setOpen(false);
                  setSubmitted(status);
                }}
              />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      {submitted && (
        <p role="status" className="text-sm">
          {submitted === "Published"
            ? "Your review is published."
            : submitted === "Pending Verification"
              ? "Review saved. Waiting for delivery and payment verification."
              : submitted === "Pending Moderation"
                ? "Review saved. Waiting for content approval."
                : "Review saved."}
        </p>
      )}
    </div>
  );
}

const sampleReviews: Review[] = [
  {
    buyerName: "Maya",
    rating: 5,
    body: "The item matched the photos and arrived carefully packed.",
    reply: "Thank you for sharing your experience!",
  },
  {
    buyerName: "Arif",
    rating: 4,
    body: "The size guide helped me choose the right one.",
  },
  {
    buyerName: "Nadia",
    rating: 5,
    body: "Exactly what I was looking for. The finish looks great in person.",
  },
].map((row, i) => ({
  ...row,
  id: String(i),
  product: "",
  order: "",
  name: "",
  title: "",
  photos: [],
  created: "2026-01-15",
  status: "Published",
  revision: 0,
}));

export function ProductReviews({
  product,
  layout = "carousel",
  heading,
  preview = false,
}: {
  product: string;
  layout?: StoreDesign["productReviewLayout"];
  heading?: string;
  preview?: boolean;
}) {
  const [page, setPage] = useState(0);
  const [all, setAll] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ page: 0, pages: 1, start: true, end: true });
  const q = useList(
    "/reviews?product=" +
      encodeURIComponent(product) +
      (page ? "&page=" + page : ""),
    "public",
    !!product,
  );
  const showSamples =
    preview && (!product || q.isError || (q.isSuccess && !q.data?.count));
  const rows = showSamples ? sampleReviews : (q.data?.rows ?? []);
  const count = rows.length;
  const total = showSamples ? sampleReviews.length : (q.data?.count ?? 0);
  const average = showSamples
    ? sampleReviews.reduce((sum, r) => sum + r.rating, 0) / total
    : (q.data?.average ?? 0);
  const carousel = layout === "carousel" && !all;
  const measure = useCallback(() => {
    const el = track.current;
    if (!el || !el.clientWidth) return;
    setPos({
      page: Math.round(el.scrollLeft / el.clientWidth),
      pages: Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth - 0.05)),
      start: el.scrollLeft <= 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  }, []);
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    // The editor preview changes width without a window resize (device
    // toggle, panel resize), so observe the track itself as well.
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(measure)
        : null;
    ro?.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      ro?.disconnect();
    };
  }, [measure, count, carousel]);
  const go = (d: 1 | -1) =>
    track.current?.scrollBy({
      left: d * track.current.clientWidth,
      behavior: "smooth",
    });
  const arrow = (dir: "left" | "right") => (
    <button
      type="button"
      onClick={() => go(dir === "left" ? -1 : 1)}
      disabled={dir === "left" ? pos.start : pos.end}
      aria-label={dir === "left" ? "Previous reviews" : "Next reviews"}
      className="absolute top-1/2 z-10 hidden size-10 -translate-y-1/2 place-items-center rounded-full shadow-md transition disabled:opacity-30 @lg:grid"
      style={{
        [dir]: "-0.75rem",
        background: T.bg,
        color: T.primary,
        border: `1px solid ${T.border}`,
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
      </svg>
    </button>
  );
  return (
    <section
      id={preview ? undefined : "customer-reviews"}
      className="@container mx-auto w-full max-w-5xl space-y-5 p-5"
    >
      {showSamples && (
        <p className="text-xs font-semibold" style={{ color: T.muted }}>
          Preview with sample reviews
        </p>
      )}
      <div
        className="flex items-start justify-between gap-3 pb-3 @lg:pb-4"
        style={{ borderBottom: `1px solid ${T.border}` }}
      >
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold tracking-tight [overflow-wrap:anywhere] @lg:text-2xl">
            {heading?.trim() || "Customer reviews"}
          </h2>
          {!!total && (
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 @lg:mt-2 @lg:gap-3">
              <span className="text-2xl font-bold leading-none @lg:text-4xl">
                {average.toFixed(1)}
              </span>
              <span className="inline-flex [&_svg]:size-4 @lg:[&_svg]:size-[22px]">
                <Stars value={average} size={22} />
              </span>
              <span
                className="text-xs @lg:text-base"
                style={{ color: T.muted }}
              >
                ({total} {total === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}
        </div>
        <div className="shrink-0">
          {preview ? (
            <button type="button" disabled className={button}>
              Write a review
            </button>
          ) : (
            <AddReviewButton product={product} variant="solid" />
          )}
        </div>
      </div>
      {q.isLoading && <p role="status">Loading reviews…</p>}
      {q.isSuccess && !rows.length && (
        <p className="text-sm" style={{ color: T.muted }}>
          No published reviews yet.
        </p>
      )}
      {count > 0 &&
        (!carousel ? (
          <div
            className={
              layout === "testimonial"
                ? "mx-auto grid max-w-xl gap-5 text-center"
                : "grid gap-5 @lg:grid-cols-2 @3xl:grid-cols-3"
            }
          >
            {rows.map((r) => (
              <ReviewCard key={r.id} r={r} />
            ))}
          </div>
        ) : (
          <div className="relative">
            {arrow("left")}
            <div
              ref={track}
              className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>article]:w-[85%] [&>article]:shrink-0 [&>article]:snap-start @lg:[&>article]:w-[calc((100%-1.25rem)/2)] @3xl:[&>article]:w-[calc((100%-2.5rem)/3)]"
            >
              {rows.map((r) => (
                <ReviewCard key={r.id} r={r} />
              ))}
            </div>
            {arrow("right")}
          </div>
        ))}
      {layout === "carousel" && count > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-3 @lg:flex-nowrap @lg:justify-between">
          <span className="hidden w-40 @lg:block" />
          {!all && pos.pages > 1 ? (
            <div
              className="flex max-w-full flex-wrap items-center justify-center gap-2"
              aria-label="Review pages"
            >
              {Array.from({ length: pos.pages }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to reviews ${i + 1}`}
                  onClick={() =>
                    track.current?.scrollTo({
                      left: i * track.current.clientWidth,
                      behavior: "smooth",
                    })
                  }
                  className="size-2.5 rounded-full transition"
                  style={{
                    background: i === pos.page ? T.primary : T.border,
                  }}
                />
              ))}
            </div>
          ) : (
            <span />
          )}
          {(all || pos.pages > 1) && (
            <button
              type="button"
              onClick={() => setAll((v) => !v)}
              className="inline-flex min-h-10 items-center gap-2 border-[1.5px] px-5 text-sm font-semibold transition hover:opacity-80"
              style={{ borderColor: "currentColor", borderRadius: T.pill }}
            >
              {all ? "Show as carousel" : "View all reviews"}
              {!all && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              )}
            </button>
          )}
        </div>
      )}
      {product && q.error && (
        <button className="text-sm underline" onClick={() => q.refetch()}>
          Retry loading reviews
        </button>
      )}
      {!showSamples && <Paging page={page} size={count} change={setPage} />}
    </section>
  );
}
export function MarketplaceReviews() {
  const [page, setPage] = useState(0);
  const feed = useQuery({
    queryKey: ["reviews", "public", "marketplace", page],
    queryFn: ({ signal }) =>
      apiFetch<{ rows: Review[]; more: boolean }>(
        "/reviews?feed=marketplace&page=" + page,
        { signal },
      ),
    staleTime: 60_000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
  return (
    <section aria-label="Verified customer reviews" className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">
        Verified customer reviews
      </h2>
      {feed.isLoading && <p role="status">Loading reviews…</p>}
      {feed.error && (
        <button className={button} onClick={() => feed.refetch()}>
          Retry loading reviews
        </button>
      )}
      {feed.data && !feed.data.rows.length && (
        <p className="text-sm text-muted-foreground">
          No published reviews on this page.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {feed.data?.rows.map((r) => (
          <ReviewCard key={r.id} r={r} />
        ))}
      </div>
      {(page > 0 || feed.data?.more) && (
        <div className="flex items-center gap-3">
          <button
            className={button}
            disabled={!page}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span>Page {page + 1}</span>
          <button
            className={button}
            disabled={!feed.data?.more}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
export function FeaturedReviews({ design }: { design: StoreDesign }) {
  const [page, setPage] = useState(0);
  const hasSelection =
    !design.reviewPickedOnly || !!design.reviewPickedIds?.length;
  const q = useList(
    "/reviews?" +
      new URLSearchParams({
        selection: design.reviewPickedOnly ? "picked" : "legacy",
        store: design.storeSlug,
        page: String(page),
        ids: (
          (design.reviewPickedOnly
            ? design.reviewPickedIds
            : design.reviewIds) ?? []
        )
          .slice(0, 10)
          .join(","),
      }),
    "public",
    hasSelection && !!design.storeSlug,
  );
  if (!hasSelection || (!page && !q.data?.rows?.length)) return null;
  return (
    <section
      className="@container"
      style={{
        padding: design.reviewPadding ?? 20,
        backgroundColor: design.reviewColor ?? "transparent",
      }}
    >
      <h2 className="mb-4 text-xl font-semibold">
        {design.reviewHeading || "Customer reviews"}
      </h2>
      <div
        className={
          design.reviewLayout === "carousel"
            ? "flex overflow-x-auto gap-4 snap-x pb-2 [&>article]:w-[min(85%,22rem)] [&>article]:shrink-0 [&>article]:snap-start"
            : design.reviewLayout === "testimonial"
              ? "mx-auto grid max-w-2xl gap-4 [&>article]:text-center"
              : "grid gap-4 @lg:grid-cols-2 @3xl:grid-cols-3"
        }
      >
        {q.data?.rows?.map((r) => (
          <ReviewCard key={r.id} r={r} />
        ))}
      </div>
      {(page > 0 || (q.data?.count ?? 0) > 10) && (
        <div className="mt-4 flex items-center gap-3">
          <button
            className={button}
            disabled={!page}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span>Page {page + 1}</span>
          <button
            className={button}
            disabled={(page + 1) * 10 >= (q.data?.count ?? 0)}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
function publicationMessage(r: Review) {
  if (r.status === "Published")
    return "Published on the product page and marketplace homepage.";
  const order = r.verification;
  if (!order) return r.status;
  if (order.block) return "This order has a recorded refund or return.";
  if (
    r.status === "Rejected" ||
    (r.status === "Unpublished" && r.moderation === "removed")
  )
    return "This review was removed by moderation.";
  if (order.delivery === "cancelled") return "The order was cancelled.";
  const missing: string[] = [];
  if (order.delivery !== "delivered") missing.push("delivery");
  if (order.paid !== true) missing.push("full payment");
  if (order.received !== true)
    missing.push(
      order.method === "cod"
        ? "buyer receipt confirmation or verified courier COD settlement"
        : "buyer receipt confirmation",
    );
  if (order.method !== "cod" && order.gateway !== true)
    missing.push("gateway payment verification");
  if (missing.length) return "Waiting for " + missing.join(", ") + ".";
  if (r.status === "Pending Moderation")
    return "Purchase verified. Waiting for content approval.";
  return "Check the order’s buyer, seller and product against this review.";
}

export function ReviewDashboard({
  scope,
}: {
  scope: "buyer" | "seller" | "admin";
}) {
  const user = useUser();
  const [status, setStatus] = useState("");
  const [product, setProduct] = useState("");
  const [rating, setRating] = useState("");
  const [page, setPage] = useState(0);
  const [error, setError] = useState("");
  const q = useList(
    "/" +
      scope +
      "/reviews?" +
      new URLSearchParams({ status, product, rating, page: String(page) }),
    user.data?.id,
    !!user.data,
    true,
  );
  const cache = useQueryClient();
  const [notice, setNotice] = useState("");
  async function action(e: FormEvent<HTMLFormElement>, r: Review) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setError("");
    setNotice("");
    try {
      await apiFetch("/" + scope + "/reviews/" + r.id, {
        method: "POST",
        body: {
          action: data.get("action"),
          text: data.get("text"),
          revision: r.revision,
        },
      });
      await cache.invalidateQueries({ queryKey: ["reviews"] });
      if (scope === "admin" && data.get("action") === "approve") {
        const updated = cache
          .getQueryData<Page>([
            "reviews",
            user.data?.id,
            "/" +
              scope +
              "/reviews?" +
              new URLSearchParams({
                status,
                product,
                rating,
                page: String(page),
              }),
          ])
          ?.rows?.find((row) => row.id === r.id);
        setNotice(
          updated
            ? "Content approved. " + publicationMessage(updated)
            : "Content approved. Select All statuses to see the current publication status.",
        );
        return;
      }
      setNotice(
        data.get("action") === "reply"
          ? r.status === "Published"
            ? "Reply saved on the public review."
            : "Reply saved. It will appear with the published review."
          : "Review updated.",
      );
    } catch (err) {
      setError((err as Error).message);
    }
  }
  return (
    <div
      className={
        scope === "seller"
          ? "min-h-[90dvh] w-full space-y-5 bg-white py-4 text-slate-950"
          : "mx-auto max-w-4xl space-y-5 p-5"
      }
    >
      <h1 className="text-2xl font-semibold">
        {scope === "buyer" ? "My reviews" : "Product reviews"}
      </h1>
      {scope === "seller" && (
        <p className="text-sm text-muted-foreground">
          Read customer feedback, reply to buyers, or report a review.
        </p>
      )}
      {scope === "admin" && (
        <details>
          <summary>Record order verification</summary>
          <form
            className="grid max-w-md gap-2 py-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const d = new FormData(form);
              try {
                await apiFetch("/admin/review-order-evidence", {
                  method: "POST",
                  body: Object.fromEntries(d),
                });
                await cache.invalidateQueries({ queryKey: ["reviews"] });
                form.reset();
                setError("Order evidence recorded.");
              } catch (err) {
                setError((err as Error).message);
              }
            }}
          >
            <input
              required
              name="order"
              className={field}
              aria-label="Order ID"
              placeholder="Order ID"
            />
            <select className={field} name="action" aria-label="Evidence type">
              <option value="cod-settlement">
                Verified courier delivery and full COD settlement
              </option>
              <option value="refund">Completed refund</option>
              <option value="return">Completed return</option>
            </select>
            <input
              required
              className={field}
              maxLength={500}
              name="reference"
              placeholder="Evidence reference"
              aria-label="Evidence reference"
            />
            <button className={button}>Record verified event</button>
          </form>
        </details>
      )}
      <>
        <div className="flex flex-wrap gap-3">
          <select
            className={field}
            aria-label="Review status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
          >
            <option value="">All statuses</option>
            {[...states, ...(scope === "admin" ? ["Reported"] : [])].map(
              (s) => (
                <option key={s}>{s}</option>
              ),
            )}
          </select>
          <RatingFilter
            value={rating}
            change={(s) => {
              setRating(s);
              setPage(0);
            }}
          />
          <input
            className={field}
            placeholder="Filter by product ID"
            aria-label="Product ID"
            value={product}
            onChange={(e) => {
              setProduct(e.target.value);
              setPage(0);
            }}
          />
        </div>
        {notice && (
          <p role="status" className="rounded-xl bg-muted p-3 text-sm">
            {notice}
          </p>
        )}
        {(error || q.error) && <p role="alert">{error || q.error?.message}</p>}
        {q.data?.rows?.length === 0 && <p>No matching reviews.</p>}
        <div
          className={
            scope === "seller"
              ? "grid items-start gap-4 xl:grid-cols-2"
              : "space-y-5"
          }
        >
          {q.data?.rows?.map((r) => (
            <section
              key={r.id}
              className="min-w-0 rounded-2xl border border-border bg-card p-4 text-card-foreground sm:p-5"
            >
              <h2 className="font-bold">{r.name}</h2>
              {scope !== "seller" && (
                <small className="break-all text-muted-foreground">
                  Product {r.product} · Order {r.order}
                </small>
              )}
              {scope === "seller" && (
                <p className="mt-3 text-sm font-medium">
                  {r.buyerName || "Customer"}
                </p>
              )}
              <Card r={r} />
              {scope === "admin" && (
                <p className="my-3 rounded-xl bg-muted p-3 text-sm">
                  <strong>{r.status}</strong> · {publicationMessage(r)}
                </p>
              )}
              {scope === "buyer" ? (
                <div className="flex gap-3">
                  <Link href={`/account/orders/${r.order}`}>View order</Link>
                  {r.slug && (
                    <Link
                      href={`/store/${encodeURIComponent(r.slug)}/products/${encodeURIComponent(r.product)}#customer-reviews`}
                    >
                      Open product to edit
                    </Link>
                  )}
                </div>
              ) : scope === "seller" ? (
                <SellerActions review={r} />
              ) : (
                <form
                  className="mt-4 grid min-w-0 gap-2 rounded-xl bg-muted p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto]"
                  onSubmit={(e) => action(e, r)}
                >
                  <select
                    className={field}
                    aria-label="Review action"
                    name="action"
                  >
                    {[
                      "approve",
                      "reject",
                      "remove",
                      "verify-payment",
                      "refund",
                      "return",
                    ].map((a) => (
                      <option key={a} value={a}>
                        {a.replace("-", " ")}
                      </option>
                    ))}
                  </select>
                  <input
                    className={field}
                    name="text"
                    placeholder="Reply, reason or verification reference"
                    aria-label="Action details"
                    maxLength={1000}
                  />
                  <button className="min-h-11 rounded-full bg-[#0c68f6] px-5 font-semibold text-white">
                    Apply
                  </button>
                </form>
              )}
              {scope === "admin" && (
                <details className="mt-3">
                  <summary>Order verification and activity</summary>
                  <pre className="whitespace-pre-wrap break-words text-xs">
                    {JSON.stringify(
                      { verification: r.verification, activity: r.audit },
                      null,
                      2,
                    )}
                  </pre>
                </details>
              )}
            </section>
          ))}
        </div>
        <Paging page={page} change={setPage} size={q.data?.rows?.length ?? 0} />
      </>
    </div>
  );
}
