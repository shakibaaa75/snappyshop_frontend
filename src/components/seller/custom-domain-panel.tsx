"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  Loader2,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/http";
import { qk } from "@/lib/query/keys";
import { UpgradeNotice } from "@/components/seller/plan-lock";
import {
  sellerCustomDomain,
  type CustomDomain,
  type CustomDomainRecord,
} from "@/lib/api/custom-domain";

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : fallback;
}

function formatWhen(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}, ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

/** Strips protocol, path and spaces so "https://Shop.Brand.com/" works too. */
function cleanDomain(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Copy ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard blocked: the value is still selectable */
        }
      }}
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-600" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

function RecordRow({ rec }: { rec: CustomDomainRecord }) {
  return (
    <li className="rounded-2xl border border-border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-primary px-2 py-0.5 font-mono text-[11px] font-semibold text-white">
          {rec.type}
        </span>
        <span className="text-xs text-muted-foreground">
          {rec.purpose === "ownership" ? "Ownership" : "Routing"}
        </span>
      </div>
      <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-[5rem_1fr]">
        <dt className="text-muted-foreground">Name</dt>
        <dd className="flex min-w-0 items-center gap-1">
          <code className="min-w-0 break-all font-mono text-[13px]">
            {rec.name}
          </code>
          <CopyButton value={rec.name} label="record name" />
        </dd>
        <dt className="text-muted-foreground">Value</dt>
        <dd className="flex min-w-0 items-center gap-1">
          <code className="min-w-0 break-all font-mono text-[13px]">
            {rec.value}
          </code>
          <CopyButton value={rec.value} label="record value" />
        </dd>
      </dl>
      {rec.note && (
        <p className="mt-2 text-xs text-muted-foreground">{rec.note}</p>
      )}
    </li>
  );
}

function StatusBadge({ data }: { data: CustomDomain }) {
  const verified = data.verified;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        verified ? "bg-emerald-50 text-primary" : "bg-amber-50 text-amber-700",
      )}
    >
      {verified ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <Clock className="h-3.5 w-3.5" />
      )}
      {verified ? "Connected" : "Waiting for DNS"}
    </span>
  );
}

export function CustomDomainPanel() {
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const query = useQuery({
    queryKey: qk.seller.customDomain,
    queryFn: sellerCustomDomain.get,
  });

  const store = (d: CustomDomain) =>
    queryClient.setQueryData(qk.seller.customDomain, d);

  const setMutation = useMutation({
    mutationFn: (domain: string) => sellerCustomDomain.set(domain),
    onSuccess: (d) => {
      store(d);
      setInput("");
      setNotice({
        type: "success",
        text: "Domain added. Add the DNS records below, then press Check DNS.",
      });
    },
    onError: (err) =>
      setNotice({
        type: "error",
        text: errorMessage(err, "Could not add the domain."),
      }),
  });

  const verifyMutation = useMutation({
    mutationFn: sellerCustomDomain.verify,
    onSuccess: (d) => {
      store(d);
      setNotice(
        d.verified
          ? { type: "success", text: "Your domain is connected." }
          : {
              type: "error",
              text:
                d.lastError ||
                "We could not find the DNS records yet. Changes can take a while to spread, so try again in a few minutes.",
            },
      );
    },
    onError: (err) =>
      setNotice({
        type: "error",
        text: errorMessage(err, "Could not check the domain."),
      }),
  });

  const removeMutation = useMutation({
    mutationFn: sellerCustomDomain.remove,
    onSuccess: () => {
      setConfirmRemove(false);
      queryClient.invalidateQueries({ queryKey: qk.seller.customDomain });
      setNotice({ type: "success", text: "Custom domain removed." });
    },
    onError: (err) => {
      setConfirmRemove(false);
      setNotice({
        type: "error",
        text: errorMessage(err, "Could not remove the domain."),
      });
    },
  });

  const data = query.data;
  const hasDomain = !!data?.domain;
  const locked = data ? !data.planAllowed : false;
  const cleaned = cleanDomain(input);
  const busy =
    setMutation.isPending ||
    verifyMutation.isPending ||
    removeMutation.isPending;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleaned || busy || locked) return;
    setNotice(null);
    setMutation.mutate(cleaned);
  };

  const ownership =
    data?.records.filter((r) => r.purpose === "ownership") ?? [];
  const routing = data?.records.filter((r) => r.purpose !== "ownership") ?? [];

  return (
    <section className="rounded-2xl bg-card p-4 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <Globe className="h-5 w-5 text-foreground" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-medium tracking-tight">Custom domain</h2>
          <p className="mt-0.5 max-w-xl text-sm text-muted-foreground">
            Use your own web address, like shop.yourbrand.com, instead of the
            default store link.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {locked && (
          <UpgradeNotice title="Custom domains are locked on your plan">
            {data?.planMessage ||
              "Connecting your own domain is available on a higher plan."}
          </UpgradeNotice>
        )}

        {notice && (
          <div
            role="status"
            className={cn(
              "flex items-start gap-3 rounded-2xl border p-3 text-sm",
              notice.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-destructive/30 bg-destructive/10 text-destructive",
            )}
          >
            {notice.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <p className="min-w-0 flex-1">{notice.text}</p>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setNotice(null)}
              className="shrink-0 opacity-70 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {query.isLoading && (
          <div className="space-y-3">
            <div className="h-11 animate-pulse rounded-full bg-muted" />
            <div className="h-24 animate-pulse rounded-2xl bg-muted" />
          </div>
        )}

        {query.error && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <span>
              {errorMessage(
                query.error,
                "Could not load your domain settings.",
              )}
            </span>
            <button
              type="button"
              onClick={() => query.refetch()}
              className="rounded-full bg-card px-4 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-muted"
            >
              Try again
            </button>
          </div>
        )}

        {data && !hasDomain && (
          <form onSubmit={submit} className="space-y-2">
            <label htmlFor="custom-domain" className="text-sm font-medium">
              Your domain
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="custom-domain"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={locked || busy}
                placeholder="shop.yourbrand.com"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                inputMode="url"
                className="h-11 min-w-0 flex-1 rounded-full border border-border bg-card px-4 text-sm outline-none transition focus:border-neutral-900 disabled:cursor-not-allowed disabled:bg-muted"
              />
              <button
                type="submit"
                disabled={!cleaned || busy || locked}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
              >
                {setMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Add domain
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              You must own the domain and be able to edit its DNS records.
            </p>
          </form>
        )}

        {data && hasDomain && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted/50 p-4">
              <div className="min-w-0">
                <p className="break-all text-base font-medium">{data.domain}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <StatusBadge data={data} />
                  {data.verified && !data.dnsOk && (
                    <span className="text-xs text-amber-700">
                      DNS no longer points to your store.
                    </span>
                  )}
                  {formatWhen(data.lastCheckedAt) && (
                    <span className="text-xs text-muted-foreground">
                      Checked {formatWhen(data.lastCheckedAt)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {data.verified && data.url && (
                  <a
                    href={data.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-card px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted"
                  >
                    Visit <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setNotice(null);
                    verifyMutation.mutate();
                  }}
                  disabled={busy || locked}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {verifyMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Check DNS
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmRemove(true)}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" /> Remove
                </button>
              </div>
            </div>

            {confirmRemove && (
              <div
                role="alertdialog"
                aria-label="Confirm remove domain"
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              >
                <p className="min-w-0 flex-1">
                  Remove <strong>{data.domain}</strong>? Your store will stop
                  loading on this address.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmRemove(false)}
                    className="rounded-full bg-card px-4 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => removeMutation.mutate()}
                    disabled={removeMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {removeMutation.isPending && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    )}
                    Remove
                  </button>
                </div>
              </div>
            )}

            {data.records.length > 0 && (
              <div className="space-y-4">
                {ownership.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">
                      1. Prove you own the domain
                    </h3>
                    <ul className="space-y-2">
                      {ownership.map((r, i) => (
                        <RecordRow key={`o-${i}`} rec={r} />
                      ))}
                    </ul>
                  </div>
                )}
                {routing.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">
                      {ownership.length > 0 ? "2. " : ""}Point the domain to
                      your store
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Add the CNAME record for a subdomain (like shop or www),
                      or the A record(s) for a root domain (like yourbrand.com).
                      You only need one kind.
                    </p>
                    <ul className="space-y-2">
                      {routing.map((r, i) => (
                        <RecordRow key={`r-${i}`} rec={r} />
                      ))}
                    </ul>
                  </div>
                )}
                {!data.verified && (
                  <p className="text-xs text-muted-foreground">
                    DNS changes can take from a few minutes up to 48 hours to
                    spread. Press Check DNS once you have added the records.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
