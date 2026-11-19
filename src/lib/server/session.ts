import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthUser } from "@/lib/api/auth";
import { USER_HEADER, verifyUser } from "@/lib/internal-user";

/**
 * Second layer of access checks for protected layouts.
 *
 * middleware.ts is the real gate (it runs before anything renders, which a
 * layout can't). These checks repeat it as defence in depth, in case the
 * middleware is ever skipped or its matcher is edited, and they give the seller
 * layout the user for its shop-address checks.
 *
 * Cookies are forwarded to the Go API as-is, so the API stays the single source
 * of truth. The API also enforces roles on every endpoint.
 */

const API_BASE_URL = `${(process.env.API_INTERNAL_URL ?? "http://localhost:8080").replace(/\/+$/, "")}/api/v1`;

type ApiResult<T> = { status: number; body: T | null };

async function apiGet<T>(path: string): Promise<ApiResult<T>> {
  const cookie = (await headers()).get("cookie");
  // No cookies at all: nobody is signed in, no point asking the API.
  if (!cookie) return { status: 401, body: null };
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Accept: "application/json", Cookie: cookie },
      cache: "no-store",
    });
    if (!res.ok) return { status: res.status, body: null };
    return { status: res.status, body: (await res.json()) as T };
  } catch {
    return { status: 0, body: null };
  }
}

/** The signed-in user, once per request even if several layouts ask. */
export const getSession = cache(async () => {
  // Fast path: middleware already verified the user with the API a moment ago
  // and passed it on, signed. Only a value whose signature checks out is used.
  const signed = await verifyUser<AuthUser>(
    (await headers()).get(USER_HEADER),
    process.env.INTERNAL_AUTH_SECRET,
  );
  if (signed) return { user: signed };

  const res = await apiGet<{ user: AuthUser }>("/auth/me");
  return { user: res.body?.user ?? null };
});

/** Super Admin 2FA gate state, once per request. */
export const getAdminGate = cache(async () => {
  const res = await apiGet<{ ok: boolean; required: boolean }>(
    "/admin/auth/status",
  );
  return res.body;
});

/** Path + query of the page being rendered (set by middleware.ts). */
export async function currentPath(fallback = "/"): Promise<string> {
  const p = (await headers()).get("x-pathname");
  return p && p.startsWith("/") && !p.startsWith("//") ? p : fallback;
}

/** Returns the signed-in user, or redirects to `loginTarget`. */
export async function requireUser(loginTarget: string): Promise<AuthUser> {
  const { user } = await getSession();
  if (!user) redirect(loginTarget);
  return user;
}

/** A signed-in SELLER, or a redirect to login / the user's own area. */
export async function requireSeller(fallbackPath: string): Promise<AuthUser> {
  const path = await currentPath(fallbackPath);
  const me = await requireUser(`/login?next=${encodeURIComponent(path)}`);
  if (me.role !== "SELLER") redirect(me.role === "ADMIN" ? "/admin" : "/account");
  return me;
}

/** A signed-in ADMIN who has also passed the Super Admin 2FA gate. */
export async function requireAdmin(loginTarget = "/admin/login") {
  const me = await requireUser(loginTarget);
  if (me.role !== "ADMIN") redirect(loginTarget);
  const gate = await getAdminGate();
  if (!gate || (gate.required && !gate.ok)) redirect(loginTarget);
  return me;
}

