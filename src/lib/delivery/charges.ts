/**
 * Pure helpers for the Delivery Settings form: reading what a seller typed,
 * checking it against the same rule the API enforces, and formatting amounts.
 * No imports, so it is trivial to test.
 */

/** Largest charge the API accepts (BDT). Keep in sync with delivery.MaxCharge in Go. */
export const MAX_CHARGE = 10000;

export type ChargeResult =
  | { ok: true; value: number }
  | { ok: false; error: string };

const BANGLA_DIGITS = "০১২৩৪৫৬৭৮৯";

/**
 * Cleans what was typed into a money box: Bangla digits become 0-9, and the
 * taka sign, spaces and thousands commas are dropped.
 */
export function cleanAmountInput(raw: string): string {
  let out = "";
  for (const ch of raw) {
    const bn = BANGLA_DIGITS.indexOf(ch);
    if (bn >= 0) out += String(bn);
    else if (ch === "৳" || ch === "," || /\s/.test(ch)) continue;
    else out += ch;
  }
  return out;
}

/** Reads a typed amount. Empty is an error: "0" is how a seller says "free". */
export function parseCharge(raw: string): ChargeResult {
  const s = cleanAmountInput(raw);
  if (s === "") {
    return { ok: false, error: "Enter an amount, or 0 for free delivery" };
  }
  if (!/^(\d+(\.\d{0,2})?|\.\d{1,2})$/.test(s)) {
    return {
      ok: false,
      error: "Use numbers only, with at most 2 decimal places",
    };
  }
  const value = Number(s);
  if (!Number.isFinite(value) || value > MAX_CHARGE) {
    return {
      ok: false,
      error: `Enter an amount from 0 to ${MAX_CHARGE.toLocaleString("en-US")}`,
    };
  }
  return { ok: true, value };
}

/** A number as it should appear in a money box ("60", "49.5"). */
export function chargeToInput(n: number): string {
  return Number.isFinite(n) ? String(n) : "";
}

/** "Free" for 0, otherwise "৳60". */
export function chargeLabel(n: number): string {
  return n === 0 ? "Free" : `৳${n.toLocaleString("en-US")}`;
}
