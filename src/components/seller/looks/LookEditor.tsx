"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Loader2,
  Plus,
  Repeat,
  Trash2,
} from "lucide-react";
import { ApiError } from "@/lib/api/http";
import {
  looksKey,
  sellerLooks,
  type Look,
  type LookInput,
  type LookItemStatus,
} from "@/lib/api/looks";
import { LookDetailsForm } from "./LookDetailsForm";
import { AddProductDialog, type DialogMode } from "./AddProductDialog";
import { cn } from "@/lib/utils";

const errText = (e: unknown, fallback: string) =>
  e instanceof ApiError ? e.message : fallback;

const STATUS_NOTE: Partial<Record<LookItemStatus, string>> = {
  out_of_stock: "Out of stock (buyers see it marked)",
  unpublished: "Unpublished, hidden from buyers",
  removed: "Product deleted, hidden from buyers",
};

export default function LookEditor() {
  const params = useParams<Record<string, string | undefined>>();
  // The id comes only from the [lookId] route param. Never fall back to the
  // URL path: on /try-the-look that would send "try-the-look" as an id.
  const lookId = params.lookId ?? params.id ?? "";
  const valid = !!lookId && lookId !== "undefined";
  const { data, isLoading, isError } = useQuery({
    queryKey: looksKey.detail(lookId),
    queryFn: () => sellerLooks.get(lookId),
    enabled: valid,
    retry: false,
    refetchOnMount: "always",
  });

  if (!valid)
    return (
      <p className="py-10 text-center text-sm text-red-600">Look not found.</p>
    );

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  if (isError || !data)
    return (
      <p className="py-10 text-center text-sm text-red-600">
        Couldn&apos;t load this look. It may have been deleted.
      </p>
    );
  // key = look id: item changes must not reset the details form.
  return <Inner key={data.id} look={data} />;
}

function Inner({ look }: { look: Look }) {
  const { slug } = useParams<{ slug: string }>();
  const qc = useQueryClient();
  const [details, setDetails] = useState<LookInput>({
    title: look.title,
    gender: look.gender ?? "",
    modelImageUrl: look.modelImageUrl,
  });
  const [dialog, setDialog] = useState<DialogMode | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const apply = (l: Look) => {
    qc.setQueryData(looksKey.detail(l.id), l);
    void qc.invalidateQueries({ queryKey: looksKey.list() });
  };
  const run = <V,>(fn: (v: V) => Promise<Look>, ok?: string) => ({
    mutationFn: fn,
    onMutate: () => setNotice(null),
    onSuccess: (l: Look) => {
      apply(l);
      if (ok) setNotice(ok);
    },
  });

  const save = useMutation(
    run(() => sellerLooks.update(look.id, details), "Details saved."),
  );
  const publish = useMutation(
    run(() => sellerLooks.publish(look.id), "Look published."),
  );
  const unpublish = useMutation(
    run(() => sellerLooks.unpublish(look.id), "Look is now a draft."),
  );
  const remove = useMutation(
    run((pid: string) => sellerLooks.removeItem(look.id, pid)),
  );
  const reorder = useMutation(
    run((ids: string[]) => sellerLooks.reorder(look.id, ids)),
  );

  const busy = [save, publish, unpublish, remove, reorder].some(
    (m) => m.isPending,
  );
  const error = [save, publish, unpublish, remove, reorder]
    .map((m) => m.error)
    .find(Boolean);
  const fieldErrors = error instanceof ApiError ? error.fields : {};

  const move = (index: number, dir: -1 | 1) => {
    const ids = look.items.map((i) => i.productId);
    const j = index + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    reorder.mutate(ids);
  };

  const dirty =
    details.title !== look.title ||
    details.gender !== (look.gender ?? "") ||
    details.modelImageUrl !== look.modelImageUrl;
  const published = look.status === "published";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/seller/${slug}/try-the-look`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All looks
        </Link>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              published
                ? "bg-emerald-100 text-emerald-800"
                : "bg-muted text-muted-foreground",
            )}
          >
            {published ? "Published" : "Draft"}
          </span>
          {published ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => unpublish.mutate(undefined)}
              className="rounded-full border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60"
            >
              Unpublish
            </button>
          ) : (
            <button
              type="button"
              disabled={busy || dirty}
              onClick={() => publish.mutate(undefined)}
              title={dirty ? "Save your details first" : undefined}
              className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background disabled:opacity-50"
            >
              Publish
            </button>
          )}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
        >
          {error instanceof ApiError && Object.keys(fieldErrors).length
            ? Object.values(fieldErrors).join(" · ")
            : errText(error, "Something went wrong. Please try again.")}
        </div>
      )}
      {notice && !error && (
        <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
          {notice}
        </div>
      )}
      {look.needsAttention > 0 && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {look.needsAttention} product
          {look.needsAttention === 1 ? " is" : "s are"} deleted or unpublished.
          Buyers don&apos;t see {look.needsAttention === 1 ? "it" : "them"}.
          Replace or remove {look.needsAttention === 1 ? "it" : "them"} below.
        </div>
      )}

      <section className="space-y-4 rounded-2xl border p-5">
        <h2 className="text-sm font-semibold">Look details</h2>
        <LookDetailsForm
          value={details}
          onChange={setDetails}
          errors={fieldErrors}
        />
        <div className="flex justify-end">
          <button
            type="button"
            disabled={!dirty || busy}
            onClick={() => save.mutate(undefined)}
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background disabled:opacity-50"
          >
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save details
          </button>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Products in this look</h2>
            <p className="text-xs text-muted-foreground">
              {look.items.length} of {look.maxItems}. Price, photo and stock
              update automatically from each product.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDialog({ kind: "add" })}
            disabled={look.items.length >= look.maxItems}
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Add product
          </button>
        </div>

        {look.items.length === 0 && (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No products yet. Add the items the model is wearing.
          </p>
        )}

        <ol className="space-y-2">
          {look.items.map((it, i) => {
            const note = STATUS_NOTE[it.status];
            const hidden =
              it.status === "removed" || it.status === "unpublished";
            return (
              <li
                key={it.productId}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-2.5",
                  hidden && "border-amber-300 bg-amber-50/60",
                )}
              >
                <span className="w-5 text-center text-xs text-muted-foreground">
                  {i + 1}
                </span>
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {it.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={it.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {it.name || "Deleted product"}
                  </p>
                  {it.status !== "removed" && (
                    <p className="text-xs text-muted-foreground">৳{it.price}</p>
                  )}
                  {note && (
                    <p
                      className={cn(
                        "text-xs",
                        hidden ? "text-amber-700" : "text-muted-foreground",
                      )}
                    >
                      {note}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center">
                  <IconBtn
                    label="Move up"
                    disabled={busy || i === 0}
                    onClick={() => move(i, -1)}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </IconBtn>
                  <IconBtn
                    label="Move down"
                    disabled={busy || i === look.items.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </IconBtn>
                  <IconBtn
                    label="Replace"
                    disabled={busy}
                    onClick={() =>
                      setDialog({ kind: "replace", productId: it.productId })
                    }
                  >
                    <Repeat className="h-4 w-4" />
                  </IconBtn>
                  <IconBtn
                    label="Remove from look"
                    disabled={busy}
                    onClick={() => remove.mutate(it.productId)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </IconBtn>
                </div>
              </li>
            );
          })}
        </ol>
        <p className="text-xs text-muted-foreground">
          Removing a product here only takes it out of the look. The product
          stays in your store.
        </p>
      </section>

      {dialog && (
        <AddProductDialog
          look={look}
          mode={dialog}
          onClose={() => setDialog(null)}
          onDone={() => setDialog(null)}
        />
      )}
    </div>
  );
}

function IconBtn({
  label,
  children,
  ...rest
}: { label: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="rounded-full p-2 hover:bg-muted disabled:opacity-30"
      {...rest}
    >
      {children}
    </button>
  );
}
