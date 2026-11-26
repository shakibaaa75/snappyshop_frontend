import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSection } from "./settings-nav";

/** Title block at the top of every settings section. */
export function SettingsPageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-5 sm:mb-6">
      <h2 className="text-2xl font-medium tracking-tight sm:text-3xl">
        {title}
      </h2>
      {description && (
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          {description}
        </p>
      )}
    </header>
  );
}

/** White card with the dashboard's border and radius. */
export function SettingsCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card p-4 sm:p-6",
        className,
      )}
    >
      {children}
    </section>
  );
}

/** A read-only label and value (no input, nothing to click). */
export function SettingsInfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid gap-0.5 py-3 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-center sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-sm font-medium">{value}</dd>
    </div>
  );
}

/** Small "Coming soon" tag. */
export function ComingSoonBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground",
        className,
      )}
    >
      <Clock className="h-3 w-3" aria-hidden="true" />
      Coming soon
    </span>
  );
}

/** Plain notice used on pages that only show information. */
export function SettingsNotice({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="note"
      className="mt-4 flex items-start gap-2 rounded-xl bg-muted px-3 py-2.5 text-sm text-muted-foreground"
    >
      <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

/**
 * Whole page for a section that is not built yet. It states that plainly and
 * has no buttons, switches or fields, so nothing looks like it works.
 */
export function SectionUnavailable({ id }: { id: string }) {
  const section = getSection(id);
  if (!section) return null;
  const Icon = section.icon;
  return (
    <>
      <SettingsPageHeader
        title={section.label}
        description={section.description}
      />
      <SettingsCard className="flex flex-col items-center px-4 py-10 text-center sm:py-14">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Icon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </span>
        <ComingSoonBadge className="mt-4" />
        <h3 className="mt-3 text-lg font-medium tracking-tight">
          This section is not available yet
        </h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Nothing here can be changed for now. Your account works as before.
        </p>
        {section.planned && section.planned.length > 0 && (
          <div className="mt-6 w-full max-w-sm rounded-xl bg-muted px-4 py-3 text-left">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Planned for this section
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              {section.planned.map((p) => (
                <li key={p} className="flex items-start gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground"
                  />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        )}
      </SettingsCard>
    </>
  );
}
