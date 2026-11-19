/**
 * Signed hand-off of the verified user from middleware.ts to server layouts.
 *
 * Why: middleware already asks the Go API who the visitor is. Without this,
 * the seller layout asks again on every page, one more backend round trip.
 *
 * Why it is signed: middleware.ts does not run for every path (its matcher
 * skips anything ending in a file extension, e.g. /seller/x/orders/1.png), so
 * a plain header could be sent by the visitor. A value is only trusted when its
 * HMAC verifies with INTERNAL_AUTH_SECRET, which only the server knows. If the
 * secret is unset or the value is missing, expired or forged, callers fall back
 * to asking the API, which is exactly the old behaviour.
 *
 * No "server-only" import: this also runs in the edge middleware.
 */

export const USER_HEADER = "x-sf-user";

/** The header only has to survive one internal hop. */
const MAX_AGE_MS = 30_000;
/** Keep well under typical 8 KB header limits; larger users just fall back. */
export const MAX_HEADER_CHARS = 4000;

const enc = new TextEncoder();
const dec = new TextDecoder();

function toB64u(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64u(str: string): Uint8Array<ArrayBuffer> {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function hmacKey(secret: string, usage: KeyUsage) {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage],
  );
}

/** Returns "<payload>.<signature>", or null when it would be too large. */
export async function signUser(
  user: unknown,
  secret: string,
  now = Date.now(),
): Promise<string | null> {
  const payload = toB64u(
    enc.encode(JSON.stringify({ u: user, e: now + MAX_AGE_MS })),
  );
  const key = await hmacKey(secret, "sign");
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, enc.encode(payload)),
  );
  const value = `${payload}.${toB64u(sig)}`;
  return value.length > MAX_HEADER_CHARS ? null : value;
}

/** The user inside a valid, unexpired value, otherwise null. Never throws. */
export async function verifyUser<T>(
  value: string | null | undefined,
  secret: string | undefined,
  now = Date.now(),
): Promise<T | null> {
  if (!value || !secret || value.length > MAX_HEADER_CHARS) return null;
  const parts = value.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  try {
    const key = await hmacKey(secret, "verify");
    // crypto.subtle.verify compares in constant time.
    const ok = await crypto.subtle.verify(
      "HMAC",
      key,
      fromB64u(parts[1]),
      enc.encode(parts[0]),
    );
    if (!ok) return null;
    const body = JSON.parse(dec.decode(fromB64u(parts[0]))) as {
      u?: T;
      e?: number;
    };
    if (typeof body.e !== "number" || body.e < now || !body.u) return null;
    return body.u;
  } catch {
    return null;
  }
}
