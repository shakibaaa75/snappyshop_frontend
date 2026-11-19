"use client";

import { type StoreDesign } from "@/lib/store-design/types";
import {
  Panel,
  SelectField,
  TextAreaField,
  TextField,
  ToggleRow,
} from "../controls";
import { type PanelProps } from "./types";

export function ContactPanel({ design, update }: PanelProps) {
  return (
    <div className="space-y-5">
      <Panel
        title="Contact page"
        description="Choose the layout and introduction for your Contact us page."
      >
        <SelectField
          label="Page layout"
          value={design.contactLayout || "split"}
          onChange={(value) =>
            update({ contactLayout: value as StoreDesign["contactLayout"] })
          }
          options={[
            { value: "split", label: "Split — form and contact details" },
            { value: "stacked", label: "Stacked — form above details" },
            { value: "details", label: "Details only — direct contact links" },
          ]}
        />
        <TextField
          label="Page heading"
          value={design.contactTitle || ""}
          onChange={(value) => update({ contactTitle: value })}
          placeholder="Contact us"
          maxLength={120}
        />
        <TextAreaField
          label="Introduction"
          value={design.contactIntro || ""}
          onChange={(value) => update({ contactIntro: value })}
          rows={3}
          maxLength={1000}
        />
        <ToggleRow
          label="Show message form"
          checked={design.contactShowForm !== false}
          onChange={(value) => update({ contactShowForm: value })}
          description="Uses your existing email or WhatsApp. Details-only layout hides the form."
        />
      </Panel>

      <Panel
        title="Customer support"
        description="Where shoppers can reach you."
      >
        <ToggleRow
          label="Show contact details"
          description="Shown in your footer."
          checked={design.showContactInfo}
          onChange={(v) => update({ showContactInfo: v })}
        />
        <TextField
          label="Support email"
          type="email"
          inputMode="email"
          value={design.supportEmail}
          onChange={(v) => update({ supportEmail: v })}
          placeholder="hello@yourstore.com"
        />
        <TextField
          label="Phone number"
          inputMode="tel"
          value={design.supportPhone}
          onChange={(v) => update({ supportPhone: v })}
          placeholder="+880 1XXX-XXXXXX"
        />
        <TextField
          label="Address"
          value={design.address}
          onChange={(v) => update({ address: v })}
          placeholder="Chattogram, Bangladesh"
        />
        <TextField
          label="Opening hours"
          value={design.businessHours}
          onChange={(v) => update({ businessHours: v })}
          placeholder="Sat to Thu, 10am to 8pm"
        />
      </Panel>

      <Panel title="Social profiles">
        <ToggleRow
          label="Show social links"
          checked={design.showSocialLinks}
          onChange={(v) => update({ showSocialLinks: v })}
        />
        <TextField
          label="Facebook page"
          inputMode="url"
          value={design.facebookUrl}
          onChange={(v) => update({ facebookUrl: v })}
          placeholder="https://facebook.com/yourstore"
        />
        <TextField
          label="Instagram profile"
          inputMode="url"
          value={design.instagramUrl}
          onChange={(v) => update({ instagramUrl: v })}
          placeholder="https://instagram.com/yourstore"
        />
        <TextField
          label="YouTube channel"
          inputMode="url"
          value={design.youtubeUrl}
          onChange={(v) => update({ youtubeUrl: v })}
          placeholder="https://youtube.com/@yourstore"
        />
      </Panel>
    </div>
  );
}
