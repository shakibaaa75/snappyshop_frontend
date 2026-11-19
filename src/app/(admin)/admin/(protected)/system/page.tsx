"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { systemApi, type SystemReport } from "@/lib/api/adminsystem";
import { ApiError } from "@/lib/api/http";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const REFRESH_MS = 10_000;

function bytes(n: number): string {
  if (!n) return "0 B";
  const u = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(u.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  return `${(n / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${u[i]}`;
}

function mb(n: number): string {
  return n >= 1024 ? `${(n / 1024).toFixed(1)} GB` : `${n.toFixed(0)} MB`;
}

function duration(sec: number): string {
  const s = Math.floor(sec);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

const num = (n: number) => n.toLocaleString();

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "good" | "warn" | "bad";
}) {
  return (
    <div>
      <div className="text-xs text-zinc-500">{label}</div>
      <div
        className={cn(
          "mt-0.5 text-lg font-semibold tabular-nums",
          tone === "good" && "text-emerald-600",
          tone === "warn" && "text-amber-600",
          tone === "bad" && "text-red-600",
        )}
      >
        {value}
      </div>
      {hint && <div className="text-[11px] text-zinc-400">{hint}</div>}
    </div>
  );
}

function Bar({
  percent,
  tone,
}: {
  percent: number;
  tone: "good" | "warn" | "bad";
}) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
      <div
        className={cn(
          "h-full rounded-full",
          tone === "good" && "bg-emerald-500",
          tone === "warn" && "bg-amber-500",
          tone === "bad" && "bg-red-500",
        )}
        style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
      />
    </div>
  );
}

const pctTone = (p: number) => (p > 90 ? "bad" : p > 75 ? "warn" : "good");

export default function AdminSystemPage() {
  const [data, setData] = useState<SystemReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [auto, setAuto] = useState(true);

  const load = useCallback(async () => {
    try {
      setError(null);
      setData(await systemApi.report());
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Failed to load system report",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => void load(), REFRESH_MS);
    return () => clearInterval(t);
  }, [auto, load]);

  if (loading && !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-zinc-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading system report…
      </div>
    );
  }

  const h = data?.health;
  const sv = data?.server;
  const tr = data?.traffic;
  const db = data?.database;
  const peak = tr ? Math.max(1, ...tr.series.map((p) => p.requests)) : 1;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            System health
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Server, database and traffic
            {data
              ? ` · updated ${new Date(data.generatedAt).toLocaleTimeString()}`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-zinc-500">
            <input
              type="checkbox"
              checked={auto}
              onChange={(e) => setAuto(e.target.checked)}
            />
            Auto-refresh (10s)
          </label>
          <Button size="sm" variant="ghost" onClick={() => void load()}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {h && (
        <div
          className={cn(
            "flex items-start gap-3 rounded-xl border px-4 py-3",
            h.status === "ok" &&
              "border-emerald-200 bg-emerald-50 text-emerald-900",
            h.status === "warning" &&
              "border-amber-200 bg-amber-50 text-amber-900",
            h.status === "critical" && "border-red-200 bg-red-50 text-red-900",
          )}
        >
          {h.status === "ok" && (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          )}
          {h.status === "warning" && (
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          )}
          {h.status === "critical" && (
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
          )}
          <div className="text-sm">
            <div className="font-semibold">
              {h.status === "ok" && "Everything looks healthy"}
              {h.status === "warning" && "Needs attention"}
              {h.status === "critical" && "Critical problem"}
            </div>
            {h.issues.length > 0 && (
              <ul className="mt-1 list-disc pl-4">
                {h.issues.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {sv && (
        <Card title="Server">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <Stat label="API uptime" value={duration(sv.uptimeSeconds)} />
            <Stat
              label="CPUs"
              value={sv.cpus}
              hint={`${sv.os}/${sv.arch} · ${sv.goVersion}`}
            />
            <Stat
              label="App memory"
              value={mb(sv.sysMb)}
              hint={`heap in use ${mb(sv.heapAllocMb)}`}
            />
            <Stat
              label="Background tasks"
              value={num(sv.goroutines)}
              hint="goroutines"
            />
            <Stat
              label="Garbage collections"
              value={num(sv.gcCycles)}
              hint={`total pause ${sv.gcPauseTotalMs.toFixed(1)} ms`}
            />
            {sv.host && (
              <>
                <Stat
                  label="Load (1 / 5 / 15 min)"
                  value={`${sv.host.load1.toFixed(2)} / ${sv.host.load5.toFixed(2)} / ${sv.host.load15.toFixed(2)}`}
                  tone={
                    sv.host.load5 > sv.cpus * 1.5
                      ? "bad"
                      : sv.host.load5 > sv.cpus
                        ? "warn"
                        : "good"
                  }
                />
                <Stat
                  label="Machine uptime"
                  value={duration(sv.host.uptimeSeconds)}
                />
              </>
            )}
          </div>
          {sv.host && sv.host.memTotalMb > 0 && (
            <div className="mt-4 space-y-3">
              <div>
                <div className="mb-1 flex justify-between text-xs text-zinc-500">
                  <span>Machine memory</span>
                  <span>
                    {mb(sv.host.memTotalMb - sv.host.memAvailableMb)} of{" "}
                    {mb(sv.host.memTotalMb)} (
                    {sv.host.memUsedPercent.toFixed(0)}%)
                  </span>
                </div>
                <Bar
                  percent={sv.host.memUsedPercent}
                  tone={pctTone(sv.host.memUsedPercent)}
                />
              </div>
              {sv.host.swapUsedPercent > 0 && (
                <div>
                  <div className="mb-1 flex justify-between text-xs text-zinc-500">
                    <span>Swap</span>
                    <span>{sv.host.swapUsedPercent.toFixed(0)}%</span>
                  </div>
                  <Bar
                    percent={sv.host.swapUsedPercent}
                    tone={pctTone(sv.host.swapUsedPercent)}
                  />
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {db && (
        <Card title="Database (MongoDB)">
          {!db.ok ? (
            <div className="text-sm font-medium text-red-600">
              Database is not reachable
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                <Stat
                  label="Status"
                  value="Connected"
                  tone="good"
                  hint={db.name}
                />
                <Stat
                  label="Response time"
                  value={`${(db.pingMs ?? 0).toFixed(1)} ms`}
                  tone={
                    (db.pingMs ?? 0) > 300
                      ? "bad"
                      : (db.pingMs ?? 0) > 100
                        ? "warn"
                        : "good"
                  }
                />
                {db.version && <Stat label="Version" value={db.version} />}
                {db.uptimeSeconds ? (
                  <Stat label="DB uptime" value={duration(db.uptimeSeconds)} />
                ) : null}
                {db.connections && (
                  <Stat
                    label="Connections"
                    value={num(db.connections.current)}
                    hint={`${num(db.connections.available)} available`}
                  />
                )}
                {db.stats && (
                  <>
                    <Stat
                      label="Data size"
                      value={bytes(db.stats.dataSizeBytes)}
                    />
                    <Stat
                      label="Disk used"
                      value={bytes(db.stats.storageBytes + db.stats.indexBytes)}
                      hint={`indexes ${bytes(db.stats.indexBytes)}`}
                    />
                    <Stat
                      label="Documents"
                      value={num(db.stats.objects)}
                      hint={`${db.stats.collections} collections · ${db.stats.indexes} indexes`}
                    />
                  </>
                )}
                {db.memory && db.memory.residentMb > 0 && (
                  <Stat label="DB memory" value={mb(db.memory.residentMb)} />
                )}
              </div>
              {db.serverStatus === false && (
                <p className="text-xs text-zinc-500">
                  Connections, operations and memory are hidden: this MongoDB
                  user is not allowed to run serverStatus.
                </p>
              )}
              {db.opcounters && (
                <div>
                  <div className="mb-2 text-xs font-medium text-zinc-500">
                    Operations since the database started
                  </div>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                    {Object.entries(db.opcounters).map(([k, v]) => (
                      <Stat key={k} label={k} value={num(v)} />
                    ))}
                  </div>
                </div>
              )}
              {db.collections && db.collections.length > 0 && (
                <div>
                  <div className="mb-2 text-xs font-medium text-zinc-500">
                    Collections
                  </div>
                  <div className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                    {db.collections.map((c) => (
                      <div
                        key={c.name}
                        className="flex justify-between border-b border-zinc-100 py-1 dark:border-zinc-800"
                      >
                        <span className="font-mono text-xs">{c.name}</span>
                        <span className="tabular-nums text-zinc-500">
                          {num(c.documents)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {tr && (
        <Card title="Traffic">
          <p className="mb-3 text-[11px] text-zinc-400">
            Counted since this API server started {duration(tr.uptimeSeconds)}{" "}
            ago, for this server instance only (health checks excluded).
            Counters reset on restart or deploy.
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <Stat
              label="Requests (total)"
              value={num(tr.totalRequests)}
              hint={`${bytes(tr.bytesOut)} sent`}
            />
            <Stat
              label="Last minute"
              value={num(tr.lastMinute)}
              hint="requests"
            />
            <Stat
              label="Last 5 minutes"
              value={num(tr.last5Minutes)}
              hint="requests"
            />
            <Stat label="In progress now" value={num(tr.inFlight)} />
            <Stat
              label="Server errors (5 min)"
              value={`${tr.last5ErrorRate.toFixed(1)}%`}
              tone={
                tr.last5ErrorRate > 5
                  ? "bad"
                  : tr.last5ErrorRate > 1
                    ? "warn"
                    : "good"
              }
              hint={`${num(tr.last5Errors5xx)} failed`}
            />
            <Stat
              label="Average response"
              value={`${tr.avgMs.toFixed(0)} ms`}
            />
            <Stat
              label="95% finish within"
              value={`${tr.p95Ms} ms`}
              tone={tr.p95Ms >= 1000 ? "warn" : "good"}
            />
            <Stat label="99% finish within" value={`${tr.p99Ms} ms`} />
          </div>

          <div className="mt-5">
            <div className="mb-2 text-xs font-medium text-zinc-500">
              Requests per minute (last 60 minutes)
            </div>
            <div className="flex h-28 items-end gap-[2px]">
              {tr.series.map((p) => (
                <div
                  key={p.minute}
                  className="group relative flex-1"
                  style={{ height: "100%" }}
                  title={`${new Date(p.minute).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · ${p.requests} requests · ${p.errors5xx} server errors`}
                >
                  <div
                    className="absolute inset-x-0 bottom-0 flex flex-col justify-end"
                    style={{ height: `${(p.requests / peak) * 100}%` }}
                  >
                    <div
                      className={cn(
                        "w-full rounded-sm",
                        p.errors5xx > 0 ? "bg-red-500" : "bg-blue-500",
                      )}
                      style={{
                        height: "100%",
                        minHeight: p.requests > 0 ? 2 : 0,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-zinc-400">
              <span>60 min ago</span>
              <span>now</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Success (2xx)" value={num(tr.status2xx)} tone="good" />
            <Stat label="Redirects (3xx)" value={num(tr.status3xx)} />
            <Stat
              label="Client errors (4xx)"
              value={num(tr.status4xx)}
              tone={tr.status4xx > 0 ? "warn" : undefined}
            />
            <Stat
              label="Server errors (5xx)"
              value={num(tr.status5xx)}
              tone={tr.status5xx > 0 ? "bad" : "good"}
            />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <RouteTable title="Busiest endpoints" rows={tr.topRoutes} />
            <RouteTable title="Slowest endpoints (avg)" rows={tr.slowRoutes} />
          </div>
        </Card>
      )}
    </div>
  );
}

function RouteTable({
  title,
  rows,
}: {
  title: string;
  rows: SystemReport["traffic"]["topRoutes"];
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-medium text-zinc-500">{title}</div>
      <div className="overflow-x-auto rounded-lg border border-zinc-100 dark:border-zinc-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-950/50">
            <tr>
              <th className="px-3 py-2 font-medium">Endpoint</th>
              <th className="px-3 py-2 text-right font-medium">Requests</th>
              <th className="px-3 py-2 text-right font-medium">Avg</th>
              <th className="px-3 py-2 text-right font-medium">Errors</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-zinc-400">
                  No data yet
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.route}>
                <td className="px-3 py-2 font-mono">{r.route}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {num(r.requests)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {r.avgMs.toFixed(0)} ms
                </td>
                <td
                  className={cn(
                    "px-3 py-2 text-right tabular-nums",
                    r.errors5xx > 0 && "text-red-600",
                  )}
                >
                  {r.errors4xx + r.errors5xx}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
