/**
 * Browser-side HTTP helper for the Go API.
 *
 * - Sends the HttpOnly auth cookies (credentials: "include").
 * - Adds the X-Requested-With header the API requires for state-changing
 *   requests (CSRF protection).
 * - Turns the API's JSON error format into a typed ApiError.
 * - On a 401, tries ONE token refresh (shared across concurrent requests, so
 *   several tabs/requests never rotate the refresh token at the same moment)
 *   and then retries the original request.
 *
 * Use this from client components. It must not import next/headers; the
 * server-only api-client.ts is a separate file.
 */

const API_BASE_URL = (
  typeof window === "undefined"
    ? `${process.env.API_INTERNAL_URL ?? "http://localhost:8080"}/api/v1`
    : (process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1")
).replace(/\/+$/, "");

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields: Record<string, string>;
  readonly requestId?: string;
  readonly retryAfter?: number;

  constructor(init: {
    status: number;
    code: string;
    message: string;
    fields?: Record<string, string>;
    requestId?: string;
    retryAfter?: number;
  }) {
    super(init.message);
    this.name = "ApiError";
    this.status = init.status;
    this.code = init.code;
    this.fields = init.fields ?? {};
    this.requestId = init.requestId;
    this.retryAfter = init.retryAfter;
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  /** Do not try a token refresh on 401 (login, register, logout, refresh). */
  skipRefresh?: boolean;
}

const NETWORK_MESSAGE =
  "Could not reach the server. Check your connection and try again.";

async function send(path: string, opts: RequestOptions): Promise<Response> {
  const method = opts.method ?? "GET";
  const headers: Record<string, string> = { Accept: "application/json" };
  const isForm = typeof FormData !== "undefined" && opts.body instanceof FormData;

  // FormData goes out untouched: the browser must set Content-Type itself
  // (multipart/form-data with the boundary).
  if (opts.body !== undefined && !isForm) headers["Content-Type"] = "application/json";
  if (method !== "GET") headers["X-Requested-With"] = "fetch";

  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body:
        opts.body === undefined
          ? undefined
          : isForm
            ? (opts.body as FormData)
            : JSON.stringify(opts.body),
      credentials: "include",
      signal: opts.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError({
      status: 0,
      code: "NETWORK_ERROR",
      message: NETWORK_MESSAGE,
    });
  }
}

let refreshInFlight: Promise<boolean> | null = null;

/** Refreshes the session once at a time. Resolves true if it succeeded. */
function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = send("/auth/refresh", { method: "POST" })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

async function toApiError(res: Response): Promise<ApiError> {
  let code = "UNKNOWN_ERROR";
  let message = "Something went wrong. Please try again.";
  let fields: Record<string, string> | undefined;
  let requestId: string | undefined;
  try {
    const body = await res.json();
    if (body?.error) {
      code = body.error.code ?? code;
      message = body.error.message ?? message;
      fields = body.error.fields;
      requestId = body.error.requestId;
    }
  } catch {
    // Non-JSON error body (for example a proxy error page): keep the defaults.
  }
  const retryHeader = Number(res.headers.get("Retry-After"));
  return new ApiError({
    status: res.status,
    code,
    message,
    fields,
    requestId,
    retryAfter: Number.isFinite(retryHeader) && retryHeader > 0 ? retryHeader : undefined,
  });
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  let res = await send(path, opts);

  if (res.status === 401 && !opts.skipRefresh) {
    if (await refreshSession()) {
      res = await send(path, opts);
    }
  }

  if (!res.ok) throw await toApiError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
