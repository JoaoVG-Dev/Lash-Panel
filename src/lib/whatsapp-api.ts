import { supabase } from "@/integrations/supabase/client";
import { getAuthenticatedUserId, throwSupabaseError } from "@/lib/supabase-errors";

export type WhatsAppMessageType = "cancelamento" | "lembrete_manutencao" | "lembrete_agendar";
export type WhatsAppMessageStatus = "pending" | "manual_opened" | "sent" | "failed" | "canceled";

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

export function personalizeMessage(message: string, clientName: string) {
  return message.replaceAll("{nome}", clientName);
}

export async function logWhatsAppMessage(input: WhatsAppMessageLogInput): Promise<void> {
  const userId = await getAuthenticatedUserId();

  const { error } = await supabase.from("whatsapp_message_logs").insert({
    user_id: userId,
    client_id: input.client_id ?? null,
    appointment_id: input.appointment_id ?? null,
    template_id: input.template_id ?? null,
    message_type: input.message_type,
    phone: normalizeWhatsAppPhone(input.phone),
    message: input.message,
    status: input.status ?? "manual_opened",
    scheduled_for: input.scheduled_for ?? null,
  });

  if (error) throwSupabaseError(error, "Erro ao registrar mensagem de WhatsApp.");
}
