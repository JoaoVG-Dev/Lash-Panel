import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

export function BrandMark({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm shadow-primary/25">
        <Sparkles className="h-5 w-5" />
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="font-serif text-2xl font-bold leading-none text-foreground">Lash Panel</p>
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">Beauty business</p>
        </div>
      )}
    </div>
  );
}
