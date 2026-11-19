"use client";

import { type StoreDesign } from "@/lib/store-design/types";
import {
  ImageField,
  Panel,
  SelectField,
  TextAreaField,
  TextField,
} from "../controls";
import { type PanelProps } from "./types";

/* ------------------------------------------------------------------ */
/* Contact                                                             */
/* ------------------------------------------------------------------ */

export function AboutPanel({ design, update }: PanelProps) {
  return (
    <div className="space-y-5">
      <Panel
        title="About page"
        description="Edit the full About us page. Your preview updates as you type."
      >
        <SelectField
          label="Page layout"
          value={design.aboutLayout || "split"}
          onChange={(value) =>
            update({ aboutLayout: value as StoreDesign["aboutLayout"] })
          }
          options={[
            { value: "split", label: "Split — introduction and image" },
            { value: "editorial", label: "Editorial — story first" },
            { value: "centered", label: "Centered — compact brand story" },
          ]}
        />
        <TextField
          label="Page heading"
          value={design.aboutTitle || ""}
          onChange={(value) => update({ aboutTitle: value })}
          placeholder={`About ${design.storeName}`}
          maxLength={120}
        />
        <TextAreaField
          label="Your story"
          value={design.aboutText || ""}
          onChange={(value) => update({ aboutText: value })}
          rows={8}
          maxLength={6000}
          hint="Leave blank to use your existing story or store description."
        />
        <ImageField
          label="About page image"
          value={design.aboutImageUrl || ""}
          onChange={(value) => update({ aboutImageUrl: value })}
          hint="Leave empty to use your store logo."
        />
      </Panel>
    </div>
  );
}
