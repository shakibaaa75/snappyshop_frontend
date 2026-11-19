"use client";

import { usesDropLayout, usesYokaiLayout } from "@/lib/store-design/types";
import {
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  RotateCcw,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/store-design/utilts";
import { Link, Mark, PaymentBadges } from "./blocks";
import { INK, muted } from "./tokens";
import { type Ctx } from "./types";

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */

/** Drop-style footer: flat, full width, hairline top, uppercase columns. */
function StreetFooter({ ctx }: { ctx: Ctx }) {
  const { d, mobile, interactive } = ctx;
  const socials = [
    { label: "Facebook", url: d.facebookUrl },
    { label: "Instagram", url: d.instagramUrl },
    { label: "YouTube", url: d.youtubeUrl },
  ].filter((s) => s.url);
  const contact = [
    d.supportEmail,
    d.supportPhone,
    d.address,
    d.businessHours,
  ].filter(Boolean) as string[];
  const head = "mb-4 text-[11px] font-semibold uppercase tracking-[0.16em]";
  return (
    <footer
      className={cn(mobile ? "mt-10 pb-24" : "mt-16")}
      style={{
        background: "var(--s-bg)",
        color: "var(--s-text)",
        borderTop: "1px solid var(--s-border)",
      }}
    >
      {usesYokaiLayout(d) && (
        <div style={{ borderBottom: "1px solid var(--s-border)" }}>
          <div
            className={cn(
              "mx-auto grid max-w-[1440px] gap-6 px-6 py-10",
              !mobile && "grid-cols-3",
            )}
          >
            {[
              {
                Icon: RotateCcw,
                title: "Easy exchange",
                text: d.returnPolicy,
              },
              {
                Icon: MessageCircle,
                title: "Real human support",
                text: d.businessHours
                  ? `Questions about sizing or your order? We're here ${d.businessHours}.`
                  : "Questions about sizing or your order? Our team is here to help.",
              },
              {
                Icon: Truck,
                title: d.deliveryNote || "Fast delivery",
                text:
                  d.freeDeliveryThreshold > 0
                    ? `Free delivery over ${formatPrice(d.freeDeliveryThreshold)}.`
                    : "Tracked to your door.",
              },
            ].map(({ Icon, title, text }) => (
              <div key={title} className="flex items-start gap-4">
                <Icon className="mt-0.5 h-6 w-6 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em]">
                    {title}
                  </p>
                  <p className="mt-1.5 text-sm leading-6" style={muted}>
                    {text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div
        className={cn(
          "mx-auto max-w-[1440px] px-6 py-12",
          !mobile && "grid grid-cols-[1.4fr_1fr_1fr_1.2fr] gap-10",
          mobile && "space-y-8",
        )}
      >
        <div>
          <p className="text-lg font-semibold uppercase tracking-[0.24em]">
            {d.storeName}
          </p>
          {d.footerText && (
            <p className="mt-3 max-w-xs text-sm leading-6" style={muted}>
              {d.footerText}
            </p>
          )}
        </div>
        <div>
          <p className={head}>Shop</p>
          <ul className="space-y-2 text-sm" style={muted}>
            {d.navLinks.map((l) => (
              <li key={l.id}>
                <Link
                  on={interactive}
                  href={l.url || "/"}
                  className="hover:underline"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className={head}>Follow</p>
          <ul className="space-y-2 text-sm" style={muted}>
            {(d.showSocialLinks && socials.length > 0
              ? socials
              : [{ label: "Instagram", url: "" }]
            ).map((s) => (
              <li key={s.label}>
                {interactive && s.url ? (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {s.label}
                  </a>
                ) : (
                  s.label
                )}
              </li>
            ))}
          </ul>
        </div>
        {d.showContactInfo && contact.length > 0 && (
          <div>
            <p className={head}>Contact</p>
            <ul className="space-y-2 text-sm" style={muted}>
              {contact.map((t) => (
                <li key={t} className="break-words">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div style={{ borderTop: "1px solid var(--s-border)" }}>
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-6 py-5 text-[11px] uppercase tracking-[0.12em]">
          <span style={muted}>
            © {new Date().getFullYear()} {d.storeName}. Powered by ShopBD.
          </span>
          {d.showPaymentBadges && d.paymentMethods.length > 0 && (
            <PaymentBadges methods={d.paymentMethods} />
          )}
        </div>
      </div>
    </footer>
  );
}
export function Footer({ ctx }: { ctx: Ctx }) {
  const { d, mobile, interactive } = ctx;
  if (usesDropLayout(d)) return <StreetFooter ctx={ctx} />;
  const socials = [
    { label: "f", url: d.facebookUrl },
    { label: "ig", url: d.instagramUrl },
    { label: "yt", url: d.youtubeUrl },
  ].filter((s) => s.url);
  const contact = [
    d.supportEmail && { icon: Mail, text: d.supportEmail },
    d.supportPhone && { icon: Phone, text: d.supportPhone },
    d.address && { icon: MapPin, text: d.address },
    d.businessHours && { icon: Clock, text: d.businessHours },
  ].filter(Boolean) as { icon: typeof Mail; text: string }[];

  const dot =
    "flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold transition-transform active:scale-90";

  return (
    <footer
      className={cn(
        mobile
          ? "mx-4 mb-24 mt-8 p-6"
          : "mx-auto mb-8 mt-14 w-[calc(100%-2*var(--sf-gutter))] max-w-[calc(var(--sf-max)-2*var(--sf-gutter))] p-10",
      )}
      style={{
        background: "var(--s-surface)",
        color: "var(--s-text)",
        borderRadius: 32,
      }}
    >
      <div
        className={cn("grid gap-8", !mobile && "grid-cols-[1.4fr_1fr_1.4fr]")}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <Mark d={d} size={40} />
            <span className="truncate text-base font-bold">{d.storeName}</span>
          </div>
          {d.footerText && (
            <p className="max-w-xs text-sm leading-6" style={muted}>
              {d.footerText}
            </p>
          )}
          {d.showSocialLinks && socials.length > 0 && (
            <div className="flex gap-2">
              {socials.map((s) =>
                interactive ? (
                  <a
                    key={s.label}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={dot}
                    style={INK}
                  >
                    {s.label}
                  </a>
                ) : (
                  <span key={s.label} className={dot} style={INK}>
                    {s.label}
                  </span>
                ),
              )}
            </div>
          )}
        </div>
        <div className="space-y-3">
          <p className="text-sm font-semibold">Quick links</p>
          <ul className="space-y-2 text-sm" style={muted}>
            {d.navLinks.map((l) => (
              <li key={l.id}>
                <Link
                  on={interactive}
                  href={l.url || "/"}
                  className="hover:underline"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {d.showContactInfo && contact.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold">Get in touch</p>
            <ul className="space-y-2 text-sm" style={muted}>
              {contact.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-2">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="min-w-0 break-words">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div
        className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-5 text-xs"
        style={{ borderColor: "var(--s-border)" }}
      >
        <span>
          © {new Date().getFullYear()} {d.storeName}. Powered by ShopBD.
        </span>
        {d.showPaymentBadges && d.paymentMethods.length > 0 && (
          <PaymentBadges methods={d.paymentMethods} />
        )}
      </div>
    </footer>
  );
}
