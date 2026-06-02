import { endOfDay, startOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { getAuthenticatedUserId, throwSupabaseError } from "@/lib/supabase-errors";

export type AppointmentStatus = "scheduled" | "completed" | "canceled" | "no_show";

export type AppointmentClient = {
  id: string;
  name: string;
  phone: string;
};

export type Appointment = {
  id: string;
  user_id: string;
  client_id: string;
  technical_record_id: string | null;
  appointment_type: string;
  scheduled_at: string;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  client?: AppointmentClient | null;
};

export type AppointmentInput = {
  client_id: string;
  technical_record_id?: string | null;
  appointment_type: string;
  scheduled_at: string;
  status: AppointmentStatus;
  notes?: string | null;
};

type NormalizedAppointmentInput = Omit<AppointmentInput, "scheduled_at"> & {
  scheduled_at: string;
};

export const APPOINTMENT_STATUS_OPTIONS: Array<{ value: AppointmentStatus; label: string }> = [
  { value: "scheduled", label: "Agendado" },
  { value: "completed", label: "Concluído" },
  { value: "canceled", label: "Cancelado" },
  { value: "no_show", label: "Não compareceu" },
];

export const APPOINTMENT_TYPE_OPTIONS = [
  { value: "colocacao", label: "Colocação" },
  { value: "manutencao", label: "Manutenção" },
  { value: "retorno", label: "Retorno" },
  { value: "avaliacao", label: "Avaliação" },
  { value: "outro", label: "Outro" },
];

function normalize(input: AppointmentInput): NormalizedAppointmentInput {
  if (!input.client_id) throw new Error("Selecione uma cliente válida.");
  if (!input.scheduled_at) throw new Error("Informe a data e horário do atendimento.");

  const scheduledAt = new Date(input.scheduled_at);
  if (Number.isNaN(scheduledAt.getTime())) {
    throw new Error("Informe uma data e horário válidos para o atendimento.");
  }

  return {
    client_id: input.client_id,
    technical_record_id: input.technical_record_id || null,
    appointment_type: input.appointment_type.trim() || "manutencao",
    scheduled_at: scheduledAt.toISOString(),
    status: input.status,
    notes: input.notes?.trim() || null,
  };
}

async function ensureNoAppointmentConflict(scheduledAt: string, ignoreAppointmentId?: string) {
  const userId = await getAuthenticatedUserId();
  let query = supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("scheduled_at", scheduledAt)
    .neq("status", "canceled");

  if (ignoreAppointmentId) query = query.neq("id", ignoreAppointmentId);

  const { count, error } = await query;
  if (error) throwSupabaseError(error, "Erro ao validar horário do atendimento.");
  if ((count ?? 0) > 0) {
    throw new Error("Já existe atendimento nesse horário. Escolha outro horário.");
  }
}

export function getAppointmentStatusLabel(status: AppointmentStatus | string) {
  return APPOINTMENT_STATUS_OPTIONS.find((item) => item.value === status)?.label ?? status;
}

export function getAppointmentTypeLabel(type: string) {
  return APPOINTMENT_TYPE_OPTIONS.find((item) => item.value === type)?.label ?? type;
}

export async function listAppointments(): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("*, client:clients(id,name,phone)")
    .order("scheduled_at", { ascending: true });
  if (error) throwSupabaseError(error, "Erro ao carregar atendimentos.");
  return (data ?? []) as Appointment[];
}

export async function listClientAppointments(clientId: string): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("*, client:clients(id,name,phone)")
    .eq("client_id", clientId)
    .order("scheduled_at", { ascending: true });
  if (error) throwSupabaseError(error, "Erro ao carregar atendimentos da cliente.");
  return (data ?? []) as Appointment[];
}

export async function createAppointment(input: AppointmentInput): Promise<Appointment> {
  const userId = await getAuthenticatedUserId();
  const normalized = normalize(input);

  if (normalized.status !== "canceled") {
    await ensureNoAppointmentConflict(normalized.scheduled_at);
  }

  const { data, error } = await supabase
    .from("appointments")
    .insert({ user_id: userId, ...normalized })
    .select("*, client:clients(id,name,phone)")
    .single();
  if (error) throwSupabaseError(error, "Erro ao criar atendimento.");
  return data as Appointment;
}

export async function updateAppointment(id: string, input: AppointmentInput): Promise<Appointment> {
  const normalized = normalize(input);

  if (normalized.status !== "canceled") {
    await ensureNoAppointmentConflict(normalized.scheduled_at, id);
  }

  const { data, error } = await supabase
    .from("appointments")
    .update(normalized)
    .eq("id", id)
    .select("*, client:clients(id,name,phone)")
    .single();
  if (error) throwSupabaseError(error, "Erro ao atualizar atendimento.");
  return data as Appointment;
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<Appointment> {
  const { data, error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", id)
    .select("*, client:clients(id,name,phone)")
    .single();
  if (error) throwSupabaseError(error, "Erro ao atualizar status do atendimento.");
  return data as Appointment;
}

export async function listUpcomingAppointments(limit = 5): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("*, client:clients(id,name,phone)")
    .eq("status", "scheduled")
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(limit);
  if (error) throwSupabaseError(error, "Erro ao carregar próximos atendimentos.");
  return (data ?? []) as Appointment[];
}

export async function countTodayAppointments(): Promise<number> {
  const today = new Date();
  const { count, error } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .gte("scheduled_at", startOfDay(today).toISOString())
    .lte("scheduled_at", endOfDay(today).toISOString());
  if (error) throwSupabaseError(error, "Erro ao contar atendimentos de hoje.");
  return count ?? 0;
}
