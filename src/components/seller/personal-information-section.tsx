"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { personalApi, type PersonalInfo } from "@/lib/api/personal";
import { qk } from "@/lib/query/keys";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  SettingsCard,
  SettingsInfoRow,
  SettingsPageHeader,
} from "./settings-ui";
import { getSection } from "./settings-nav";
import { AvatarEditor } from "./personal/avatar-editor";
import { ChangePanel } from "./personal/change-panel";
import { EmailVerifyCodePanel } from "./personal/email-verify-panel";

function memberSince(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        ok ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900",
      )}
    >
      {ok ? (
        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
      ) : (
        <TriangleAlert className="h-3 w-3" aria-hidden="true" />
      )}
      {ok ? "Verified" : "Not verified"}
    </span>
  );
}

type Open = "email-change" | "email-verify" | "phone-change" | null;

function Row({
  label,
  children,
  actions,
  panel,
}: {
  label: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  panel?: React.ReactNode;
}) {
  return (
    <li className="py-3.5">
      <div className="grid gap-1 sm:grid-cols-[11rem_minmax(0,1fr)_auto] sm:items-center sm:gap-4">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium">
          {children}
        </div>
        {actions && <div className="flex gap-2 pt-1 sm:pt-0">{actions}</div>}
      </div>
      {panel}
    </li>
  );
}

/**
 * Seller Settings > Personal information: the owner's private name, email,
 * phone and picture. The public store contact (store phone, WhatsApp) is
 * edited in Store design and is never shown or changed here.
 */
export function PersonalInformationSection() {
  const section = getSection("personal-information")!;
  const qc = useQueryClient();
  const [open, setOpen] = useState<Open>(null);
  const [flash, setFlash] = useState("");

  const personal = useQuery({
    queryKey: qk.seller.personal,
    queryFn: personalApi.get,
    staleTime: 30_000,
    retry: false,
  });
  // Same key as the seller shell: account type, store address, join date.
  const me = useQuery({
    queryKey: qk.auth.me,
    queryFn: authApi.me,
    staleTime: 30_000,
    retry: false,
  });

  const p = personal.data;

  const save = (next: PersonalInfo, message?: string) => {
    qc.setQueryData(qk.seller.personal, next);
    // The shell and other pages read the account email from /auth/me.
    void qc.invalidateQueries({ queryKey: qk.auth.me });
    setOpen(null);
    setFlash(message ?? "");
  };

  const toggle = (which: Exclude<Open, null>) => {
    setFlash("");
    setOpen((cur) => (cur === which ? null : which));
  };

  return (
    <>
      <SettingsPageHeader
        title={section.label}
        description={section.description}
      />

      <SettingsCard>
        {personal.isLoading ? (
          <div className="space-y-4" aria-busy="true">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-5 w-3/4" />
          </div>
        ) : personal.isError || !p ? (
          <div role="alert" className="space-y-3 text-sm">
            <p>We couldn't load your personal information.</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void personal.refetch()}
            >
              Try again
            </Button>
          </div>
        ) : (
          <>
            <AvatarEditor
              name={p.name}
              avatarUrl={p.avatarUrl}
              onChange={(next) => save(next, "Profile picture updated.")}
            />

            <ul className="divide-y divide-border">
              <Row label="Full name">{p.name || "-"}</Row>

              <Row
                label="Email"
                actions={
                  <>
                    {!p.emailVerified && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!p.availability.email}
                        aria-expanded={open === "email-verify"}
                        onClick={() => toggle("email-verify")}
                      >
                        Verify
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!p.availability.email}
                      aria-expanded={open === "email-change"}
                      onClick={() => toggle("email-change")}
                    >
                      Change
                    </Button>
                  </>
                }
                panel={
                  <>
                    {!p.availability.email && (
                      <Unavailable>
                        Email verification isn't available right now, so the
                        email can't be changed or verified yet. Please try again
                        later.
                      </Unavailable>
                    )}
                    {open === "email-change" && (
                      <ChangePanel
                        channel="email"
                        hasPassword={p.hasPassword}
                        onCancel={() => setOpen(null)}
                        onDone={(next) =>
                          save(
                            next,
                            "Email updated. We've also let your previous address know.",
                          )
                        }
                      />
                    )}
                    {open === "email-verify" && (
                      <EmailVerifyCodePanel
                        email={p.email}
                        onCancel={() => setOpen(null)}
                        onDone={(next) => save(next, "Email verified.")}
                      />
                    )}
                  </>
                }
              >
                <span className="min-w-0 break-all">{p.email}</span>
                <StatusBadge ok={p.emailVerified} />
              </Row>

              <Row
                label="Phone"
                actions={
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!p.availability.phone}
                    aria-expanded={open === "phone-change"}
                    onClick={() => toggle("phone-change")}
                  >
                    {p.phone ? "Change" : "Add"}
                  </Button>
                }
                panel={
                  <>
                    {!p.availability.phone && (
                      <Unavailable>
                        Phone verification isn't available right now, so the
                        phone number can't be changed yet. Please try again
                        later.
                      </Unavailable>
                    )}
                    {open === "phone-change" && (
                      <ChangePanel
                        channel="phone"
                        hasPassword={p.hasPassword}
                        onCancel={() => setOpen(null)}
                        onDone={(next) =>
                          save(next, "Phone number verified and saved.")
                        }
                      />
                    )}
                  </>
                }
              >
                {p.phone ? (
                  <>
                    <span>{p.phone}</span>
                    <StatusBadge ok={p.phoneVerified} />
                  </>
                ) : (
                  <span className="font-normal text-muted-foreground">
                    Not added
                  </span>
                )}
              </Row>
            </ul>

            <p
              aria-live="polite"
              className={
                flash ? "mt-3 text-sm font-medium text-emerald-700" : "sr-only"
              }
            >
              {flash}
            </p>

            <dl className="mt-2 divide-y divide-border border-t border-border">
              <SettingsInfoRow label="Account type" value="Seller" />
              {me.data?.storeSlug && (
                <SettingsInfoRow
                  label="Store address"
                  value={`/store/${me.data.storeSlug}`}
                />
              )}
              <SettingsInfoRow
                label="Member since"
                value={memberSince(me.data?.createdAt)}
              />
            </dl>

            <p
              role="note"
              className="mt-4 flex items-start gap-2 rounded-xl bg-muted px-3 py-2.5 text-sm text-muted-foreground"
            >
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                This is your private account information. Your store's public
                phone and WhatsApp number are set in Store design and aren't
                affected by anything here.
              </span>
            </p>
          </>
        )}
      </SettingsCard>
    </>
  );
}

function Unavailable({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="note"
      className="mt-2 rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground"
    >
      {children}
    </p>
  );
}
