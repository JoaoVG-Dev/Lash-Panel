import { supabase } from "@/integrations/supabase/client";
import { getAuthenticatedUserId, throwSupabaseError } from "@/lib/supabase-errors";

export type UserSettings = {
  id: string;
  user_id: string;
  maintenance_days_default: number;
  reminder_days_before: number;
  default_whatsapp_message: string;
  cancellation_message: string;
  schedule_reminder_message: string;
  created_at: string;
  updated_at: string;
};

export type UserSettingsInput = Pick<
  UserSettings,
  | "maintenance_days_default"
  | "reminder_days_before"
  | "default_whatsapp_message"
  | "cancellation_message"
  | "schedule_reminder_message"
>;

export const DEFAULT_SETTINGS: UserSettingsInput = {
  maintenance_days_default: 21,
  reminder_days_before: 3,
  default_whatsapp_message: "Oi, {nome}! Sua manutenção de cílios está chegando. Quer agendar?",
  cancellation_message: "Oi, {nome}! Preciso cancelar seu atendimento. Podemos remarcar?",
  schedule_reminder_message: "Oi, {nome}! Já está na hora de agendar sua manutenção de cílios.",
};

function normalize(input: UserSettingsInput): UserSettingsInput {
  return {
    maintenance_days_default: Math.max(1, Number(input.maintenance_days_default || 21)),
    reminder_days_before: Math.max(0, Number(input.reminder_days_before || 0)),
    default_whatsapp_message:
      input.default_whatsapp_message.trim() || DEFAULT_SETTINGS.default_whatsapp_message,
    cancellation_message:
      input.cancellation_message.trim() || DEFAULT_SETTINGS.cancellation_message,
    schedule_reminder_message:
      input.schedule_reminder_message.trim() || DEFAULT_SETTINGS.schedule_reminder_message,
  };
}

export async function getUserSettings(): Promise<UserSettings> {
  const userId = await getAuthenticatedUserId();
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throwSupabaseError(error, "Erro ao carregar configurações.");
  if (data) return data as UserSettings;

  return saveUserSettings(DEFAULT_SETTINGS);
}

export async function saveUserSettings(input: UserSettingsInput): Promise<UserSettings> {
  const userId = await getAuthenticatedUserId();
  const { data, error } = await supabase
    .from("user_settings")
    .upsert({ user_id: userId, ...normalize(input) }, { onConflict: "user_id" })
    .select()
    .single();

  if (error) throwSupabaseError(error, "Erro ao salvar configurações.");
  return data as UserSettings;
}
