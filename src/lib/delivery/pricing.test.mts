import test from "node:test";
import assert from "node:assert/strict";
import {
  chargesFor,
  estimateBothZones,
  estimateDelivery,
  zoneFor,
  type PricingSettings,
} from "./pricing.ts";

const settings = (over: Partial<PricingSettings> = {}): PricingSettings => ({
  global: { insideDhaka: 60, outsideDhaka: 120 },
  products: {},
  freeDeliveryThreshold: 0,
  ...over,
});

test("only the Dhaka district is inside Dhaka", () => {
  assert.equal(zoneFor("Dhaka"), "inside_dhaka");
  assert.equal(zoneFor("  dhaka  "), "inside_dhaka");
  assert.equal(zoneFor("Dhaka District"), "inside_dhaka");
  assert.equal(zoneFor("ঢাকা"), "inside_dhaka");
  for (const d of ["Gazipur", "Narayanganj", "Madaripur", "Dhaka Division", "Chattogram", ""]) {
    assert.equal(zoneFor(d), "outside_dhaka", d);
  }
});

test("global charge applies when a product has no override", () => {
  const s = settings();
  assert.equal(estimateDelivery(s, "inside_dhaka", ["a"], 500).charge, 60);
  assert.equal(estimateDelivery(s, "outside_dhaka", ["a"], 500).charge, 120);
});

test("an override of 0 means free for that product, not 'use global'", () => {
  const s = settings({ products: { a: { insideDhaka: 0, outsideDhaka: 0 } } });
  assert.deepEqual(chargesFor(s, "a"), { insideDhaka: 0, outsideDhaka: 0 });
  assert.equal(estimateDelivery(s, "outside_dhaka", ["a"], 500).charge, 0);
});

test("one charge per order: the highest, never the sum", () => {
  const s = settings({ products: { heavy: { insideDhaka: 150, outsideDhaka: 300 } } });
  const e = estimateDelivery(s, "outside_dhaka", ["a", "b", "heavy", "a", "b"], 900);
  assert.equal(e.charge, 300);
  assert.equal(e.base, 300);
});

test("free-over waives the charge exactly at the threshold", () => {
  const s = settings({ freeDeliveryThreshold: 1000 });
  assert.equal(estimateDelivery(s, "outside_dhaka", ["a"], 999.99).charge, 120);
  const at = estimateDelivery(s, "outside_dhaka", ["a"], 1000);
  assert.equal(at.charge, 0);
  assert.equal(at.waived, true);
  assert.equal(at.base, 120);
});

test("a charge that was already 0 is not reported as waived", () => {
  const s = settings({
    global: { insideDhaka: 0, outsideDhaka: 0 },
    freeDeliveryThreshold: 100,
  });
  const e = estimateDelivery(s, "inside_dhaka", ["a"], 500);
  assert.equal(e.charge, 0);
  assert.equal(e.waived, false);
});

test("no settings or no products means free", () => {
  assert.equal(estimateDelivery(undefined, "outside_dhaka", ["a"], 10).charge, 0);
  assert.equal(estimateDelivery(settings(), "outside_dhaka", [], 10).charge, 0);
});

test("legacy-shaped settings (flat 60 + threshold) match the old rule", () => {
  const legacy = settings({
    global: { insideDhaka: 60, outsideDhaka: 60 },
    freeDeliveryThreshold: 1500,
  });
  for (const subtotal of [1, 1499, 1500, 9999]) {
    const old = subtotal >= 1500 ? 0 : 60;
    for (const zone of ["inside_dhaka", "outside_dhaka"] as const) {
      assert.equal(estimateDelivery(legacy, zone, ["a"], subtotal).charge, old);
    }
  }
});

test("estimateBothZones returns each zone", () => {
  const b = estimateBothZones(settings(), ["a"], 100);
  assert.equal(b.inside.charge, 60);
  assert.equal(b.outside.charge, 120);
});
