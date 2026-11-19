import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_CHARGE,
  chargeLabel,
  chargeToInput,
  cleanAmountInput,
  parseCharge,
} from "./charges.ts";

const ok = (s: string) => {
  const r = parseCharge(s);
  assert.equal(r.ok, true, `expected "${s}" to be valid`);
  return r.ok ? r.value : NaN;
};
const bad = (s: string) =>
  assert.equal(parseCharge(s).ok, false, `expected "${s}" to be invalid`);

test("zero is a real value (free delivery)", () => {
  assert.equal(ok("0"), 0);
  assert.equal(ok("0.00"), 0);
});

test("normal amounts", () => {
  assert.equal(ok("60"), 60);
  assert.equal(ok(" 120 "), 120);
  assert.equal(ok("49.5"), 49.5);
  assert.equal(ok(".5"), 0.5);
  assert.equal(ok("1,000"), 1000);
  assert.equal(ok("৳150"), 150);
});

test("Bangla digits are understood", () => {
  assert.equal(cleanAmountInput("৬০"), "60");
  assert.equal(ok("১২০"), 120);
  assert.equal(ok("৳৮০.৫"), 80.5);
});

test("limits", () => {
  assert.equal(ok(String(MAX_CHARGE)), MAX_CHARGE);
  bad(String(MAX_CHARGE + 1));
  bad("99999999");
});

test("rejects empty, negative, letters and extra decimals", () => {
  bad("");
  bad("   ");
  bad("-5");
  bad("abc");
  bad("12abc");
  bad("1e3");
  bad("1.234");
  bad("1.2.3");
  bad(".");
  bad("NaN");
  bad("Infinity");
});

test("formatting", () => {
  assert.equal(chargeLabel(0), "Free");
  assert.equal(chargeLabel(60), "৳60");
  assert.equal(chargeLabel(1200), "৳1,200");
  assert.equal(chargeToInput(0), "0");
  assert.equal(chargeToInput(49.5), "49.5");
});
