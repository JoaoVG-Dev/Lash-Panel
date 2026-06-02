import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  icon: Icon,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <header className="beauty-panel rounded-2xl p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <p className="text-xs font-bold uppercase text-primary">{eyebrow}</p>}
          <div className="mt-1 flex items-center gap-2">
            {Icon && (
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
            )}
            <h1 className="display-title text-3xl text-foreground sm:text-4xl">{title}</h1>
          </div>
          {description && (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("beauty-card rounded-2xl p-4 sm:p-5", className)}>
      {(title || description || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="text-base font-bold text-foreground">{title}</h2>}
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "danger" | "lavender";
}) {
  const toneClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-rose-50 text-rose-700",
    lavender: "bg-violet-50 text-violet-700",
  };

  return (
    <div className="beauty-card rounded-2xl p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase text-muted-foreground">{label}</span>
        <span className={cn("grid h-9 w-9 place-items-center rounded-xl", toneClasses[tone])}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-extrabold leading-none text-foreground">{value}</p>
    </div>
  );
}

export function QuickActionCard({
  label,
  icon: Icon,
  children,
  className,
}: {
  label: string;
  icon: LucideIcon;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border bg-card/85 p-3 text-center text-xs font-bold text-foreground shadow-sm transition-colors hover:border-primary/30 hover:bg-accent",
        className,
      )}
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span className="leading-tight">{children ?? label}</span>
    </div>
  );
}

export function FilterChip({
  active,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "touch-chip shrink-0 border px-4 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
          : "border-input bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function InitialsAvatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <div
      className={cn(
        "grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 font-bold text-primary",
        className,
      )}
    >
      {initials || "LP"}
    </div>
  );
}
