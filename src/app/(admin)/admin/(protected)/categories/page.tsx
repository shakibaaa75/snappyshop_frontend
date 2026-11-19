"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/http";
import {
  adminCategories,
  type AdminCat,
  type AdminMain,
} from "@/lib/api/adminCategories";
import { cn } from "@/lib/utils";

type Action = {
  kind: "rename" | "merge" | "move" | "delete";
  cat: AdminCat;
  main: AdminMain;
};

const sel = "h-10 w-full rounded-md border bg-background px-3 text-sm";

function ActionDialog({
  action,
  mains,
  onClose,
}: {
  action: Action;
  mains: AdminMain[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { kind, cat, main } = action;
  const others = main.categories.filter((c) => c.id !== cat.id);
  const otherMains = mains.filter((m) => m.id !== main.id);
  const [text, setText] = useState(cat.name);
  const [target, setTarget] = useState("");
  const needsTarget =
    kind === "merge" ||
    kind === "move" ||
    (kind === "delete" && cat.products > 0);

  const run = useMutation({
    mutationFn: () => {
      if (kind === "rename") return adminCategories.rename(cat.id, text.trim());
      if (kind === "merge") return adminCategories.merge(cat.id, target);
      if (kind === "move") return adminCategories.move(cat.id, target);
      return adminCategories.remove(cat.id, target || undefined);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      qc.invalidateQueries({ queryKey: ["category-tree"] });
      window.dispatchEvent(new Event("admin-categories-changed"));
      onClose();
    },
  });

  const title = {
    rename: "Rename",
    merge: "Merge",
    move: "Move to another main type",
    delete: "Delete",
  }[kind];
  const ready =
    kind === "rename" ? text.trim().length > 1 : needsTarget ? !!target : true;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md space-y-4 rounded-lg border bg-background p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold">
          {title}: {cat.name}
        </h2>
        {kind === "rename" && (
          <>
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={60}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Products follow the new name. The old spelling keeps matching, so
              it never creates a duplicate.
            </p>
          </>
        )}
        {kind === "merge" && (
          <>
            <select
              className={sel}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            >
              <option value="">Merge into…</option>
              {others.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              {cat.products} product(s) move to the chosen category. “{cat.name}
              ” is removed and kept as an alias.
            </p>
          </>
        )}
        {kind === "move" && (
          <select
            className={sel}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          >
            <option value="">Move to main type…</option>
            {otherMains.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        )}
        {kind === "delete" &&
          (cat.products > 0 ? (
            <>
              <p className="text-sm">
                This category has {cat.products} product(s). Choose where they
                go:
              </p>
              <select
                className={sel}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              >
                <option value="">Move products to…</option>
                {others.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <p className="text-sm">
              No products use this category. It will be deleted.
            </p>
          ))}
        {run.isError && (
          <p className="text-sm text-red-600">
            {run.error instanceof ApiError || run.error instanceof Error
              ? run.error.message
              : "Something went wrong."}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={kind === "delete" ? "destructive" : "default"}
            disabled={!ready || run.isPending}
            onClick={() => run.mutate()}
          >
            {run.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {title.split(" ")[0]}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"all" | "new">("all");
  const [action, setAction] = useState<Action | null>(null);

  const all = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: adminCategories.list,
  });
  const fresh = useQuery({
    queryKey: ["admin", "categories", "new"],
    queryFn: adminCategories.listNew,
    refetchInterval: 60_000,
  });
  const seen = useMutation({
    mutationFn: (ids: string[]) => adminCategories.markSeen(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      window.dispatchEvent(new Event("admin-categories-changed"));
    },
  });

  const mains = all.data ?? [];
  const open = (kind: Action["kind"], mainId: string, catId: string) => {
    const main = mains.find((m) => m.id === mainId);
    const cat = main?.categories.find((c) => c.id === catId);
    if (main && cat) setAction({ kind, cat, main });
  };
  const newCount = fresh.data?.length ?? 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Category management</h1>
        <p className="text-sm text-muted-foreground">
          Main types are fixed. Categories are created by sellers and appear
          live; fix or tidy them here.
        </p>
      </div>

      <div className="flex gap-2">
        {(["all", "new"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium",
              tab === t
                ? "border-blue-600 bg-blue-600 text-white"
                : "hover:border-blue-400",
            )}
          >
            {t === "all"
              ? "All categories"
              : `New${newCount ? ` (${newCount})` : ""}`}
          </button>
        ))}
      </div>

      {(all.isPending || fresh.isPending) && (
        <Loader2 className="h-5 w-5 animate-spin" />
      )}
      {all.isError && (
        <p className="text-sm text-red-600">Could not load categories.</p>
      )}

      {tab === "all" &&
        mains.map((m) => (
          <section key={m.id} className="rounded-lg border">
            <header className="flex items-center justify-between border-b bg-muted/40 px-4 py-2.5">
              <h2 className="text-sm font-semibold">{m.name}</h2>
              <span className="text-xs text-muted-foreground">
                {m.categories.length} categories · {m.products} products
              </span>
            </header>
            {m.categories.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">
                No categories yet.
              </p>
            ) : (
              <ul className="divide-y">
                {m.categories.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-wrap items-center gap-2 px-4 py-2 text-sm"
                  >
                    <span className="font-medium">{c.name}</span>
                    {c.isNew && (
                      <span className="rounded bg-red-100 px-1.5 text-[10px] font-semibold uppercase text-red-700">
                        new
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {c.products} products
                    </span>
                    <span className="ml-auto flex gap-1">
                      {(["rename", "merge", "move", "delete"] as const).map(
                        (k) => (
                          <Button
                            key={k}
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs capitalize"
                            onClick={() => open(k, m.id, c.id)}
                          >
                            {k}
                          </Button>
                        ),
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

      {tab === "new" && (
        <div className="space-y-3">
          {newCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              disabled={seen.isPending}
              onClick={() => seen.mutate([])}
            >
              Mark all as seen
            </Button>
          )}
          {fresh.data?.length === 0 && (
            <p className="text-sm text-muted-foreground">No new categories.</p>
          )}
          {fresh.data?.map((n) => (
            <div key={n.id} className="space-y-2 rounded-lg border p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{n.name}</span>
                <span className="text-xs text-muted-foreground">
                  in {n.mainName}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {n.createdAt && new Date(n.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {[
                  n.store && `Store: ${n.store}`,
                  n.seller && `By: ${n.seller}`,
                  n.source && `From: ${n.source}`,
                  n.typed && `Typed: “${n.typed}”`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {n.similar.length > 0 && (
                <p className="text-xs">
                  Similar:{" "}
                  {n.similar.map((s) => (
                    <span
                      key={s.id}
                      className="mr-1 rounded bg-amber-100 px-1.5 py-0.5 text-amber-800"
                    >
                      {s.name}
                    </span>
                  ))}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => seen.mutate([n.id])}
                >
                  Mark seen
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => open("rename", n.mainId, n.id)}
                >
                  Rename
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => open("merge", n.mainId, n.id)}
                >
                  Merge
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {action && (
        <ActionDialog
          action={action}
          mains={mains}
          onClose={() => setAction(null)}
        />
      )}
    </div>
  );
}
