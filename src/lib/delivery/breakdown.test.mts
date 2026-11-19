import test from "node:test";
import assert from "node:assert/strict";
import {
  deliveryRow,
  deliveryRowText,
  discountRow,
  zoneLabel,
} from "./breakdown.ts";

const fmt = (n: number) => `৳${n}`;

test("old orders (no zone) print a plain Delivery row", () => {
  assert.deepEqual(deliveryRow({ delivery: 60 }, fmt), {
    label: "Delivery",
    value: "৳60",
  });
  assert.equal(deliveryRow({ delivery: 0 }, fmt).value, "Free");
});

test("the zone is named in the label", () => {
  assert.equal(
    deliveryRow({ delivery: 120, deliveryZone: "outside_dhaka" }, fmt).label,
    "Delivery (Outside Dhaka)",
  );
  assert.equal(zoneLabel("inside_dhaka"), "Inside Dhaka");
  assert.equal(zoneLabel(""), "");
  assert.equal(zoneLabel("mars"), "");
});

test("a waived charge shows what it was", () => {
  const r = deliveryRow(
    {
      delivery: 0,
      deliveryZone: "outside_dhaka",
      deliveryBase: 120,
      deliveryWaived: true,
    },
    fmt,
  );
  assert.equal(r.value, "Free");
  assert.equal(r.was, "৳120");
  assert.equal(deliveryRowText(r), "৳120 → Free");
});

test("not waived: no 'was'", () => {
  const r = deliveryRow(
    { delivery: 60, deliveryZone: "inside_dhaka", deliveryBase: 60 },
    fmt,
  );
  assert.equal(r.was, undefined);
  assert.equal(deliveryRowText(r), "৳60");
});

test("discount row only when there is a discount", () => {
  assert.equal(discountRow({ delivery: 0 }, fmt), null);
  assert.equal(discountRow({ delivery: 0, discount: 0 }, fmt), null);
  assert.deepEqual(discountRow({ delivery: 0, discount: 50 }, fmt), {
    label: "Discount",
    value: "−৳50",
  });
});
