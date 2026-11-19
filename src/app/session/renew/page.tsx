"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api/http";

/**
 * Renews an expired login for a protected page.
 *
 * middleware.ts sends visitors here when the short-lived access token is gone.
 * The refresh cookie is only sent to /api/v1/auth/*, so the renewal has to be
 * made by the browser, not by the server. On success we go back to the page
 * the visitor wanted (a full load, so middleware checks again with the new
 * cookies); otherwise to the login page.
 */

const TRIED_KEY = "session-renew-at";

/** Same-site relative paths only, so this can never redirect to another site. */
function safePath(value: string | null, fallback: string): string {
  if (!value || !value.startsWith("/") || value.startsWith("//"))
    return fallback;
  if (value.includes("\\") || /[\r\n]/.test(value)) return fallback;
  return value;
}

export default function SessionRenewPage() {
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const next = safePath(q.get("next"), "/");
    const to = safePath(q.get("to"), "/login");

    // Loop guard: one attempt per 15 seconds. If we're back so soon, the
    // renewed login didn't help, so stop and show the login page.
    let recent = false;
    try {
      const last = Number(sessionStorage.getItem(TRIED_KEY) ?? 0);
      recent = Date.now() - last < 15_000;
      if (!recent) sessionStorage.setItem(TRIED_KEY, String(Date.now()));
    } catch {
      // Storage blocked: fall through and try once.
    }
    if (recent) {
      window.location.replace(to);
      return;
    }

    apiFetch("/auth/refresh", { method: "POST", skipRefresh: true })
      .then(() => window.location.replace(next))
      .catch(() => window.location.replace(to));
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center gap-2 text-sm text-neutral-500">
      <Loader2 className="h-4 w-4 animate-spin" /> Checking your session…
    </div>
  );
}
