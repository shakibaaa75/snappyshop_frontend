"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2, Plus, Trash2 } from "lucide-react";
import { ApiError } from "@/lib/api/http";
import { looksKey, sellerLooks, type LookInput } from "@/lib/api/looks";
import { LookDetailsForm } from "./LookDetailsForm";

/** The seller's looks: list, create, delete. Shown once Try the Look is unlocked. */
export function LooksManager() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<LookInput>({
    title: "",
    gender: "",
    modelImageUrl: "",
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: looksKey.list(),
    queryFn: sellerLooks.list,
    retry: false,
  });

  const create = useMutation({
    mutationFn: () => sellerLooks.create(draft),
    onSuccess: (look) => {
      void qc.invalidateQueries({ queryKey: looksKey.all });
      router.push(`/seller/${slug}/try-the-look/${look.id}`);
    },
  });
  const del = useMutation({
    mutationFn: (id: string) => sellerLooks.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: looksKey.all }),
  });

  const fields = create.error instanceof ApiError ? create.error.fields : {};
  const createError =
    create.error &&
    (create.error instanceof ApiError
      ? Object.keys(fields).length
        ? null
        : create.error.message
      : "Could not create the look. Please try again.");

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Your looks</h2>
        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            <Plus className="h-4 w-4" /> New look
          </button>
        )}
      </div>

      {creating && (
        <div className="space-y-4 rounded-2xl border p-5">
          <LookDetailsForm value={draft} onChange={setDraft} errors={fields} />
          {createError && (
            <p role="alert" className="text-xs font-medium text-red-600">
              {createError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="rounded-full px-4 py-2 text-sm hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => create.mutate()}
              disabled={create.isPending}
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background disabled:opacity-60"
            >
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create and add products
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <p className="py-6 text-sm text-muted-foreground">Loading looks…</p>
      )}
      {isError && (
        <p className="text-sm text-red-600">Couldn&apos;t load your looks.</p>
      )}
      {data && data.length === 0 && !creating && (
        <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No looks yet. Create one, upload a model photo and add the products
          the model is wearing.
        </p>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((l) => (
          <li key={l.id} className="overflow-hidden rounded-2xl border">
            <Link href={`/seller/${slug}/try-the-look/${l.id}`} className="block">
              <div className="aspect-[4/3] bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={l.modelImageUrl}
                  alt=""
                  className="h-full w-full object-cover object-top"
                />
              </div>
            </Link>
            <div className="space-y-2 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold">{l.title}</p>
                <span
                  className={
                    l.status === "published"
                      ? "rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-800"
                      : "rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground"
                  }
                >
                  {l.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {l.itemCount} product{l.itemCount === 1 ? "" : "s"}
              </p>
              {l.needsAttention > 0 && (
                <p className="flex items-center gap-1 text-xs text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {l.needsAttention} item{l.needsAttention === 1 ? "" : "s"}{" "}
                  need attention
                </p>
              )}
              <div className="flex items-center justify-between pt-1">
                <Link
                  href={`/seller/${slug}/try-the-look/${l.id}`}
                  className="text-sm font-medium underline underline-offset-2"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Delete this look? Your products are not deleted.",
                      )
                    )
                      del.mutate(l.id);
                  }}
                  disabled={del.isPending}
                  className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
