"use client";
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
function useList(path: string, user = "public", enabled = true) {
  return useQuery({
    queryKey: ["reviews", user, path],
    queryFn: ({ signal }) => apiFetch<Page>(path, { signal }),
    enabled,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchInterval: 30000,
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
        <p className="text-sm">Sign in to review this product.</p>
        <SocialButtons next={next} />
        <Link
          className="flex min-h-12 items-center justify-center rounded-full border px-4 text-sm font-semibold"
          href="/register"
        >
          Create an account with email
        </Link>
        <Link
          className="block text-center text-sm underline"
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
    return <p>Sign in with the buyer account used for this purchase.</p>;
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
      <p>You can review this product after ordering it with your account.</p>
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
      <Form
        key={p.order + "/" + (p.variantId ?? "")}
        p={p}
        product={product}
        existing={existing}
        close={close}
        saved={saved}
      />
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
            className="inline-flex min-h-11 items-center gap-2 px-6 text-sm font-semibold transition hover:opacity-90"
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
          <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/45" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed inset-x-0 bottom-0 z-[101] max-h-[92dvh] overflow-y-auto overscroll-contain rounded-t-3xl border border-border bg-background px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-foreground shadow-xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[min(32rem,92vw)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <Dialog.Title className="text-lg font-semibold">
                Add review
              </Dialog.Title>
              <Dialog.Close
                aria-label="Close review dialog"
                className="grid size-11 place-items-center rounded-full bg-muted text-2xl"
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

export function ProductReviews({ product }: { product: string }) {
  const [page, setPage] = useState(0);
  const [all, setAll] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ page: 0, pages: 1, start: true, end: true });
  const q = useList(
    "/reviews?product=" +
      encodeURIComponent(product) +
      (page ? "&page=" + page : ""),
  );
  const count = q.data?.rows?.length ?? 0;
  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
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
    return () => {
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure, count, all]);
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
      className="absolute top-1/2 z-10 hidden size-10 -translate-y-1/2 place-items-center rounded-full shadow-md transition disabled:opacity-30 sm:grid"
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
      id="customer-reviews"
      className="mx-auto w-full max-w-5xl space-y-5 p-5"
    >
      <div
        className="flex flex-wrap items-start justify-between gap-4 pb-4"
        style={{ borderBottom: `1px solid ${T.border}` }}
      >
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Customer reviews
          </h2>
          {!!q.data?.count && (
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="text-4xl font-bold">
                {q.data.average.toFixed(1)}
              </span>
              <Stars value={q.data.average} size={22} />
              <span style={{ color: T.muted }}>({q.data.count} reviews)</span>
            </div>
          )}
        </div>
        <AddReviewButton product={product} variant="solid" />
      </div>
      {q.isSuccess && !q.data.rows?.length && (
        <p className="text-sm" style={{ color: T.muted }}>
          No published reviews yet.
        </p>
      )}
      {count > 0 &&
        (all ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {q.data?.rows?.map((r) => (
              <ReviewCard key={r.id} r={r} />
            ))}
          </div>
        ) : (
          <div className="relative">
            {arrow("left")}
            <div
              ref={track}
              className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>article]:w-[85%] [&>article]:shrink-0 [&>article]:snap-start sm:[&>article]:w-[calc((100%-1.25rem)/2)] lg:[&>article]:w-[calc((100%-2.5rem)/3)]"
            >
              {q.data?.rows?.map((r) => (
                <ReviewCard key={r.id} r={r} />
              ))}
            </div>
            {arrow("right")}
          </div>
        ))}
      {count > 0 && (
        <div className="flex items-center justify-between gap-3">
          <span className="hidden w-40 sm:block" />
          {!all && pos.pages > 1 ? (
            <div className="flex items-center gap-2" aria-label="Review pages">
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
      {q.error && (
        <button className="text-sm underline" onClick={() => q.refetch()}>
          Retry loading reviews
        </button>
      )}
      <Paging page={page} size={q.data?.rows?.length ?? 0} change={setPage} />
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
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchInterval: 30000,
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
  const q = useList(
    "/reviews?" +
      new URLSearchParams({
        store: design.storeSlug,
        ids: (design.reviewIds ?? []).slice(0, 10).join(","),
      }),
    "public",
    !!design.reviewSection && !!design.storeSlug,
  );
  if (!design.reviewSection || !q.data?.rows?.length) return null;
  return (
    <section
      style={{
        padding: design.reviewPadding ?? 20,
        backgroundColor: design.reviewColor ?? "transparent",
      }}
    >
      <h2 className="text-xl font-semibold">
        {design.reviewHeading || "Customer reviews"}
      </h2>
      <div
        className={
          design.reviewLayout === "carousel"
            ? "flex overflow-x-auto gap-4 snap-x [&>article]:min-w-64 [&>article]:snap-start"
            : design.reviewLayout === "testimonial"
              ? "mx-auto max-w-xl italic"
              : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        }
      >
        {q.data.rows.map((r) => (
          <ReviewCard key={r.id} r={r} />
        ))}
      </div>
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
    <main className="mx-auto max-w-4xl p-5 space-y-5">
      <h1 className="text-2xl font-semibold">
        {scope === "buyer" ? "My reviews" : "Product reviews"}
      </h1>
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
          {[...states, ...(scope === "admin" ? ["Reported"] : [])].map((s) => (
            <option key={s}>{s}</option>
          ))}
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
      {q.data?.rows?.map((r) => (
        <section
          key={r.id}
          className="min-w-0 rounded-2xl border border-border bg-card p-4 text-card-foreground sm:p-5"
        >
          <h2 className="font-bold">{r.name}</h2>
          <small>
            Product {r.product} · Order {r.order}
          </small>
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
                {(scope === "seller"
                  ? [
                      "reply",
                      ...(r.featured ? [] : ["feature"]),
                      ...(r.hiddenInShop ? [] : ["unfeature"]),
                      "report",
                    ]
                  : [
                      "approve",
                      "reject",
                      "remove",
                      "verify-payment",
                      "refund",
                      "return",
                    ]
                ).map((a) => (
                  <option key={a} value={a}>
                    {a === "feature"
                      ? "Feature in my shop"
                      : a === "unfeature"
                        ? "Hide in my shop"
                        : a.replace("-", " ")}
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
      <Paging page={page} change={setPage} size={q.data?.rows?.length ?? 0} />
    </main>
  );
}

export function ReviewPicker({
  selected,
  change,
}: {
  selected: string[];
  change: (ids: string[]) => void;
}) {
  const user = useUser();
  const [page, setPage] = useState(0);
  const q = useList(
    "/seller/reviews?status=Published&page=" + page,
    user.data?.id,
    user.data?.role === "SELLER",
  );
  return (
    <fieldset className="space-y-2">
      <legend>Choose featured reviews (up to 10)</legend>
      <small>
        Leave empty to use reviews featured in the seller dashboard.
      </small>
      {q.data?.rows?.map((r) => (
        <label key={r.id} className="block">
          <input
            type="checkbox"
            checked={selected.includes(r.id)}
            disabled={selected.length >= 10 && !selected.includes(r.id)}
            onChange={(e) =>
              change(
                e.target.checked
                  ? [...selected, r.id]
                  : selected.filter((id) => id !== r.id),
              )
            }
          />{" "}
          {r.name} · {r.rating} ★ · {r.title}
        </label>
      ))}
      <Paging page={page} change={setPage} size={q.data?.rows?.length ?? 0} />
    </fieldset>
  );
}
