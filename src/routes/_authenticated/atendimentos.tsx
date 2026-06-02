import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, Pencil, Plus, XCircle } from "lucide-react";
import { toast } from "sonner";
import { AppointmentFormDialog } from "@/components/appointment-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageEmpty } from "@/components/page-empty";
import { WhatsAppActionButton } from "@/components/whatsapp-action-button";
import {
  getAppointmentStatusLabel,
  getAppointmentTypeLabel,
  listAppointments,
  updateAppointmentStatus,
  type Appointment,
  type AppointmentStatus,
} from "@/lib/appointments-api";

export const Route = createFileRoute("/_authenticated/atendimentos")({
  head: () => ({ meta: [{ title: "Atendimentos — Lash Manager" }] }),
  component: AtendimentosPage,
});

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

function formatAppointmentMessageVariables(value: string) {
  const date = new Date(value);
  return {
    data: new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(date),
    horario: new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date),
  };
}

function AtendimentosPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["appointments"],
    queryFn: listAppointments,
  });

  const appointments = useMemo(() => data ?? [], [data]);
  const todayStart = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);
  const tomorrowStart = useMemo(() => {
    const date = new Date(todayStart);
    date.setDate(date.getDate() + 1);
    return date;
  }, [todayStart]);
  const today = useMemo(
    () =>
      appointments.filter((appointment) => {
        const scheduledAt = new Date(appointment.scheduled_at);
        return scheduledAt >= todayStart && scheduledAt < tomorrowStart;
      }),
    [appointments, todayStart, tomorrowStart],
  );
  const upcoming = useMemo(
    () =>
      appointments.filter((appointment) => {
        const scheduledAt = new Date(appointment.scheduled_at);
        return appointment.status === "scheduled" && scheduledAt >= tomorrowStart;
      }),
    [appointments, tomorrowStart],
  );
  const history = useMemo(
    () =>
      appointments.filter((appointment) => {
        const scheduledAt = new Date(appointment.scheduled_at);
        return scheduledAt < todayStart || appointment.status !== "scheduled";
      }),
    [appointments, todayStart],
  );

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      updateAppointmentStatus(id, status),
    onSuccess: (appointment) => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["appointments", appointment.client_id] });
      toast.success("Status atualizado");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar atendimento");
    },
  });

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (appointment: Appointment) => {
    setEditing(appointment);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <SummaryCard label="Hoje" value={today.length} />
        <SummaryCard label="Próximos" value={upcoming.length} />
        <SummaryCard label="Total" value={appointments.length} />
      </div>

      <div className="flex justify-end">
        <Button className="h-11" onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" /> Novo atendimento
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error instanceof Error ? error.message : "Erro ao carregar atendimentos."}
        </div>
      )}

      {!isLoading && !isError && appointments.length === 0 && (
        <PageEmpty
          title="Nenhum atendimento ainda"
          description="Registre seus atendimentos para acompanhar agenda e histórico."
        />
      )}

      {!isLoading && appointments.length > 0 && (
        <div className="space-y-5">
          <AppointmentSection
            title="Hoje"
            appointments={today}
            openEdit={openEdit}
            statusMutation={statusMutation}
          />
          <AppointmentSection
            title="Próximos"
            appointments={upcoming}
            openEdit={openEdit}
            statusMutation={statusMutation}
          />
          <AppointmentSection
            title="Histórico"
            appointments={history}
            openEdit={openEdit}
            statusMutation={statusMutation}
          />
        </div>
      )}

      <AppointmentFormDialog open={dialogOpen} onOpenChange={setDialogOpen} appointment={editing} />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Clock className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function AppointmentSection({
  title,
  appointments,
  openEdit,
  statusMutation,
}: {
  title: string;
  appointments: Appointment[];
  openEdit: (appointment: Appointment) => void;
  statusMutation: {
    isPending: boolean;
    mutate: (variables: { id: string; status: AppointmentStatus }) => void;
  };
}) {
  if (appointments.length === 0) return null;

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <ul className="space-y-2">
        {appointments.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            onEdit={() => openEdit(appointment)}
            onComplete={() => statusMutation.mutate({ id: appointment.id, status: "completed" })}
            onCancel={() => statusMutation.mutate({ id: appointment.id, status: "canceled" })}
            isMutating={statusMutation.isPending}
          />
        ))}
      </ul>
    </section>
  );
}

function AppointmentCard({
  appointment,
  onEdit,
  onComplete,
  onCancel,
  isMutating,
}: {
  appointment: Appointment;
  onEdit: () => void;
  onComplete: () => void;
  onCancel: () => void;
  isMutating: boolean;
}) {
  const whatsappMessageType =
    appointment.status === "canceled" ? "cancelamento" : "confirmacao_atendimento";
  const whatsappLabel = appointment.status === "canceled" ? "Avisar cancelamento" : "WhatsApp";
  const canUseWhatsApp = Boolean(appointment.client?.id && appointment.client.phone);

  return (
    <li className="rounded-xl border bg-card p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium text-foreground">
              {appointment.client?.name ?? "Cliente"}
            </p>
            <Badge variant={STATUS_VARIANTS[appointment.status]}>
              {getAppointmentStatusLabel(appointment.status)}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {getAppointmentTypeLabel(appointment.appointment_type)} •{" "}
            {formatDateTime(appointment.scheduled_at)}
          </p>
          {appointment.client && (
            <Button asChild variant="link" className="mt-1 h-auto p-0 text-xs">
              <Link to="/clientes/$id" params={{ id: appointment.client.id }}>
                Ver cliente
              </Link>
            </Button>
          )}
        </div>

        <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Editar</span>
        </Button>
      </div>

      {appointment.notes && (
        <p className="mt-3 whitespace-pre-wrap rounded-lg bg-muted/40 p-2 text-xs text-foreground">
          {appointment.notes}
        </p>
      )}

      {appointment.status === "scheduled" && (
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {canUseWhatsApp && appointment.client && (
            <WhatsAppActionButton
              clientId={appointment.client.id}
              clientName={appointment.client.name}
              phone={appointment.client.phone}
              appointmentId={appointment.id}
              messageType={whatsappMessageType}
              variables={formatAppointmentMessageVariables(appointment.scheduled_at)}
              label={whatsappLabel}
              className="w-full"
            />
          )}
          <Button variant="outline" className="h-10" onClick={onComplete} disabled={isMutating}>
            <CheckCircle2 className="mr-1 h-4 w-4" /> Concluir
          </Button>
          <Button
            variant="outline"
            className="h-10 text-destructive hover:text-destructive"
            onClick={onCancel}
            disabled={isMutating}
          >
            <XCircle className="mr-1 h-4 w-4" /> Cancelar
          </Button>
        </div>
      )}

      {appointment.status === "canceled" && canUseWhatsApp && appointment.client && (
        <div className="mt-3">
          <WhatsAppActionButton
            clientId={appointment.client.id}
            clientName={appointment.client.name}
            phone={appointment.client.phone}
            appointmentId={appointment.id}
            messageType="cancelamento"
            variables={formatAppointmentMessageVariables(appointment.scheduled_at)}
            label="Avisar cancelamento"
            className="w-full"
          />
        </div>
      )}
    </li>
  );
}
