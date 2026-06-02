import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Pencil,
  Phone,
  Plus,
  RotateCw,
  UserX,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AppointmentFormDialog } from "@/components/appointment-form-dialog";
import { PageEmpty } from "@/components/page-empty";
import { WhatsAppActionButton } from "@/components/whatsapp-action-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  APPOINTMENT_STATUS_OPTIONS,
  getAppointmentStatusLabel,
  getAppointmentTypeLabel,
  listAppointments,
  updateAppointmentStatus,
  type Appointment,
  type AppointmentStatus,
} from "@/lib/appointments-api";

export const Route = createFileRoute("/_authenticated/atendimentos")({
  head: () => ({ meta: [{ title: "Atendimentos - Lash Manager" }] }),
  component: AtendimentosPage,
});

type DateFilter = "today" | "upcoming" | "past" | "all";
type StatusFilter = AppointmentStatus | "all";

const STATUS_VARIANTS: Record<AppointmentStatus, "default" | "secondary" | "destructive"> = {
  scheduled: "secondary",
  completed: "default",
  canceled: "destructive",
  no_show: "destructive",
};

const DATE_FILTERS: Array<{ value: DateFilter; label: string }> = [
  { value: "today", label: "Hoje" },
  { value: "upcoming", label: "Próximos" },
  { value: "past", label: "Passados" },
  { value: "all", label: "Todos" },
];

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDateGroup(value: string) {
  const label = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date(value));

  return label.charAt(0).toUpperCase() + label.slice(1);
}

function getLocalDateKey(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

function getDateRangeMarkers() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  return { todayStart, tomorrowStart };
}

function AtendimentosPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["appointments"],
    queryFn: listAppointments,
  });

  const appointments = useMemo(() => data ?? [], [data]);
  const { todayStart, tomorrowStart } = useMemo(getDateRangeMarkers, []);

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

  const past = useMemo(
    () =>
      appointments.filter((appointment) => {
        const scheduledAt = new Date(appointment.scheduled_at);
        return scheduledAt < todayStart || appointment.status !== "scheduled";
      }),
    [appointments, todayStart],
  );

  const filteredAppointments = useMemo(
    () =>
      appointments.filter((appointment) => {
        const scheduledAt = new Date(appointment.scheduled_at);
        const matchesStatus = statusFilter === "all" ? true : appointment.status === statusFilter;

        const matchesDate =
          dateFilter === "all"
            ? true
            : dateFilter === "today"
              ? scheduledAt >= todayStart && scheduledAt < tomorrowStart
              : dateFilter === "upcoming"
                ? scheduledAt >= tomorrowStart
                : scheduledAt < todayStart;

        return matchesStatus && matchesDate;
      }),
    [appointments, dateFilter, statusFilter, todayStart, tomorrowStart],
  );

  const groupedAppointments = useMemo(
    () => groupAppointmentsByDate(filteredAppointments),
    [filteredAppointments],
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
        <SummaryCard label="Histórico" value={past.length} />
      </div>

      <div className="flex justify-end">
        <Button className="h-11" onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" /> Novo atendimento
        </Button>
      </div>

      <FilterBar
        dateFilter={dateFilter}
        statusFilter={statusFilter}
        setDateFilter={setDateFilter}
        setStatusFilter={setStatusFilter}
      />

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

      {!isLoading && !isError && appointments.length > 0 && groupedAppointments.length === 0 && (
        <PageEmpty
          title="Nada neste filtro"
          description="Ajuste o período ou status para ver outros atendimentos."
        />
      )}

      {!isLoading && groupedAppointments.length > 0 && (
        <div className="space-y-5">
          {groupedAppointments.map((group) => (
            <AppointmentSection
              key={group.dateKey}
              title={group.label}
              appointments={group.appointments}
              openEdit={openEdit}
              statusMutation={statusMutation}
            />
          ))}
        </div>
      )}

      <AppointmentFormDialog open={dialogOpen} onOpenChange={setDialogOpen} appointment={editing} />
    </div>
  );
}

function groupAppointmentsByDate(appointments: Appointment[]) {
  const map = new Map<string, Appointment[]>();

  for (const appointment of appointments) {
    const dateKey = getLocalDateKey(appointment.scheduled_at);
    map.set(dateKey, [...(map.get(dateKey) ?? []), appointment]);
  }

  return Array.from(map.entries())
    .map(([dateKey, items]) => ({
      dateKey,
      label: formatDateGroup(items[0]?.scheduled_at ?? dateKey),
      appointments: items.sort(
        (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
      ),
    }))
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
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

function FilterBar({
  dateFilter,
  statusFilter,
  setDateFilter,
  setStatusFilter,
}: {
  dateFilter: DateFilter;
  statusFilter: StatusFilter;
  setDateFilter: (value: DateFilter) => void;
  setStatusFilter: (value: StatusFilter) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border bg-card p-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {DATE_FILTERS.map((filter) => (
          <Button
            key={filter.value}
            type="button"
            variant={dateFilter === filter.value ? "default" : "outline"}
            size="sm"
            className="h-9 shrink-0"
            onClick={() => setDateFilter(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Button
          type="button"
          variant={statusFilter === "all" ? "default" : "outline"}
          size="sm"
          className="h-9 shrink-0"
          onClick={() => setStatusFilter("all")}
        >
          Todos
        </Button>
        {APPOINTMENT_STATUS_OPTIONS.map((status) => (
          <Button
            key={status.value}
            type="button"
            variant={statusFilter === status.value ? "default" : "outline"}
            size="sm"
            className="h-9 shrink-0"
            onClick={() => setStatusFilter(status.value)}
          >
            {status.label}
          </Button>
        ))}
      </div>
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
            onNoShow={() => statusMutation.mutate({ id: appointment.id, status: "no_show" })}
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
  onNoShow,
  isMutating,
}: {
  appointment: Appointment;
  onEdit: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onNoShow: () => void;
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
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" />
            {getAppointmentTypeLabel(appointment.appointment_type)} -{" "}
            {formatDateTime(appointment.scheduled_at)}
          </p>
          {appointment.client?.phone && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              {appointment.client.phone}
            </p>
          )}
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
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
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
          <Button variant="outline" className="h-10" onClick={onEdit} disabled={isMutating}>
            <RotateCw className="mr-1 h-4 w-4" /> Reagendar
          </Button>
          <Button variant="outline" className="h-10" onClick={onComplete} disabled={isMutating}>
            <CheckCircle2 className="mr-1 h-4 w-4" /> Concluir
          </Button>
          <Button
            variant="outline"
            className="h-10 text-destructive hover:text-destructive"
            onClick={onNoShow}
            disabled={isMutating}
          >
            <UserX className="mr-1 h-4 w-4" /> Faltou
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
