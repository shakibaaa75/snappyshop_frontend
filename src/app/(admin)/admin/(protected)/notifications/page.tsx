"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, Send, Trash2, X } from "lucide-react";
import { adminApi, type AdminUser } from "@/lib/api/admin";
import {
  adminNotifications,
  type NotificationAudience,
  type NotificationLevel,
} from "@/lib/api/notifications";
import { ApiError } from "@/lib/api/http";
import { qk } from "@/lib/query/keys";
import {
  LEVEL_LABEL,
  LEVEL_STYLE,
} from "@/components/notifications/notification-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const LEVELS: NotificationLevel[] = ["info", "success", "warning", "urgent"];
const PAGE = 15;

type Picked = { id: string; label: string };

const sellerLabel = (s: AdminUser) => s.storeName || s.name || s.email;

/** <input type="datetime-local"> value (local time) -> ISO string. */
const toISO = (local: string) =>
  local ? new Date(local).toISOString() : undefined;

function SellerPicker({
  picked,
  onChange,
  error,
}: {
  picked: Picked[];
  onChange: (next: Picked[]) => void;
  error?: string;
}) {
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setQ(input.trim()), 300);
    return () => clearTimeout(t);
  }, [input]);

  const { data, isFetching } = useQuery({
    queryKey: ["admin", "notification-seller-search", q],
    queryFn: () => adminApi.listSellers({ q: q || undefined, limit: 8 }),
    staleTime: 30_000,
  });

  const ids = new Set(picked.map((p) => p.id));
  const results = (data?.sellers ?? []).filter((s) => !ids.has(s.id));

  return (
    <div className="space-y-2">
      {picked.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {picked.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1 rounded-full bg-blue-50 py-1 pl-3 pr-1.5 text-xs font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-200"
            >
              {p.label}
              <button
                type="button"
                aria-label={`Remove ${p.label}`}
                onClick={() => onChange(picked.filter((x) => x.id !== p.id))}
                className="rounded-full p-0.5 hover:bg-blue-100 dark:hover:bg-blue-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          className="pl-9"
          placeholder="Search sellers by shop name or email…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>
      <div className="max-h-48 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        {isFetching && results.length === 0 ? (
          <div className="flex justify-center p-3">
            <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
          </div>
        ) : results.length === 0 ? (
          <p className="p-3 text-center text-xs text-zinc-500">
            No sellers found
          </p>
        ) : (
          results.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() =>
                onChange([...picked, { id: s.id, label: sellerLabel(s) }])
              }
              className="block w-full px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              <span className="font-medium">{sellerLabel(s)}</span>
              <span className="ml-2 text-xs text-zinc-500">{s.email}</span>
            </button>
          ))
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-zinc-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function AdminNotificationsPage() {
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [level, setLevel] = useState<NotificationLevel>("info");
  const [audience, setAudience] = useState<NotificationAudience>("all");
  const [picked, setPicked] = useState<Picked[]>([]);
  const [linkUrl, setLinkUrl] = useState("");
  const [expires, setExpires] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [skip, setSkip] = useState(0);

  const history = useQuery({
    queryKey: [...qk.admin.notifications, skip],
    queryFn: () => adminNotifications.list({ limit: PAGE, skip }),
  });

  const send = useMutation({
    mutationFn: () =>
      adminNotifications.send({
        title,
        body,
        level,
        audience,
        sellerIds:
          audience === "selected" ? picked.map((p) => p.id) : undefined,
        linkUrl: linkUrl.trim() || undefined,
        expiresAt: toISO(expires),
      }),
    onMutate: () => {
      setFieldErrors({});
      setFormError(null);
      setOkMsg(null);
    },
    onSuccess: () => {
      setOkMsg(
        audience === "all"
          ? "Sent to all sellers."
          : `Sent to ${picked.length} seller${picked.length === 1 ? "" : "s"}.`,
      );
      setTitle("");
      setBody("");
      setLevel("info");
      setPicked([]);
      setLinkUrl("");
      setExpires("");
      setSkip(0);
      qc.invalidateQueries({ queryKey: qk.admin.notifications });
    },
    onError: (e) => {
      if (e instanceof ApiError) {
        setFieldErrors(e.fields);
        setFormError(Object.keys(e.fields).length ? null : e.message);
      } else {
        setFormError("Could not send the notification.");
      }
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminNotifications.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.admin.notifications }),
  });

  const rows = history.data?.notifications ?? [];
  const total = history.data?.total ?? 0;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Send a message to sellers. They see it on the home page and in their
          seller area until they read it.
        </p>
      </div>

      {/* ---------------- compose ---------------- */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send.mutate();
        }}
        className="space-y-5 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <Field label="Title" error={fieldErrors.title}>
          <Input
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Scheduled maintenance on Friday"
          />
        </Field>

        <Field label="Message" error={fieldErrors.body}>
          <Textarea
            value={body}
            maxLength={2000}
            rows={4}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What do sellers need to know?"
          />
        </Field>

        <Field label="Style" error={fieldErrors.level}>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLevel(l)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
                  level === l
                    ? cn(
                        LEVEL_STYLE[l].chip,
                        "border-transparent ring-2 ring-zinc-900/20",
                      )
                    : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800",
                )}
              >
                {LEVEL_LABEL[l]}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Send to" error={fieldErrors.audience}>
          <div className="flex flex-wrap gap-4 text-sm">
            {(
              [
                ["all", "All sellers"],
                ["selected", "Selected sellers"],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="audience"
                  checked={audience === value}
                  onChange={() => setAudience(value)}
                />
                {label}
              </label>
            ))}
          </div>
        </Field>

        {audience === "selected" && (
          <SellerPicker
            picked={picked}
            onChange={setPicked}
            error={fieldErrors.sellerIds}
          />
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Link (optional)"
            hint="A path on this site (like /seller/dashboard) or a full https:// address."
            error={fieldErrors.linkUrl}
          >
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://… or /some/page"
            />
          </Field>
          <Field
            label="Hide after (optional)"
            hint="Leave empty to keep it until you delete it."
            error={fieldErrors.expiresAt}
          >
            <Input
              type="datetime-local"
              value={expires}
              onChange={(e) => setExpires(e.target.value)}
            />
          </Field>
        </div>

        {formError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {formError}
          </div>
        )}
        {okMsg && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {okMsg}
          </div>
        )}

        <Button type="submit" disabled={send.isPending}>
          {send.isPending ? <Loader2 className="animate-spin" /> : <Send />}
          Send notification
        </Button>
      </form>

      {/* ---------------- history ---------------- */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">
          Sent{" "}
          <span className="text-sm font-normal text-zinc-500">({total})</span>
        </h2>

        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50 text-xs uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Notification</th>
                  <th className="px-4 py-3 font-medium">Sent to</th>
                  <th className="px-4 py-3 font-medium">Read</th>
                  <th className="px-4 py-3 font-medium">Sent</th>
                  <th className="px-4 py-3 font-medium" aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {history.isLoading && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-zinc-500"
                    >
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    </td>
                  </tr>
                )}
                {history.isError && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-red-600"
                    >
                      Could not load notifications.
                    </td>
                  </tr>
                )}
                {!history.isLoading &&
                  !history.isError &&
                  rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-12 text-center text-zinc-500"
                      >
                        Nothing sent yet
                      </td>
                    </tr>
                  )}
                {rows.map((n) => {
                  const expired =
                    !!n.expiresAt && new Date(n.expiresAt) <= new Date();
                  return (
                    <tr
                      key={n.id}
                      className="align-top hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
                    >
                      <td className="max-w-md px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{n.title}</span>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                              LEVEL_STYLE[n.level]?.chip,
                            )}
                          >
                            {LEVEL_LABEL[n.level]}
                          </span>
                          {expired && (
                            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                              Expired
                            </span>
                          )}
                        </div>
                        <p className="mt-1 line-clamp-2 whitespace-pre-line text-xs text-zinc-500">
                          {n.body}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {n.audience === "all"
                          ? "All sellers"
                          : `${n.recipientCount} selected`}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {n.readCount} / {n.recipientCount}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {new Date(n.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          title="Delete (removes it for every seller)"
                          aria-label="Delete notification"
                          disabled={remove.isPending}
                          onClick={() => {
                            if (
                              window.confirm(
                                "Delete this notification? Sellers will no longer see it.",
                              )
                            ) {
                              remove.mutate(n.id);
                            }
                          }}
                          className="rounded-md p-2 text-zinc-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {total > PAGE && (
            <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
              <span className="text-xs text-zinc-500">
                Showing {skip + 1}–{Math.min(skip + PAGE, total)} of {total}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={skip === 0}
                  onClick={() => setSkip(Math.max(0, skip - PAGE))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={skip + PAGE >= total}
                  onClick={() => setSkip(skip + PAGE)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
