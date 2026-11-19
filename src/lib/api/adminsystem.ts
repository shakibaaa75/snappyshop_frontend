/** Admin "System health" report — GET /api/v1/admin/system */
import { apiFetch } from "./http";

export interface MinutePoint {
  minute: string;
  requests: number;
  errors4xx: number;
  errors5xx: number;
  avgMs: number;
}

export interface RouteRow {
  route: string;
  requests: number;
  errors4xx: number;
  errors5xx: number;
  avgMs: number;
  maxMs: number;
}

export interface HostInfo {
  load1: number;
  load5: number;
  load15: number;
  memTotalMb: number;
  memAvailableMb: number;
  memUsedPercent: number;
  swapUsedPercent: number;
  uptimeSeconds: number;
}

export interface ServerInfo {
  goVersion: string;
  os: string;
  arch: string;
  cpus: number;
  goMaxProcs: number;
  goroutines: number;
  heapAllocMb: number;
  heapSysMb: number;
  stackMb: number;
  sysMb: number;
  gcCycles: number;
  gcPauseTotalMs: number;
  lastGcSecondsAgo: number;
  uptimeSeconds: number;
  host?: HostInfo;
}

export interface TrafficInfo {
  startedAt: string;
  uptimeSeconds: number;
  totalRequests: number;
  inFlight: number;
  bytesOut: number;
  status2xx: number;
  status3xx: number;
  status4xx: number;
  status5xx: number;
  avgMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  lastMinute: number;
  last5Minutes: number;
  last5Errors5xx: number;
  last5ErrorRate: number;
  errorRate: number;
  series: MinutePoint[];
  topRoutes: RouteRow[];
  slowRoutes: RouteRow[];
}

export interface DatabaseInfo {
  name: string;
  ok: boolean;
  pingMs?: number;
  /** false when the MongoDB user may not run serverStatus (some managed plans). */
  serverStatus?: boolean;
  version?: string;
  uptimeSeconds?: number;
  connections?: { current: number; available: number; totalCreated: number };
  opcounters?: {
    insert: number;
    query: number;
    update: number;
    delete: number;
    getmore: number;
    command: number;
  };
  memory?: { residentMb: number; virtualMb: number };
  network?: { bytesIn: number; bytesOut: number; numRequests: number };
  stats?: {
    collections: number;
    objects: number;
    indexes: number;
    dataSizeBytes: number;
    storageBytes: number;
    indexBytes: number;
  };
  collections?: { name: string; documents: number }[];
}

export interface SystemReport {
  generatedAt: string;
  health: { status: "ok" | "warning" | "critical"; issues: string[] };
  server: ServerInfo;
  traffic: TrafficInfo;
  database: DatabaseInfo;
}

export const systemApi = {
  report: () => apiFetch<SystemReport>("/admin/system"),
};