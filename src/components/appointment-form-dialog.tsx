import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  APPOINTMENT_STATUS_OPTIONS,
  createAppointment,
  updateAppointment,
  type Appointment,
  type AppointmentInput,
  type AppointmentStatus,
} from "@/lib/appointments-api";
import { listClients } from "@/lib/clients-api";
import { listServices } from "@/lib/services-api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment | null;
  defaultClientId?: string;
};

function toDatetimeLocal(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function defaultScheduledAt() {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + 1);
  return toDatetimeLocal(date.toISOString());
}

function emptyForm(defaultClientId = ""): AppointmentInput {
  return {
    client_id: defaultClientId,
    service_id: "",
    amount: 0,
    scheduled_at: defaultScheduledAt(),
    status: "scheduled",
    notes: "",
  };
}

export function AppointmentFormDialog({ open, onOpenChange, appointment, defaultClientId }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState<AppointmentInput>(emptyForm(defaultClientId));

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: listClients,
    enabled: open,
  });

  const { data: services } = useQuery({
    queryKey: ["services"],
    queryFn: listServices,
    enabled: open,
  });

  const activeServices = useMemo(
    () => (services ?? []).filter((service) => service.active),
    [services],
  );

  useEffect(() => {
    if (!open) return;
    setForm(
      appointment
        ? {
            client_id: appointment.client_id,
            technical_record_id: appointment.technical_record_id,
            service_id: appointment.service_id ?? "",
            amount: appointment.amount,
            scheduled_at: toDatetimeLocal(appointment.scheduled_at),
            status: appointment.status,
            notes: appointment.notes ?? "",
          }
        : emptyForm(defaultClientId),
    );
  }, [appointment, defaultClientId, open]);

  const mutation = useMutation({
    mutationFn: (input: AppointmentInput) => {
      if (appointment) return updateAppointment(appointment.id, input);
      return createAppointment(input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["appointments", form.client_id] });
      toast.success(appointment ? "Atendimento atualizado" : "Atendimento criado");
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar atendimento");
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.client_id) {
      toast.error("Selecione uma cliente");
      return;
    }
    if (!form.service_id) {
      toast.error("Selecione um serviço");
      return;
    }
    if (!Number.isFinite(Number(form.amount)) || Number(form.amount) < 0) {
      toast.error("Informe um valor válido");
      return;
    }
    if (!form.scheduled_at) {
      toast.error("Informe a data e horário");
      return;
    }
    mutation.mutate(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{appointment ? "Editar atendimento" : "Novo atendimento"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="appointment-client">Cliente *</Label>
            <Select
              value={form.client_id}
              onValueChange={(value) => setForm({ ...form, client_id: value })}
            >
              <SelectTrigger id="appointment-client">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {(clients ?? []).map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="appointment-service">Serviço</Label>
            <Select
              value={form.service_id}
              onValueChange={(value) => {
                const service = activeServices.find((item) => item.id === value);
                setForm({
                  ...form,
                  service_id: value,
                  amount: service ? service.price : form.amount,
                });
              }}
            >
              <SelectTrigger id="appointment-service">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {activeServices.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="appointment-amount">Valor</Label>
            <Input
              id="appointment-amount"
              type="number"
              min={0}
              step="0.01"
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: Number(event.target.value || 0) })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="appointment-date">Data e horário *</Label>
            <Input
              id="appointment-date"
              type="datetime-local"
              value={form.scheduled_at}
              onChange={(event) => setForm({ ...form, scheduled_at: event.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="appointment-status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(value) => setForm({ ...form, status: value as AppointmentStatus })}
            >
              <SelectTrigger id="appointment-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APPOINTMENT_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="appointment-notes">Observações</Label>
            <Textarea
              id="appointment-notes"
              rows={3}
              value={form.notes ?? ""}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
