import type { ReactNode } from "react";

/* Small building blocks shared by the analytics page and its new panels. */

export function Panel({
  title,
  sub,
  action,
  children,
  id,
}: {
  title: string;
  sub?: string;
  action?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="scroll-mt-20 rounded-2xl border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function KpiTile({
  icon: Icon,
  label,
  value,
  sub,
  extra,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  extra?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      {extra}
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return <p className="py-8 text-center text-xs text-muted-foreground">{text}</p>;
}
