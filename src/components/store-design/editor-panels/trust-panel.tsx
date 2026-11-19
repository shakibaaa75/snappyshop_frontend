"use client";

import { Notice, Panel, TextAreaField, ToggleRow } from "../controls";
import { type PanelProps } from "./types";

/* ------------------------------------------------------------------ */
/* Trust                                                               */
/* ------------------------------------------------------------------ */

export function TrustPanel({ design, update, verified }: PanelProps) {
  return (
    <div className="space-y-5">
      <Panel
        title="Trust signals"
        description="Small details that help shoppers feel safe buying from you."
      >
        <ToggleRow
          label="Verified seller badge"
          description={
            verified
              ? "Your identity has been checked by ShopBD."
              : "Available after ShopBD verifies your identity."
          }
          checked={design.showVerifiedBadge && verified}
          onChange={(v) => update({ showVerifiedBadge: v })}
          disabled={!verified}
        />
        <ToggleRow
          label="Return policy"
          checked={design.showReturnPolicy}
          onChange={(v) => update({ showReturnPolicy: v })}
        />
        {design.showReturnPolicy && (
          <TextAreaField
            label="Return policy text"
            value={design.returnPolicy}
            onChange={(v) => update({ returnPolicy: v })}
            rows={3}
            maxLength={160}
          />
        )}
        <ToggleRow
          label="Payment method badges"
          description="Shows the payment methods you accept in the trust bar and footer."
          checked={design.showPaymentBadges}
          onChange={(v) => update({ showPaymentBadges: v })}
        />
      </Panel>
      <Notice tone="warning">
        Only promise what you can deliver. Verification and review counts come
        from ShopBD records, and your return policy applies to every order.
      </Notice>
    </div>
  );
}
