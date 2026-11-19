"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { ApiError } from "@/lib/api/http";
import { sellerTracking, type TrackingSettings } from "@/lib/api/analytics";
import { cn } from "@/lib/utils";
import { Panel } from "./analytics-ui";
import { LockBadge, UpgradeNotice } from "./plan-lock";
import { useEntitlements } from "@/lib/query/entitlements";

const META_RE = /^\d{8,20}$/;
const TIKTOK_RE = /^[A-Z0-9]{10,32}$/;

export const TRACKING_QUERY_KEY = ["seller", "tracking-settings"] as const;

function checkMeta(v: string) {
  const id = v.trim();
  return id === "" || META_RE.test(id)
    ? ""
    : "A Meta Pixel ID is 8 to 20 digits (numbers only).";
}
function checkTikTok(v: string) {
  const id = v.trim().toUpperCase();
  return id === "" || TIKTOK_RE.test(id)
    ? ""
    : "A TikTok Pixel ID is 10 to 32 letters and numbers.";
}

function StatusChip({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] font-medium",
        on
          ? "bg-emerald-100 text-emerald-700"
          : "bg-muted text-muted-foreground",
      )}
    >
      {on ? "Active" : "Not connected"}
    </span>
  );
}

/** Pixel IDs + privacy settings for the seller's own store. */
export function TrackingSettingsPanel() {
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: TRACKING_QUERY_KEY,
    queryFn: sellerTracking.get,
  });

  // Locked integrations: inputs are disabled here, and the server refuses them
  // too. A locked pixel is always sent as empty, which removes it.
  const { entitlements } = useEntitlements();
  const metaLocked = !entitlements.metaPixel;
  const tiktokLocked = !entitlements.pyxel;

  const [meta, setMeta] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [consent, setConsent] = useState(true);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  // Fill the form when the saved settings arrive.
  useEffect(() => {
    if (!data) return;
    setMeta(data.metaPixelId);
    setTiktok(data.tiktokPixelId);
    setConsent(data.requireConsent);
  }, [data]);

  const save = useMutation({
    mutationFn: (s: TrackingSettings) => sellerTracking.save(s),
    onSuccess: (s) => {
      qc.setQueryData(TRACKING_QUERY_KEY, s);
      setServerErrors({});
      setSaved(true);
    },
    onError: (err) => {
      setSaved(false);
      setServerErrors(
        err instanceof ApiError && Object.keys(err.fields).length > 0
          ? err.fields
          : {
              form:
                err instanceof ApiError
                  ? err.message
                  : "Could not save. Please try again.",
            },
      );
    },
  });

  const metaErr = metaLocked
    ? ""
    : checkMeta(meta) || serverErrors.metaPixelId || "";
  const tiktokErr = tiktokLocked
    ? ""
    : checkTikTok(tiktok) || serverErrors.tiktokPixelId || "";
  const dirty =
    !!data &&
    ((!metaLocked && meta.trim() !== data.metaPixelId) ||
      (!tiktokLocked && tiktok.trim().toUpperCase() !== data.tiktokPixelId) ||
      consent !== data.requireConsent);
  const lockedButSaved =
    (metaLocked && !!data?.metaPixelId) ||
    (tiktokLocked && !!data?.tiktokPixelId);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      (!metaLocked && checkMeta(meta)) ||
      (!tiktokLocked && checkTikTok(tiktok))
    )
      return;
    setSaved(false);
    save.mutate({
      metaPixelId: metaLocked ? "" : meta.trim(),
      tiktokPixelId: tiktokLocked ? "" : tiktok.trim().toUpperCase(),
      requireConsent: consent,
    });
  }

  return (
    <Panel
      id="tracking"
      title="Ad pixels and privacy"
      sub="Connect your own Meta and TikTok pixels. They only ever run on your store."
    >
      {isLoading ? (
        <div className="flex items-center py-6 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : isError ? (
        <p className="py-6 text-sm text-red-600">
          Could not load your tracking settings.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          {(metaLocked || tiktokLocked) && (
            <UpgradeNotice title="Ad pixels are locked on your plan">
              Meta Pixel and Pyxel (TikTok Pixel) are available on Pro and
              Business.
              {lockedButSaved &&
                " A pixel you saved earlier is switched off, and it is removed the next time you save here."}
            </UpgradeNotice>
          )}
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="meta-pixel" className="text-sm font-medium">
                  Meta (Facebook) Pixel ID
                </label>
                {metaLocked ? (
                  <LockBadge label="Locked" />
                ) : (
                  <StatusChip on={!!data?.metaPixelId} />
                )}
              </div>
              <input
                id="meta-pixel"
                inputMode="numeric"
                autoComplete="off"
                value={metaLocked ? "" : meta}
                disabled={metaLocked}
                onChange={(e) => {
                  setMeta(e.target.value);
                  setSaved(false);
                }}
                placeholder={
                  metaLocked
                    ? "Locked: upgrade to use Meta Pixel"
                    : "e.g. 123456789012345"
                }
                aria-invalid={!!metaErr}
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              />
              {metaErr ? (
                <p className="mt-1 text-xs text-red-600">{metaErr}</p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">
                  Meta Events Manager → Data sources → your pixel → the number
                  under its name.
                </p>
              )}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="tiktok-pixel" className="text-sm font-medium">
                  TikTok Pixel ID (Pyxel)
                </label>
                {tiktokLocked ? (
                  <LockBadge label="Locked" />
                ) : (
                  <StatusChip on={!!data?.tiktokPixelId} />
                )}
              </div>
              <input
                id="tiktok-pixel"
                autoComplete="off"
                autoCapitalize="characters"
                value={tiktokLocked ? "" : tiktok}
                disabled={tiktokLocked}
                onChange={(e) => {
                  setTiktok(e.target.value);
                  setSaved(false);
                }}
                placeholder={
                  tiktokLocked
                    ? "Locked: upgrade to use Pyxel"
                    : "e.g. C4ABC123DEF456GHI789"
                }
                aria-invalid={!!tiktokErr}
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm uppercase disabled:cursor-not-allowed disabled:opacity-60"
              />
              {tiktokErr ? (
                <p className="mt-1 text-xs text-red-600">{tiktokErr}</p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">
                  TikTok Ads Manager → Assets → Events → your pixel → Pixel ID.
                </p>
              )}
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-muted/50 p-3">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                setSaved(false);
              }}
              className="mt-0.5 h-4 w-4"
            />
            <span className="text-sm">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Ask visitors for consent (recommended)
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Shows a banner on your store. Meta and TikTok only load, and
                repeat visitors are only recognised, after a visitor presses
                Accept. If you turn this off, pixels load for everyone, so you
                are responsible for following the privacy laws in the countries
                you sell to. Visitors whose browser sends a Do Not Track or
                Global Privacy Control signal are never tracked either way.
              </span>
            </span>
          </label>

          {serverErrors.form && (
            <p className="text-sm text-red-600">{serverErrors.form}</p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={save.isPending || !dirty || !!metaErr || !!tiktokErr}
              className="inline-flex items-center rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background disabled:opacity-50"
            >
              {save.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save settings
            </button>
            {saved && (
              <span className="inline-flex items-center gap-1 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> Saved. Changes apply to
                your live store right away.
              </span>
            )}
          </div>

          <div className="rounded-xl border p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">
              What gets sent to your pixels
            </p>
            <p className="mt-1">
              Page views, product views, product clicks, add to cart, checkout
              started and purchases (order value and product IDs). Customer
              names, phone numbers and addresses are never sent. To check it
              works, open your store, accept the banner and use Meta Pixel
              Helper or TikTok Pixel Helper.
            </p>
          </div>
        </form>
      )}
    </Panel>
  );
}
