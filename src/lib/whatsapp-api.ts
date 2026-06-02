import { supabase } from "@/integrations/supabase/client";
import type { UserSettings } from "@/lib/settings-api";
import { getAuthenticatedUserId, throwSupabaseError } from "@/lib/supabase-errors";

export type WhatsAppMessageType =
  | "cancelamento"
  | "confirmacao_atendimento"
  | "lembrete_manutencao"
  | "lembrete_agendar"
  | "link_anamnese";
export type WhatsAppMessageStatus = "pending" | "manual_opened" | "sent" | "failed" | "canceled";

export type WhatsAppTemplateVariables = {
  nome?: string;
  profissional?: string;
  negocio?: string;
  data?: string;
  horario?: string;
  link_anamnese?: string;
};

export type WhatsAppMessageLogInput = {
  client_id?: string | null;
  appointment_id?: string | null;
  template_id?: string | null;
  message_type: WhatsAppMessageType;
  phone: string;
  message: string;
  status?: WhatsAppMessageStatus;
  scheduled_for?: string | null;
};

export function normalizeWhatsAppPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55")) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

export function isValidWhatsAppPhone(phone: string) {
  const normalizedPhone = normalizeWhatsAppPhone(phone);
  return /^55\d{10,11}$/.test(normalizedPhone);
}

export function buildWhatsAppUrl(phone: string, message: string) {
  const normalizedPhone = normalizeWhatsAppPhone(phone);
  if (!isValidWhatsAppPhone(normalizedPhone)) {
    throw new Error("Informe um telefone válido com DDD para abrir o WhatsApp.");
  }

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;
}

export function getWhatsAppTemplateMessage(
  settings: UserSettings | null | undefined,
  messageType: WhatsAppMessageType,
) {
  if (messageType === "cancelamento") {
    return settings?.cancellation_message ?? "Oi, {nome}! Preciso cancelar seu atendimento.";
  }

  if (messageType === "confirmacao_atendimento") {
    return (
      settings?.appointment_confirmation_message ??
      "Oi, {nome}! Seu atendimento com {profissional} está confirmado para {data} às {horario}."
    );
  }

  if (messageType === "lembrete_agendar") {
    return (
      settings?.schedule_reminder_message ??
      "Oi, {nome}! Já está na hora de agendar sua manutenção de cílios."
    );
  }

  if (messageType === "link_anamnese") {
    return (
      settings?.anamnesis_link_message ??
      "Oi, {nome}! Antes do atendimento, preencha sua anamnese por este link: {link_anamnese}"
    );
  }

  return (
    settings?.default_whatsapp_message ??
    "Oi, {nome}! Sua manutenção de cílios está chegando. Quer agendar?"
  );
}

export function personalizeMessage(
  message: string,
  variablesOrClientName: WhatsAppTemplateVariables | string,
) {
  const variables =
    typeof variablesOrClientName === "string"
      ? { nome: variablesOrClientName }
      : variablesOrClientName;

  return message
    .replaceAll("{nome}", variables.nome ?? "")
    .replaceAll("{profissional}", variables.profissional ?? "")
    .replaceAll("{negocio}", variables.negocio ?? "")
    .replaceAll("{data}", variables.data ?? "")
    .replaceAll("{horario}", variables.horario ?? "")
    .replaceAll("{link_anamnese}", variables.link_anamnese ?? "");
}

export async function logWhatsAppMessage(input: WhatsAppMessageLogInput): Promise<void> {
  const userId = await getAuthenticatedUserId();
  const status = input.status ?? "manual_opened";
  const openedAt = status === "manual_opened" ? new Date().toISOString() : null;

  const { error } = await supabase.from("whatsapp_message_logs").insert({
    user_id: userId,
    client_id: input.client_id ?? null,
    appointment_id: input.appointment_id ?? null,
    template_id: input.template_id ?? null,
    message_type: input.message_type,
    template_type: input.message_type,
    phone: normalizeWhatsAppPhone(input.phone),
    message: input.message,
    message_body: input.message,
    status,
    opened_at: openedAt,
    scheduled_for: input.scheduled_for ?? null,
  });

  if (error) throwSupabaseError(error, "Erro ao registrar mensagem de WhatsApp.");
}
