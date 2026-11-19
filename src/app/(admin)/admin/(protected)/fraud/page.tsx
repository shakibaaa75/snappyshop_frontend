"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, ShieldAlert, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ApiError } from "@/lib/api/http";
import {
  ADMIN_FRAUD_BACKFILL_KEY,
  ADMIN_FRAUD_KEY,
  adminFraud,
  type FraudSettings,
  type FraudSettingsPatch,
} from "@/lib/api/froud";

function msg(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : fallback;
}

function Row({
  title,
  help,
  children,
}: {
  title: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-4">
      <div className="min-w-0 max-w-md">
        <p className="text-sm font-medium">{title}</p>
        {help && <p className="mt-0.5 text-xs text-muted-foreground">{help}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function AdminFraudPage() {
  const qc = useQueryClient();
  const settingsQ = useQuery({
    queryKey: ADMIN_FRAUD_KEY,
    queryFn: adminFraud.get,
  });
  const s = settingsQ.data;

  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [numbers, setNumbers] = useState({
    minOrders: "3",
    cacheDays: "7",
    retentionDays: "365",
  });

  // Fill the text fields once the saved settings arrive (and after each save).
  useEffect(() => {
    if (!s) return;
    setBaseUrl(s.baseUrl ?? "");
    setNumbers({
      minOrders: String(s.minOrders),
      cacheDays: String(s.cacheDays),
      retentionDays: String(s.retentionDays),
    });
  }, [s]);

  const save = useMutation({
    mutationFn: (patch: FraudSettingsPatch) => adminFraud.update(patch),
    onSuccess: (next) => {
      qc.setQueryData<FraudSettings>(ADMIN_FRAUD_KEY, next);
      setApiKey("");
      setNotice({ ok: true, text: "Saved." });
    },
    onError: (err) =>
      setNotice({ ok: false, text: msg(err, "Could not save.") }),
  });

  const test = useMutation({
    mutationFn: adminFraud.test,
    onSuccess: (r) => setNotice({ ok: r.ok, text: r.message }),
    onError: (err) => setNotice({ ok: false, text: msg(err, "Test failed.") }),
  });

  const backfillQ = useQuery({
    queryKey: ADMIN_FRAUD_BACKFILL_KEY,
    queryFn: adminFraud.backfill,
    // Poll only while an import is running.
    refetchInterval: (q) => (q.state.data?.running ? 2000 : false),
  });
  const startBackfill = useMutation({
    mutationFn: adminFraud.startBackfill,
    onSuccess: (b) => {
      qc.setQueryData(ADMIN_FRAUD_BACKFILL_KEY, b);
      setNotice(null);
    },
    onError: (err) =>
      setNotice({ ok: false, text: msg(err, "Could not start the import.") }),
  });
  const bf = backfillQ.data;

  if (settingsQ.isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }
  if (settingsQ.error || !s) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        {msg(settingsQ.error, "Could not load fraud settings.")}
      </div>
    );
  }

  const busy = save.isPending;

  function saveNumbers() {
    setNotice(null);
    save.mutate({
      baseUrl: baseUrl.trim(),
      minOrders: Number(numbers.minOrders),
      cacheDays: Number(numbers.cacheDays),
      retentionDays: Number(numbers.retentionDays),
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <ShieldAlert className="h-6 w-6" /> Fraud check
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lets sellers check how risky a customer&apos;s phone number is, using
          this platform&apos;s own order history and (optionally) a third-party
          provider. Everything is off until you switch it on.
        </p>
      </header>

      {notice && (
        <div
          role="status"
          className={
            notice.ok
              ? "flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
              : "flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          }
        >
          {notice.ok ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span className="min-w-0">{notice.text}</span>
        </div>
      )}

      <section className="divide-y rounded-2xl border bg-card px-5">
        <Row
          title="Fraud check enabled"
          help="Master switch. Off: sellers do not see the feature and no order history is recorded."
        >
          <Switch
            checked={s.enabled}
            disabled={busy}
            onCheckedChange={(v) => save.mutate({ enabled: v })}
            aria-label="Fraud check enabled"
          />
        </Row>
        <Row
          title="Use third-party provider (Fraud BD)"
          help={
            s.hasApiKey
              ? "Asked only when our own history is too thin to judge."
              : "Save an API key below first."
          }
        >
          <Switch
            checked={s.providerEnabled}
            disabled={busy || !s.hasApiKey}
            onCheckedChange={(v) => save.mutate({ providerEnabled: v })}
            aria-label="Use third-party provider"
          />
        </Row>
        <Row
          title="Keep provider answers"
          help="Reuse a recent provider answer instead of asking again (saves your quota)."
        >
          <Switch
            checked={s.storeProviderData}
            disabled={busy}
            onCheckedChange={(v) => save.mutate({ storeProviderData: v })}
            aria-label="Keep provider answers"
          />
        </Row>
      </section>

      <section className="space-y-4 rounded-2xl border bg-card p-5">
        <h2 className="text-sm font-semibold">Provider API key</h2>
        {!s.keyStorageAvailable && (
          <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            Secure key storage is not configured on the server
            (COURIER_ENCRYPTION_KEY), so a key cannot be saved.
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          {s.hasApiKey
            ? `A key is saved (ends in ${s.apiKeyHint ?? "····"}). It is never shown again.`
            : "No key saved yet."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Input
            type="password"
            autoComplete="off"
            placeholder={
              s.hasApiKey ? "Enter a new key to replace it" : "Paste API key"
            }
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="min-w-0 flex-1"
            disabled={!s.keyStorageAvailable}
          />
          <Button
            disabled={busy || !apiKey.trim() || !s.keyStorageAvailable}
            onClick={() => {
              setNotice(null);
              save.mutate({ apiKey: apiKey.trim() });
            }}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save key"}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={!s.hasApiKey || test.isPending}
            onClick={() => {
              setNotice(null);
              test.mutate();
            }}
          >
            {test.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Test connection
          </Button>
          {s.hasApiKey && (
            <Button
              variant="outline"
              className="text-destructive"
              disabled={busy}
              onClick={() => {
                if (window.confirm("Remove the saved API key?")) {
                  setNotice(null);
                  save.mutate({ clearApiKey: true });
                }
              }}
            >
              Remove key
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Testing makes one real lookup and uses one request of the
          provider&apos;s quota.
        </p>
      </section>

      <section className="space-y-4 rounded-2xl border bg-card p-5">
        <h2 className="text-sm font-semibold">Rules</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Provider address (optional)</span>
            <Input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://fraudbd.com"
            />
            <span className="block text-xs text-muted-foreground">
              Leave empty for the default.
            </span>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Minimum finished orders</span>
            <Input
              type="number"
              min={1}
              max={50}
              value={numbers.minOrders}
              onChange={(e) =>
                setNumbers((n) => ({ ...n, minOrders: e.target.value }))
              }
            />
            <span className="block text-xs text-muted-foreground">
              1–50. Below this, our own history is not trusted alone.
            </span>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Reuse provider answer (days)</span>
            <Input
              type="number"
              min={0}
              max={90}
              value={numbers.cacheDays}
              onChange={(e) =>
                setNumbers((n) => ({ ...n, cacheDays: e.target.value }))
              }
            />
            <span className="block text-xs text-muted-foreground">
              0–90. 0 = always ask again.
            </span>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Keep customer records (days)</span>
            <Input
              type="number"
              min={0}
              max={1825}
              value={numbers.retentionDays}
              onChange={(e) =>
                setNumbers((n) => ({ ...n, retentionDays: e.target.value }))
              }
            />
            <span className="block text-xs text-muted-foreground">
              0 = keep forever, otherwise 30–1825.
            </span>
          </label>
        </div>
        <Button disabled={busy} onClick={saveNumbers}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save rules
        </Button>
      </section>

      <section className="space-y-3 rounded-2xl border bg-card p-5">
        <h2 className="text-sm font-semibold">Import existing orders</h2>
        <p className="text-sm text-muted-foreground">
          Counts past confirmed, shipped, delivered and cancelled orders into
          the history. Safe to run again: each order is counted once. The fraud
          check must be switched on first.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            disabled={!s.enabled || bf?.running || startBackfill.isPending}
            onClick={() => startBackfill.mutate()}
          >
            {(bf?.running || startBackfill.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {bf?.running ? "Importing…" : "Import history"}
          </Button>
          {bf && (bf.running || bf.startedAt) && (
            <span className="text-sm text-muted-foreground">
              {bf.processed} orders processed
              {bf.finishedAt && !bf.running ? " · finished" : ""}
            </span>
          )}
        </div>
        {bf?.error && <p className="text-sm text-destructive">{bf.error}</p>}
      </section>
    </div>
  );
}
