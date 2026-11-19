import { NextResponse, type NextRequest } from "next/server";

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
 *
 * Expired login: the API only accepts the refresh cookie on /api/v1/auth/*, so
 * the browser never sends it with a page request. We can't renew here. Instead
 * we send the visitor to /session/renew, a tiny page that calls
 * /api/v1/auth/refresh from the browser and then returns them here.
 *
 * Fails closed: any API error or timeout sends the visitor to login.
 */

const API_BASE_URL = `${(process.env.API_INTERNAL_URL ?? "http://localhost:8080").replace(/\/+$/, "")}/api/v1`;
const ADMIN_LOGIN = "/admin/login";

type Role = "BUYER" | "SELLER" | "ADMIN";

async function callApi(path: string, cookie: string): Promise<Response | null> {
  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      headers: { Accept: "application/json", Cookie: cookie },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const path = pathname + search;
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  // Pass the path on to server layouts (they can't read the URL themselves).
  const forward = () => {
    const headers = new Headers(req.headers);
    headers.set("x-pathname", path);
    const res = NextResponse.next({ request: { headers } });
    res.headers.set("Cache-Control", "no-store");
    return res;
  };

  // The admin sign-in screen has to stay reachable without a session.
  if (pathname === ADMIN_LOGIN) return forward();

  const loginTarget = isAdmin
    ? ADMIN_LOGIN
    : `/login?next=${encodeURIComponent(path)}`;

  const redirect = (to: string) => {
    const res = NextResponse.redirect(new URL(to, req.nextUrl));
    res.headers.set("Cache-Control", "no-store");
    return res;
  };
  // Not signed in (or the access token expired and the browser dropped it):
  // let the renew page try the refresh cookie, then fall back to login.
  const renew = () =>
    redirect(
      `/session/renew?next=${encodeURIComponent(path)}&to=${encodeURIComponent(loginTarget)}`,
    );

  const cookie = req.headers.get("cookie");
  if (!cookie) return renew();

  const meRes = await callApi("/auth/me", cookie);
  if (meRes?.status === 401) return renew();
  if (!meRes?.ok) return redirect(loginTarget);

  const me = (await meRes.json().catch(() => null)) as {
    user?: { role?: Role };
  } | null;
  const role = me?.user?.role;
  if (!role) return redirect(loginTarget);

  if (isAdmin) {
    if (role !== "ADMIN") return redirect(ADMIN_LOGIN);
    // Super Admin 2FA gate: a normal site login isn't enough.
    const gateRes = await callApi("/admin/auth/status", cookie);
    const gate = gateRes?.ok
      ? ((await gateRes.json().catch(() => null)) as {
          ok?: boolean;
          required?: boolean;
        } | null)
      : null;
    if (!gate || (gate.required && !gate.ok)) return redirect(ADMIN_LOGIN);
  } else if (role !== "SELLER") {
    return redirect(role === "ADMIN" ? "/admin" : "/account");
  }

  return forward();
}

export const config = {
  matcher: ["/admin/:path*", "/seller/:path*"],
};
