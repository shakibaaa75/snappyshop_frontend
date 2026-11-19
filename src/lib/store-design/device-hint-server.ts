import "server-only";
import { headers } from "next/headers";

export async function getMobileHint(): Promise<boolean> {
  const h = await headers();
  const ch = h.get("sec-ch-ua-mobile");
  if (ch) return ch === "?1";
  const ua = h.get("user-agent") ?? "";
  return /Android|iPhone|iPod|iPad|Mobile/i.test(ua);
}