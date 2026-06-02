import type { ReactNode } from "react";

export function PageEmpty({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="beauty-card rounded-2xl border-dashed p-8 text-center">
      <div className="mx-auto mb-4 h-10 w-10 rounded-full bg-primary/10" />
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
