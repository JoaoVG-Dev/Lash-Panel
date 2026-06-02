import { supabase } from "@/integrations/supabase/client";
import { getAuthenticatedUserId, throwSupabaseError } from "@/lib/supabase-errors";

export type WorkingDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export const WORKING_DAY_OPTIONS: Array<{ value: WorkingDay; label: string }> = [
  { value: "monday", label: "Seg" },
  { value: "tuesday", label: "Ter" },
  { value: "wednesday", label: "Qua" },
  { value: "thursday", label: "Qui" },
  { value: "friday", label: "Sex" },
  { value: "saturday", label: "Sáb" },
  { value: "sunday", label: "Dom" },
];

export type UserSettings = {
  id: string;
  user_id: string;
  business_name: string | null;
  professional_name: string | null;
  whatsapp_phone: string | null;
  instagram: string | null;
  business_description: string | null;
  maintenance_days_default: number;
  reminder_days_before: number;
  working_days: WorkingDay[];
  opening_time: string;
  closing_time: string;
  default_whatsapp_message: string;
  cancellation_message: string;
  schedule_reminder_message: string;
  appointment_confirmation_message: string;
  anamnesis_link_message: string;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type UserSettingsInput = Pick<
  UserSettings,
  | "business_name"
  | "professional_name"
  | "whatsapp_phone"
  | "instagram"
  | "business_description"
  | "maintenance_days_default"
  | "reminder_days_before"
  | "working_days"
  | "opening_time"
  | "closing_time"
  | "default_whatsapp_message"
  | "cancellation_message"
  | "schedule_reminder_message"
  | "appointment_confirmation_message"
  | "anamnesis_link_message"
  | "onboarding_completed_at"
>;

export const DEFAULT_SETTINGS: UserSettingsInput = {
  business_name: "",
  professional_name: "",
  whatsapp_phone: "",
  instagram: "",
  business_description: "",
  maintenance_days_default: 21,
  reminder_days_before: 3,
  working_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  opening_time: "09:00",
  closing_time: "18:00",
  default_whatsapp_message: "Oi, {nome}! Sua manutenção de cílios está chegando. Quer agendar?",
  cancellation_message: "Oi, {nome}! Preciso cancelar seu atendimento. Podemos remarcar?",
  schedule_reminder_message: "Oi, {nome}! Já está na hora de agendar sua manutenção de cílios.",
  appointment_confirmation_message:
    "Oi, {nome}! Seu atendimento com {profissional} está confirmado para {data} às {horario}.",
  anamnesis_link_message:
    "Oi, {nome}! Antes do atendimento, preencha sua anamnese por este link: {link_anamnese}",
  onboarding_completed_at: null,
};

function normalizeText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizePhone(value: string | null | undefined) {
  const normalized = value?.replace(/\D/g, "");
  return normalized ? normalized : null;
}

function normalizeTime(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;
  return value.slice(0, 5);
}

function normalizeWorkingDays(days: WorkingDay[] | null | undefined) {
  const allowed = new Set(WORKING_DAY_OPTIONS.map((day) => day.value));
  const unique = Array.from(new Set(days ?? [])).filter((day) => allowed.has(day));
  return unique.length ? unique : DEFAULT_SETTINGS.working_days;
}

function normalize(input: UserSettingsInput): UserSettingsInput {
  return {
    business_name: normalizeText(input.business_name),
    professional_name: normalizeText(input.professional_name),
    whatsapp_phone: normalizePhone(input.whatsapp_phone),
    instagram: normalizeText(input.instagram),
    business_description: normalizeText(input.business_description),
    maintenance_days_default: Math.max(1, Number(input.maintenance_days_default || 21)),
    reminder_days_before: Math.max(0, Number(input.reminder_days_before || 0)),
    working_days: normalizeWorkingDays(input.working_days),
    opening_time: normalizeTime(input.opening_time, DEFAULT_SETTINGS.opening_time),
    closing_time: normalizeTime(input.closing_time, DEFAULT_SETTINGS.closing_time),
    default_whatsapp_message:
      input.default_whatsapp_message.trim() || DEFAULT_SETTINGS.default_whatsapp_message,
    cancellation_message:
      input.cancellation_message.trim() || DEFAULT_SETTINGS.cancellation_message,
    schedule_reminder_message:
      input.schedule_reminder_message.trim() || DEFAULT_SETTINGS.schedule_reminder_message,
    appointment_confirmation_message:
      input.appointment_confirmation_message.trim() ||
      DEFAULT_SETTINGS.appointment_confirmation_message,
    anamnesis_link_message:
      input.anamnesis_link_message.trim() || DEFAULT_SETTINGS.anamnesis_link_message,
    onboarding_completed_at: input.onboarding_completed_at,
  };
}

export function settingsToInput(settings: UserSettings | null | undefined): UserSettingsInput {
  if (!settings) return { ...DEFAULT_SETTINGS, working_days: [...DEFAULT_SETTINGS.working_days] };

  return {
    business_name: settings.business_name ?? "",
    professional_name: settings.professional_name ?? "",
    whatsapp_phone: settings.whatsapp_phone ?? "",
    instagram: settings.instagram ?? "",
    business_description: settings.business_description ?? "",
    maintenance_days_default: settings.maintenance_days_default,
    reminder_days_before: settings.reminder_days_before,
    working_days: settings.working_days ?? DEFAULT_SETTINGS.working_days,
    opening_time: settings.opening_time?.slice(0, 5) ?? DEFAULT_SETTINGS.opening_time,
    closing_time: settings.closing_time?.slice(0, 5) ?? DEFAULT_SETTINGS.closing_time,
    default_whatsapp_message: settings.default_whatsapp_message,
    cancellation_message: settings.cancellation_message,
    schedule_reminder_message: settings.schedule_reminder_message,
    appointment_confirmation_message: settings.appointment_confirmation_message,
    anamnesis_link_message: settings.anamnesis_link_message,
    onboarding_completed_at: settings.onboarding_completed_at,
  };
}

export function isProfessionalProfileComplete(settings: UserSettings | UserSettingsInput) {
  return Boolean(
    settings.business_name?.trim() &&
    settings.professional_name?.trim() &&
    settings.whatsapp_phone?.trim() &&
    settings.opening_time &&
    settings.closing_time &&
    settings.working_days.length,
  );
}

export function isOnboardingComplete(settings: UserSettings | null | undefined) {
  return Boolean(settings?.onboarding_completed_at && isProfessionalProfileComplete(settings));
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

export async function saveUserSettings(
  input: UserSettingsInput,
  options: { completeOnboarding?: boolean } = {},
): Promise<UserSettings> {
  const userId = await getAuthenticatedUserId();
  const normalized = normalize(input);

  const { data, error } = await supabase
    .from("user_settings")
    .upsert(
      {
        user_id: userId,
        ...normalized,
        onboarding_completed_at: options.completeOnboarding
          ? new Date().toISOString()
          : normalized.onboarding_completed_at,
      },
      { onConflict: "user_id" },
    )
    .select()
    .single();

  if (error) throwSupabaseError(error, "Erro ao salvar configurações.");
  return data as UserSettings;
}
