import { NextResponse, type NextRequest } from "next/server";
import { USER_HEADER, signUser } from "@/lib/internal-user";

/**
 * Access gate for /admin/* and /seller/*.
 *
 * This runs BEFORE any rendering, so a visitor who isn't allowed in is
 * redirected without the page's HTML, RSC payload or client-chunk URLs ever
 * being generated. (A layout can't do this job: Next renders a layout and its
 * page in parallel, so by the time a layout redirects, the page output is
 * already in the response.)
 *
 * The browser's cookies are forwarded to the Go API, which stays the single
 * source of truth for the user and role; we never read or guess cookie names.
 * If the short-lived access token has expired, we renew it here (middleware
 * may set cookies) and carry the new cookies on to the page.
 *
 * Fails closed: any API error or timeout sends the visitor to login.
 */

const API_BASE_URL = `${(process.env.API_INTERNAL_URL ?? "http://localhost:8080").replace(/\/+$/, "")}/api/v1`;
const ADMIN_LOGIN = "/admin/login";

type Role = "BUYER" | "SELLER" | "ADMIN";

async function callApi(
  path: string,
  cookie: string,
  method: "GET" | "POST" = "GET",
): Promise<Response | null> {
  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        Cookie: cookie,
        ...(method !== "GET" ? { "X-Requested-With": "fetch" } : {}),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    return null;
  }
}

/** Applies Set-Cookie lines from the API to a request Cookie header. */
function mergeCookies(cookieHeader: string, setCookies: string[]): string {
  const jar = new Map<string, string>();
  for (const part of cookieHeader.split(/;\s*/)) {
    const i = part.indexOf("=");
    if (i > 0) jar.set(part.slice(0, i), part.slice(i + 1));
  }
  for (const sc of setCookies) {
    const first = sc.split(";")[0];
    const i = first.indexOf("=");
    if (i <= 0) continue;
    const name = first.slice(0, i).trim();
    const value = first.slice(i + 1);
    if (value === "" || /;\s*max-age=0/i.test(sc)) jar.delete(name);
    else jar.set(name, value);
  }
  return Array.from(jar, ([k, v]) => `${k}=${v}`).join("; ");
}

async function accessGate(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const path = pathname + search;
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  // Pass the path on to server layouts (they can't read the URL themselves).
  const forward = (cookie?: string, signedUser?: string | null) => {
    const headers = new Headers(req.headers);
    headers.set("x-pathname", path);
    if (cookie !== undefined) headers.set("cookie", cookie);
    // Never let a value sent by the visitor through; only ours (signed below).
    headers.delete(USER_HEADER);
    if (signedUser) headers.set(USER_HEADER, signedUser);
    return NextResponse.next({ request: { headers } });
  };

  // The admin sign-in screen has to stay reachable without a session.
  if (pathname === ADMIN_LOGIN) return forward();

  const loginTarget = isAdmin
    ? ADMIN_LOGIN
    : `/login?next=${encodeURIComponent(path)}`;

  let newCookies: string[] = [];
  const finish = (res: NextResponse) => {
    for (const c of newCookies) res.headers.append("Set-Cookie", c);
    res.headers.set("Cache-Control", "no-store");
    return res;
  };
  const deny = (to: string) =>
    finish(NextResponse.redirect(new URL(to, req.nextUrl)));

  let cookie = req.headers.get("cookie");
  if (!cookie) return deny(loginTarget);

  let meRes = await callApi("/auth/me", cookie);
  if (meRes?.status === 401) {
    const refreshed = await callApi("/auth/refresh", cookie, "POST");
    if (!refreshed?.ok) return deny(loginTarget);
    newCookies = refreshed.headers.getSetCookie();
    cookie = mergeCookies(cookie, newCookies);
    meRes = await callApi("/auth/me", cookie);
  }
  if (!meRes?.ok) return deny(loginTarget);

  const me = (await meRes.json().catch(() => null)) as {
    user?: { role?: Role };
  } | null;
  const role = me?.user?.role;
  if (!role) return deny(loginTarget);

  if (isAdmin) {
    if (role !== "ADMIN") return deny(ADMIN_LOGIN);
    // Super Admin 2FA gate: a normal site login isn't enough.
    const gateRes = await callApi("/admin/auth/status", cookie);
    const gate = gateRes?.ok
      ? ((await gateRes.json().catch(() => null)) as {
          ok?: boolean;
          required?: boolean;
        } | null)
      : null;
    if (!gate || (gate.required && !gate.ok)) return deny(ADMIN_LOGIN);
  } else if (role !== "SELLER") {
    return deny(role === "ADMIN" ? "/admin" : "/account");
  }

  // Seller pages: hand the verified user to the layouts, signed, so they do
  // not ask the API again. Skipped (layouts fall back to the API) when
  // INTERNAL_AUTH_SECRET is unset.
  const secret = process.env.INTERNAL_AUTH_SECRET;
  const signed =
    !isAdmin && secret && me?.user ? await signUser(me.user, secret) : null;
  return finish(forward(cookie, signed));
}

/* ------------------------------------------------------------------ */
/* Custom domains                                                      */
/* ------------------------------------------------------------------ */

/**
 * A request whose Host is not one of the platform's own hosts is a seller's
 * own domain (mystore.com). We ask the Go API which store it belongs to and
 * rewrite the request to /store/<slug>/..., so the same app serves every
 * seller. Set PLATFORM_HOSTS (comma separated) to your own hosts, for example
 * "shopbd.xyz,vercel.app". localhost is always a platform host.
 */
const ALWAYS_PLATFORM = ["localhost", "127.0.0.1", "[::1]"];
const PLATFORM_HOSTS = (process.env.PLATFORM_HOSTS ?? "")
  .split(",")
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

/** Pages a buyer can use on a custom domain that live outside /store/<slug>. */
const SHARED_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/account",
  "/orders",
  "/session",
];

function hostOf(req: NextRequest): string {
  // The Host header is what the browser asked for. Caddy and Vercel keep it
  // unchanged, so there is no need to trust X-Forwarded-Host.
  return (req.headers.get("host") ?? "")
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");
}

function isPlatformHost(host: string): boolean {
  if (!host || ALWAYS_PLATFORM.includes(host)) return true;
  return PLATFORM_HOSTS.some((p) => host === p || host.endsWith(`.${p}`));
}

type Target = { slug: string; domain: string };
const CACHE_MS = 15_000;
const CACHE_MAX = 5000;
const targetCache = new Map<string, { t: Target | null; exp: number }>();

function remember(host: string, t: Target | null) {
  if (targetCache.size >= CACHE_MAX) targetCache.clear();
  targetCache.set(host, { t, exp: Date.now() + CACHE_MS });
}

/** Target store, null when the domain is not connected, undefined on error. */
async function resolveDomain(host: string): Promise<Target | null | undefined> {
  const hit = targetCache.get(host);
  if (hit && hit.exp > Date.now()) return hit.t;
  try {
    const res = await fetch(
      `${API_BASE_URL}/domain/resolve?host=${encodeURIComponent(host)}`,
      {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      },
    );
    if (res.status === 404) {
      remember(host, null);
      return null;
    }
    if (!res.ok) return undefined;
    const body = (await res.json()) as Partial<Target>;
    if (!body.slug || !body.domain) return undefined;
    const t = { slug: body.slug, domain: body.domain };
    remember(host, t);
    return t;
  } catch {
    return undefined;
  }
}

function plainPage(status: number, title: string, text: string) {
  return new NextResponse(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body style="margin:0;display:flex;min-height:100vh;align-items:center;justify-content:center;font-family:system-ui,sans-serif;background:#fafafa;color:#171717;text-align:center;padding:24px"><div><h1 style="font-size:22px;margin:0 0 8px">${title}</h1><p style="margin:0;color:#737373">${text}</p></div></body></html>`,
    {
      status,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    },
  );
}

async function customDomain(req: NextRequest, host: string) {
  const { pathname, search } = req.nextUrl;

  const target = await resolveDomain(host);
  if (target === undefined) {
    return plainPage(503, "Store unavailable", "Please try again in a moment.");
  }
  if (target === null) {
    return plainPage(
      404,
      "This domain is not connected to a store",
      "If this is your domain, finish connecting it in your ShopBD seller settings.",
    );
  }

  // www.mystore.com -> mystore.com (the canonical host the API reports).
  if (host !== target.domain) {
    const proto =
      req.headers.get("x-forwarded-proto")?.split(",")[0].trim() ||
      req.nextUrl.protocol.replace(":", "");
    const port = (req.headers.get("host") ?? "").match(/:(\d+)$/)?.[1];
    return NextResponse.redirect(
      `${proto}://${target.domain}${port ? `:${port}` : ""}${pathname}${search}`,
      308,
    );
  }

  // The seller dashboard and admin only live on the platform's own host.
  if (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/seller" ||
    pathname.startsWith("/seller/")
  ) {
    return plainPage(404, "Page not found", "This page does not exist.");
  }

  const storePrefix = `/store/${target.slug}`;
  // In-app links still point at /store/<slug>/...: let them through.
  if (pathname === storePrefix || pathname.startsWith(`${storePrefix}/`)) {
    return NextResponse.next();
  }
  // Another seller's store must never open on this domain.
  if (pathname.startsWith("/store/")) {
    return plainPage(404, "Page not found", "This page does not exist.");
  }
  if (SHARED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = pathname === "/" ? storePrefix : `${storePrefix}${pathname}`;
  return NextResponse.rewrite(url);
}

export async function middleware(req: NextRequest) {
  const host = hostOf(req);
  if (!isPlatformHost(host)) return customDomain(req, host);

  const { pathname } = req.nextUrl;
  const gated =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/seller" ||
    pathname.startsWith("/seller/");
  if (!gated) return NextResponse.next();
  return accessGate(req);
}

export const config = {
  // Everything except the API, Next internals and files with an extension.
  matcher: ["/((?!api/|_next/|_vercel/|.*\\.[a-zA-Z0-9]+$).*)"],
};