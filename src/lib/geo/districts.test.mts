import test from "node:test";
import assert from "node:assert/strict";
import { ALL_DISTRICTS, canonicalDistrict } from "./districts.ts";
import { zoneFor } from "../delivery/pricing.ts";

test("there are 64 districts and Dhaka is one of them", () => {
  assert.equal(ALL_DISTRICTS.length, 64);
  assert.equal(new Set(ALL_DISTRICTS).size, 64);
  assert.ok(ALL_DISTRICTS.includes("Dhaka"));
});

test("canonicalDistrict fixes case and rejects non-districts", () => {
  assert.equal(canonicalDistrict("  dhaka "), "Dhaka");
  assert.equal(canonicalDistrict("Dhaka City"), "");
  assert.equal(canonicalDistrict("Mirpur"), "");
});

test("exactly one official district is inside Dhaka", () => {
  const inside = ALL_DISTRICTS.filter((d) => zoneFor(d) === "inside_dhaka");
  assert.deepEqual(inside, ["Dhaka"]);
});
