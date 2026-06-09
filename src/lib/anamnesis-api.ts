import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { getAuthenticatedUserId, throwSupabaseError } from "@/lib/supabase-errors";

export type AnamnesisAnswers = {
  uses_contact_lenses: boolean;
  has_allergy: boolean;
  glue_or_cosmetic_allergy: boolean;
  recent_eye_procedure: boolean;
  pregnant: boolean;
  eye_sensitivity: boolean;
  uses_medication: boolean;
  additional_notes: string;
  accepted_terms: boolean;
  has_glaucoma: boolean;
  has_blepharitis: boolean;
  image_authorization: boolean;
};

export type BooleanAnamnesisKey = Exclude<keyof AnamnesisAnswers, "additional_notes">;

export const ANAMNESIS_QUESTIONS: Array<{ key: BooleanAnamnesisKey; label: string }> = [
  { key: "uses_contact_lenses", label: "Usa lentes de contato?" },
  { key: "has_allergy", label: "Possui alguma alergia?" },
  { key: "glue_or_cosmetic_allergy", label: "Tem alergia a cola ou cosméticos?" },
  { key: "recent_eye_procedure", label: "Fez procedimento recente nos olhos?" },
  { key: "pregnant", label: "Está grávida?" },
  { key: "eye_sensitivity", label: "Tem sensibilidade ocular?" },
  { key: "uses_medication", label: "Usa algum medicamento?" },
  { key: "has_glaucoma", label: "Possui glaucoma?" },
  { key: "has_blepharitis", label: "Possui blefarite?" },
];

export type ClientAnamnesis = {
  id: string;
  user_id: string;
  client_id: string;
  answers: AnamnesisAnswers;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PendingAnamnesisClient = {
  id: string;
  name: string;
  phone: string;
  status: string;
  created_at: string;
};

export const EMPTY_ANAMNESIS_ANSWERS: AnamnesisAnswers = {
  uses_contact_lenses: false,
  has_allergy: false,
  glue_or_cosmetic_allergy: false,
  recent_eye_procedure: false,
  pregnant: false,
  eye_sensitivity: false,
  uses_medication: false,
  additional_notes: "",
  accepted_terms: false,
  has_glaucoma: false,
  has_blepharitis: false,
  image_authorization: false,
};

function normalizeAnswers(answers: Partial<AnamnesisAnswers> | null | undefined): AnamnesisAnswers {
  return {
    ...EMPTY_ANAMNESIS_ANSWERS,
    ...(answers ?? {}),
    additional_notes: answers?.additional_notes?.trim() ?? "",
  };
}

function normalizeRecord(record: Omit<ClientAnamnesis, "answers"> & { answers: Json }) {
  return {
    ...record,
    answers: normalizeAnswers(record.answers as Partial<AnamnesisAnswers>),
  } as ClientAnamnesis;
}

export async function getClientAnamnesis(clientId: string): Promise<ClientAnamnesis | null> {
  const { data, error } = await supabase
    .from("client_anamnesis")
    .select("*")
    .eq("client_id", clientId)
    .maybeSingle();

  if (error) throwSupabaseError(error, "Erro ao carregar anamnese.");
  return data ? normalizeRecord(data) : null;
}

export async function saveClientAnamnesis(
  clientId: string,
  answers: AnamnesisAnswers,
): Promise<ClientAnamnesis> {
  const userId = await getAuthenticatedUserId();

  const payload = {
    user_id: userId,
    client_id: clientId,
    answers: normalizeAnswers(answers) as unknown as Json,
    completed_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("client_anamnesis")
    .upsert(payload, { onConflict: "user_id,client_id" })
    .select()
    .single();

  if (error) throwSupabaseError(error, "Erro ao salvar anamnese.");
  return normalizeRecord(data);
}

export async function listClientsWithPendingAnamnesis(
  limit = 5,
): Promise<PendingAnamnesisClient[]> {
  const [clientsResult, anamnesisResult] = await Promise.all([
    supabase
      .from("clients")
      .select("id,name,phone,status,created_at")
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    supabase.from("client_anamnesis").select("client_id"),
  ]);

  if (clientsResult.error) {
    throwSupabaseError(clientsResult.error, "Erro ao carregar clientes.");
  }

  if (anamnesisResult.error) {
    throwSupabaseError(anamnesisResult.error, "Erro ao carregar anamneses.");
  }

  const filledClientIds = new Set((anamnesisResult.data ?? []).map((item) => item.client_id));

  return ((clientsResult.data ?? []) as PendingAnamnesisClient[])
    .filter((client) => !filledClientIds.has(client.id))
    .slice(0, limit);
}
