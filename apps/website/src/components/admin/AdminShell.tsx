import type { LucideIcon } from "lucide-react";

export function AdminPageHeader({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-4 mb-8">
      <div>
        {eyebrow && (
          <p className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 rounded-full text-[11px] font-mono uppercase tracking-wider text-muted-foreground border border-border/40 bg-card/40">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl md:text-4xl font-medium">{title}</h1>
        {subtitle && (
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{subtitle}</p>
        )}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </header>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 p-5">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {Icon && (
          <span className="h-7 w-7 rounded-md bg-foreground/5 border border-border/40 inline-flex items-center justify-center text-muted-foreground">
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <p className="text-3xl font-medium mt-3 tabular-nums">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

export function AdminCard({
  title,
  subtitle,
  right,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-border/40 bg-card/40 ${className ?? ""}`}
    >
      {(title || right) && (
        <header className="flex items-start justify-between px-5 py-4 border-b border-border/40 gap-3">
          <div className="min-w-0">
            {title && (
              <h2 className="text-sm font-medium tracking-tight">{title}</h2>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

export function formatCents(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function timeAgo(date: Date | string | null) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const s = Math.floor(diffMs / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function statusBadge(status: string) {
  const map: Record<string, string> = {
    active: "bg-foreground text-background",
    inactive: "bg-card/60 border border-border/60 text-muted-foreground",
    past_due: "bg-destructive/10 text-destructive border border-destructive/30",
    cancelled: "bg-card/60 border border-border/60 text-muted-foreground",
  };
  const className =
    "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider " +
    (map[status] ?? "bg-card/60 border border-border/60 text-muted-foreground");
  return <span className={className}>{status}</span>;
}
