"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/http";
const input = "w-full rounded-xl border bg-background px-3 py-2 text-sm";
const secondary =
  "rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50";
const primary =
  "rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50";
type SellerRow = {
  id: string;
  reply?: string;
  revision: number;
  status: string;
};
export function SellerActions({ review }: { review: SellerRow }) {
  const cache = useQueryClient();
  const [mode, setMode] = useState<"reply" | "report" | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  async function apply(action: "reply" | "report") {
    setBusy(true);
    setNotice("");
    try {
      await apiFetch("/seller/reviews/" + review.id, {
        method: "POST",
        body: {
          action,
          text,
          revision: review.revision,
        },
      });
      await cache.invalidateQueries({ queryKey: ["reviews"] });
      setMode(null);
      setNotice(
        {
          reply: "Reply saved.",
          report: "Report submitted.",
        }[action],
      );
    } catch (error) {
      setNotice((error as Error).message);
      await cache.invalidateQueries({ queryKey: ["reviews"] });
    } finally {
      setBusy(false);
    }
  }
  return (
    <fieldset disabled={busy} className="mt-4 min-w-0 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={secondary}
          onClick={() => {
            setMode("reply");
            setText(review.reply ?? "");
            setNotice("");
          }}
        >
          {review.reply ? "Edit reply" : "Reply to buyer"}
        </button>
        <button
          type="button"
          className={secondary}
          onClick={() => {
            setMode("report");
            setText("");
            setNotice("");
          }}
        >
          Report
        </button>
      </div>
      {mode && (
        <form
          className="grid gap-2 rounded-xl bg-muted p-3"
          onSubmit={(e) => {
            e.preventDefault();
            void apply(mode);
          }}
        >
          <label className="text-sm font-semibold">
            {mode === "reply" ? "Your reply" : "Reason for reporting"}
            <textarea
              required
              rows={3}
              maxLength={1000}
              className={input}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </label>
          <div className="flex gap-2">
            <button disabled={!text.trim() || busy} className={primary}>
              {mode === "reply" ? "Save reply" : "Submit report"}
            </button>
            <button
              type="button"
              className={secondary}
              onClick={() => setMode(null)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      {notice && (
        <p role="status" className="text-sm">
          {notice}
        </p>
      )}
    </fieldset>
  );
}
