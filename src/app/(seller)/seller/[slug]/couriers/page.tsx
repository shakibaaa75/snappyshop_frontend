"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Truck,
  Unplug,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/http";
import { qk } from "@/lib/query/keys";
import { useEntitlements } from "@/lib/query/entitlements";
import { UpgradeNotice } from "@/components/seller/plan-lock";
import { CourierLogo } from "@/components/seller/courier-logo";
import { DeliverySettingsForm } from "@/components/seller/delivery-settings-form";
import {
  COURIER_STATUS_COLOR,
  COURIER_STATUS_LABEL,
  sellerCouriers,
  type CourierConnection,
  type CourierCredentials,
  type CourierProvider,
} from "@/lib/api/couriers";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

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

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-neutral-200/80", className)}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

type ModalState =
  | { kind: "closed" }
  | { kind: "add" }
  | { kind: "update"; connection: CourierConnection };

function CourierAccounts() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<ModalState>({ kind: "closed" });
  const [confirmDisconnect, setConfirmDisconnect] =
    useState<CourierConnection | null>(null);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const connections = useQuery({
    queryKey: qk.seller.couriers.list(),
    queryFn: sellerCouriers.list,
  });

  const providers = useQuery({
    queryKey: qk.seller.couriers.providers(),
    queryFn: sellerCouriers.providers,
    staleTime: 5 * 60_000,
  });

  // Auto-dismiss notices.
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(t);
  }, [notice]);

  /** Swap one connection in the cached list without refetching. */
  function replaceInCache(next: CourierConnection) {
    queryClient.setQueryData<CourierConnection[]>(
      qk.seller.couriers.list(),
      (old) => (old ?? []).map((c) => (c.id === next.id ? next : c)),
    );
  }

  const testMutation = useMutation({
    mutationFn: (id: string) => sellerCouriers.test(id),
    onSuccess: (conn) => {
      replaceInCache(conn);
      setNotice(
        conn.status === "connected"
          ? { type: "success", text: `${conn.providerName} is working.` }
          : {
              type: "error",
              text:
                conn.statusMessage ||
                `${conn.providerName} could not be verified.`,
            },
      );
    },
    onError: (err) =>
      setNotice({
        type: "error",
        text: errorMessage(err, "Could not test the connection."),
      }),
  });

  const disconnectMutation = useMutation({
    mutationFn: (id: string) => sellerCouriers.disconnect(id),
    onSuccess: (_void, id) => {
      queryClient.setQueryData<CourierConnection[]>(
        qk.seller.couriers.list(),
        (old) => (old ?? []).filter((c) => c.id !== id),
      );
      setNotice({ type: "success", text: "Courier disconnected." });
      setConfirmDisconnect(null);
    },
    onError: (err) => {
      setConfirmDisconnect(null);
      setNotice({
        type: "error",
        text: errorMessage(err, "Could not disconnect the courier."),
      });
    },
  });

  const list = useMemo(() => connections.data ?? [], [connections.data]);
  // Automatic courier integration is a paid feature. The server refuses
  // connect / test / update / booking for Free sellers as well.
  const { entitlements } = useEntitlements();
  const courierLocked = !entitlements.autoCourier;
  const openAdd = () => {
    if (!courierLocked) setModal({ kind: "add" });
  };
  const availableProviders = providers.data ?? [];
  const testingId = testMutation.isPending ? testMutation.variables : null;

  return (
    <div className="w-full min-w-0 max-w-full space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
            Courier Services
          </h1>
          <p className="mt-1 max-w-xl text-sm text-neutral-500">
            Connect your own courier accounts. Your credentials are verified
            with the courier, stored encrypted, and only used for your store.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          disabled={courierLocked}
          aria-disabled={courierLocked}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-sm transition",
            courierLocked
              ? "cursor-not-allowed bg-neutral-200 text-neutral-500"
              : "bg-emerald-700 text-white hover:bg-emerald-800",
          )}
        >
          {courierLocked ? (
            <Lock className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Add Courier Service
        </button>
      </header>

      {courierLocked && (
        <UpgradeNotice title="Automatic courier integration is locked on your plan">
          Connecting a courier account and booking parcels automatically is
          available on Pro and Business.
        </UpgradeNotice>
      )}

      {notice && (
        <div
          role="status"
          className={cn(
            "flex items-start gap-3 rounded-2xl border p-4 text-sm",
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

      <section className="rounded-[26px] bg-white p-4 shadow-sm sm:p-5">
        {connections.isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        )}

        {connections.error && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <span>
              {errorMessage(connections.error, "Could not load your couriers.")}
            </span>
            <button
              type="button"
              onClick={() => connections.refetch()}
              className="rounded-full bg-white px-4 py-1.5 text-xs font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
            >
              Try again
            </button>
          </div>
        )}

        {!connections.isLoading && !connections.error && list.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
              <Truck className="h-6 w-6 text-neutral-500" />
            </span>
            <p className="max-w-sm text-sm text-neutral-500">
              No couriers connected yet. Add one to start using your own courier
              account with your store.
            </p>
            <button
              type="button"
              onClick={openAdd}
              disabled={courierLocked}
              aria-disabled={courierLocked}
              className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add Courier Service
            </button>
          </div>
        )}

        {!connections.isLoading && !connections.error && list.length > 0 && (
          <ul className="space-y-3">
            {list.map((c) => {
              const color = COURIER_STATUS_COLOR[c.status];
              const checked = formatWhen(c.lastCheckedAt);
              const busy = testingId === c.id;
              return (
                <li
                  key={c.id}
                  className="min-w-0 rounded-2xl bg-neutral-50 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <CourierLogo
                        provider={c.provider}
                        name={c.providerName}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {c.providerName}
                          {c.label ? (
                            <span className="text-neutral-400">
                              {" "}
                              · {c.label}
                            </span>
                          ) : null}
                        </p>
                        <p className="truncate text-[11px] text-neutral-500">
                          {c.accountHint ? `Account ${c.accountHint}` : "—"}
                          {checked ? ` · Checked ${checked}` : ""}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                        color.bg,
                        color.text,
                      )}
                    >
                      <span
                        className={cn("h-1.5 w-1.5 rounded-full", color.dot)}
                      />
                      {COURIER_STATUS_LABEL[c.status]}
                    </span>
                  </div>

                  {c.status !== "connected" && c.statusMessage && (
                    <p className="mt-3 rounded-xl bg-white px-3 py-2 text-xs text-neutral-600">
                      {c.statusMessage}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => testMutation.mutate(c.id)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-neutral-700 shadow-sm transition hover:bg-emerald-700 hover:text-white disabled:opacity-60"
                    >
                      {busy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                      {busy ? "Testing…" : "Test Connection"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setModal({ kind: "update", connection: c })
                      }
                      className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-neutral-700 shadow-sm transition hover:bg-emerald-700 hover:text-white"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      Update Credentials
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDisconnect(c)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-red-600 shadow-sm transition hover:bg-red-600 hover:text-white"
                    >
                      <Unplug className="h-3.5 w-3.5" />
                      Disconnect
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {modal.kind !== "closed" && (
        <CredentialsModal
          mode={modal.kind}
          connection={modal.kind === "update" ? modal.connection : undefined}
          providers={availableProviders}
          providersLoading={providers.isLoading}
          providersError={
            providers.error
              ? errorMessage(providers.error, "Could not load couriers.")
              : null
          }
          onClose={() => setModal({ kind: "closed" })}
          onDone={(conn, text) => {
            if (modal.kind === "add") {
              queryClient.setQueryData<CourierConnection[]>(
                qk.seller.couriers.list(),
                (old) => [conn, ...(old ?? [])],
              );
            } else {
              replaceInCache(conn);
            }
            setNotice({ type: "success", text });
            setModal({ kind: "closed" });
          }}
        />
      )}

      {confirmDisconnect && (
        <ModalShell
          title="Disconnect courier?"
          onClose={() => {
            if (!disconnectMutation.isPending) setConfirmDisconnect(null);
          }}
        >
          <p className="text-sm text-neutral-600">
            This removes {confirmDisconnect.providerName}
            {confirmDisconnect.label ? ` (${confirmDisconnect.label})` : ""} and
            deletes its stored credentials. You can reconnect later by adding it
            again.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              disabled={disconnectMutation.isPending}
              onClick={() => setConfirmDisconnect(null)}
              className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={disconnectMutation.isPending}
              onClick={() => disconnectMutation.mutate(confirmDisconnect.id)}
              className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {disconnectMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Disconnect
            </button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal shell                                                         */
/* ------------------------------------------------------------------ */

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-[26px] bg-white shadow-xl sm:rounded-[26px]"
      >
        <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-5">
          <h2 id={titleId} className="text-lg font-medium tracking-tight">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition hover:bg-neutral-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-5 pt-2">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Add / update credentials                                            */
/* ------------------------------------------------------------------ */

function CredentialsModal({
  mode,
  connection,
  providers,
  providersLoading,
  providersError,
  onClose,
  onDone,
}: {
  mode: "add" | "update";
  connection?: CourierConnection;
  providers: CourierProvider[];
  providersLoading: boolean;
  providersError: string | null;
  onClose: () => void;
  onDone: (conn: CourierConnection, message: string) => void;
}) {
  const [providerId, setProviderId] = useState<string | null>(
    mode === "update" ? (connection?.provider ?? null) : null,
  );
  const [label, setLabel] = useState("");
  const [values, setValues] = useState<CourierCredentials>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const submitting = useRef(false);

  const provider = providers.find((p) => p.id === providerId) ?? null;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!provider) throw new Error("Choose a courier first.");
      const credentials: CourierCredentials = {};
      for (const f of provider.credentialFields) {
        credentials[f.key] = (values[f.key] ?? "").trim();
      }
      if (mode === "update" && connection) {
        return sellerCouriers.updateCredentials(connection.id, credentials);
      }
      return sellerCouriers.connect({
        provider: provider.id,
        label: label.trim() || undefined,
        credentials,
      });
    },
    onSuccess: (conn) => {
      // Wipe secrets from component state before closing.
      setValues({});
      onDone(
        conn,
        mode === "add"
          ? `${conn.providerName} connected.`
          : `${conn.providerName} credentials updated.`,
      );
    },
    onError: (err) => {
      submitting.current = false;
      if (err instanceof ApiError && Object.keys(err.fields).length > 0) {
        setFieldErrors(err.fields);
      }
      setFormError(
        errorMessage(err, "Could not verify these credentials. Try again."),
      );
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current || mutation.isPending || !provider) return;

    const errs: Record<string, string> = {};
    for (const f of provider.credentialFields) {
      if (f.required && !(values[f.key] ?? "").trim()) {
        errs[f.key] = `${f.label} is required.`;
      }
    }
    setFieldErrors(errs);
    setFormError(null);
    if (Object.keys(errs).length > 0) return;

    submitting.current = true;
    mutation.mutate();
  }

  const close = () => {
    if (mutation.isPending) return;
    setValues({});
    mutation.reset();
    onClose();
  };

  const title =
    mode === "update"
      ? `Update ${connection?.providerName ?? "courier"} credentials`
      : "Add Courier Service";

  return (
    <ModalShell title={title} onClose={close}>
      {/* Provider picker (add mode only) */}
      {mode === "add" && (
        <div>
          <p className="text-xs font-medium text-neutral-600">Courier</p>
          {providersLoading ? (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Skeleton className="h-14 rounded-2xl" />
              <Skeleton className="h-14 rounded-2xl" />
            </div>
          ) : providersError ? (
            <p className="mt-2 rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">
              {providersError}
            </p>
          ) : providers.length === 0 ? (
            <p className="mt-2 rounded-2xl bg-neutral-100 p-4 text-sm text-neutral-600">
              No couriers are available to connect yet. Couriers appear here
              once their integration has been built and tested.
            </p>
          ) : (
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {providers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={mutation.isPending}
                  onClick={() => {
                    setProviderId(p.id);
                    setValues({});
                    setRevealed({});
                    setFieldErrors({});
                    setFormError(null);
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl p-3 text-left transition",
                    providerId === p.id
                      ? "bg-emerald-50 ring-2 ring-emerald-600"
                      : "bg-neutral-100 hover:bg-neutral-200/70",
                  )}
                >
                  <CourierLogo provider={p.id} name={p.name} size={36} />
                  <span className="min-w-0 text-sm font-medium">{p.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {mode === "update" && !provider && !providersLoading && (
        <p className="rounded-2xl bg-neutral-100 p-4 text-sm text-neutral-600">
          This courier is no longer available. Disconnect it and add another.
        </p>
      )}

      {/* Credential form */}
      {provider && (
        <form onSubmit={submit} className="mt-4 space-y-4" autoComplete="off">
          {provider.credentialHelp.length > 0 && (
            <div className="rounded-2xl bg-neutral-100 p-3.5">
              <p className="text-xs font-medium text-neutral-700">
                Where to find these
              </p>
              <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-xs text-neutral-600">
                {provider.credentialHelp.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
              {provider.docsUrl && (
                <a
                  href={provider.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
                >
                  Courier documentation <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}

          {mode === "update" && (
            <p className="text-xs text-neutral-500">
              Saved secrets are never shown. Enter the new values to replace
              them. The old ones are kept if verification fails.
            </p>
          )}

          {mode === "add" && (
            <label className="block">
              <span className="text-xs font-medium text-neutral-600">
                Nickname (optional)
              </span>
              <input
                value={label}
                maxLength={60}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Dhaka warehouse"
                disabled={mutation.isPending}
                className="mt-1 h-11 w-full rounded-full bg-neutral-100 px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:ring-2 focus:ring-emerald-600/40"
              />
            </label>
          )}

          {provider.credentialFields.map((f) => {
            const isSecret = f.type === "password";
            const show = !!revealed[f.key];
            const err = fieldErrors[f.key];
            return (
              <label key={f.key} className="block">
                <span className="text-xs font-medium text-neutral-600">
                  {f.label}
                  {f.required ? <span className="text-red-500"> *</span> : null}
                </span>
                <div className="relative mt-1">
                  <input
                    type={isSecret && !show ? "password" : "text"}
                    value={values[f.key] ?? ""}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [f.key]: e.target.value }))
                    }
                    placeholder={f.placeholder}
                    disabled={mutation.isPending}
                    autoComplete="off"
                    inputMode={
                      f.key === "storeId"
                        ? "numeric"
                        : /email|username/i.test(f.key)
                          ? "email"
                          : undefined
                    }
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    aria-invalid={!!err}
                    className={cn(
                      "h-11 w-full rounded-full bg-neutral-100 pl-4 text-sm outline-none transition placeholder:text-neutral-400 focus:ring-2 focus:ring-emerald-600/40",
                      isSecret ? "pr-11" : "pr-4",
                      err && "ring-2 ring-red-400",
                    )}
                  />
                  {isSecret && (
                    <button
                      type="button"
                      aria-label={show ? "Hide value" : "Show value"}
                      onClick={() =>
                        setRevealed((r) => ({ ...r, [f.key]: !r[f.key] }))
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                    >
                      {show ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
                {err ? (
                  <span className="mt-1 block text-xs text-red-600">{err}</span>
                ) : f.helpText ? (
                  <span className="mt-1 block text-[11px] text-neutral-500">
                    {f.helpText}
                  </span>
                ) : null}
              </label>
            );
          })}

          {formError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="min-w-0">{formError}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              disabled={mutation.isPending}
              onClick={close}
              className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-2 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:opacity-60"
            >
              {mutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {mutation.isPending
                ? "Verifying…"
                : mode === "add"
                  ? "Verify & Connect"
                  : "Verify & Save"}
            </button>
          </div>
        </form>
      )}
    </ModalShell>
  );
}

/* ------------------------------------------------------------------ */
/* Page: courier accounts + delivery charges                           */
/* ------------------------------------------------------------------ */

type PageTab = "couriers" | "delivery";

const PAGE_TABS: { id: PageTab; label: string }[] = [
  { id: "couriers", label: "Courier accounts" },
  { id: "delivery", label: "Delivery charges" },
];

export default function SellerCouriersPage() {
  const [tab, setTab] = useState<PageTab>("couriers");
  const deliveryDirty = useRef(false);
  const onDeliveryDirty = useCallback((dirty: boolean) => {
    deliveryDirty.current = dirty;
  }, []);

  const choose = (next: PageTab) => {
    if (
      next !== tab &&
      deliveryDirty.current &&
      !window.confirm(
        "You have delivery changes that aren't saved. Leave without saving?",
      )
    ) {
      return;
    }
    setTab(next);
  };

  return (
    <div className="w-full min-w-0 max-w-full space-y-5">
      <div
        role="tablist"
        aria-label="Courier services"
        className="flex gap-2 overflow-x-auto [scrollbar-width:none]"
      >
        {PAGE_TABS.map((t) => (
          <button
            key={t.id}
            id={`courier-tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`courier-panel-${t.id}`}
            onClick={() => choose(t.id)}
            className={cn(
              "min-h-10 shrink-0 rounded-full border px-4 text-sm font-medium transition",
              tab === t.id
                ? "border-emerald-700 bg-emerald-700 text-white"
                : "border-transparent bg-white text-neutral-500 hover:text-neutral-900",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`courier-panel-${tab}`}
        aria-labelledby={`courier-tab-${tab}`}
      >
        {tab === "couriers" ? (
          <CourierAccounts />
        ) : (
          <div className="space-y-5">
            <header className="min-w-0">
              <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
                Delivery charges
              </h1>
              <p className="mt-1 max-w-xl text-sm text-neutral-500">
                What your customers pay for delivery, inside and outside Dhaka.
                These also appear in your store editor.
              </p>
            </header>
            <DeliverySettingsForm onDirtyChange={onDeliveryDirty} />
          </div>
        )}
      </div>
    </div>
  );
}
