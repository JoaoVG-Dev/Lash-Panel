import { useQuery } from "@tanstack/react-query";
import { Bell, CalendarCheck, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  calculateMaintenanceStatus,
  formatMaintenanceDate,
  type MaintenanceStatusKey,
} from "@/lib/maintenance-api";
import { getUserSettings } from "@/lib/settings-api";
import { listTechnicalRecords } from "@/lib/technical-records-api";

const BADGE_VARIANTS: Record<MaintenanceStatusKey, "default" | "secondary" | "destructive"> = {
  no_record: "secondary",
  on_track: "default",
  upcoming: "secondary",
  overdue: "destructive",
};

export function MaintenanceStatusSection({ clientId }: { clientId: string }) {
  const {
    data: settings,
    isLoading: isLoadingSettings,
    isError: isSettingsError,
  } = useQuery({
    queryKey: ["settings"],
    queryFn: getUserSettings,
  });

  const {
    data: records,
    isLoading: isLoadingRecords,
    isError: isRecordsError,
  } = useQuery({
    queryKey: ["technical-records", clientId],
    queryFn: () => listTechnicalRecords(clientId),
  });

  const isLoading = isLoadingSettings || isLoadingRecords;
  const isError = isSettingsError || isRecordsError;
  const latest = records?.[0] ?? null;
  const status = calculateMaintenanceStatus(latest, settings ?? { reminder_days_before: 3 });

  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">Manutenção</h3>
        {!isLoading && <Badge variant={BADGE_VARIANTS[status.key]}>{status.label}</Badge>}
      </div>

      {isLoading && <Skeleton className="mt-3 h-20 w-full rounded-lg" />}

      {isError && (
        <div className="mt-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          Erro ao carregar status de manutenção.
        </div>
      )}

      {!isLoading && !isError && (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-muted-foreground">{status.description}</p>
          <div className="grid grid-cols-2 gap-2">
            <InfoTile
              icon={CalendarCheck}
              label="Próxima data"
              value={formatMaintenanceDate(status.dueDate)}
            />
            <InfoTile
              icon={Bell}
              label="Dias restantes"
              value={status.daysUntilDue === null ? "-" : String(status.daysUntilDue)}
            />
          </div>
        </div>
      )}
    </section>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-muted/40 px-3 py-2">
      <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
