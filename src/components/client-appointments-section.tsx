import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getAppointmentStatusLabel,
  getAppointmentTypeLabel,
  listClientAppointments,
  type AppointmentStatus,
} from "@/lib/appointments-api";

const STATUS_VARIANTS: Record<AppointmentStatus, "default" | "secondary" | "destructive"> = {
  scheduled: "secondary",
  completed: "default",
  canceled: "destructive",
  no_show: "destructive",
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ClientAppointmentsSection({ clientId }: { clientId: string }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["appointments", clientId],
    queryFn: () => listClientAppointments(clientId),
  });

  const appointments = (data ?? []).slice(0, 3);

  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">Atendimentos</h3>
        <Button asChild variant="outline" size="sm" className="h-9">
          <Link to="/atendimentos">Agenda</Link>
        </Button>
      </div>

      {isLoading && <Skeleton className="mt-3 h-20 w-full rounded-lg" />}

      {isError && (
        <div className="mt-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error instanceof Error ? error.message : "Erro ao carregar atendimentos."}
        </div>
      )}

      {!isLoading && !isError && appointments.length === 0 && (
        <div className="mt-3 rounded-lg border border-dashed p-4 text-center">
          <p className="text-sm text-foreground">Nenhum atendimento agendado</p>
        </div>
      )}

      {!isLoading && appointments.length > 0 && (
        <ul className="mt-3 space-y-2">
          {appointments.map((appointment) => (
            <li key={appointment.id} className="rounded-lg bg-muted/40 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-1 text-sm font-medium text-foreground">
                    <CalendarClock className="h-4 w-4 text-primary" />
                    {formatDateTime(appointment.scheduled_at)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {getAppointmentTypeLabel(appointment.appointment_type)}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANTS[appointment.status]}>
                  {getAppointmentStatusLabel(appointment.status)}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
