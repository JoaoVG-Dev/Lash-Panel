import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

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
};

export type ClientAnamnesis = {
  id: string;
  user_id: string;
  client_id: string;
  answers: AnamnesisAnswers;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
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

  if (error) throw error;
  return data ? normalizeRecord(data) : null;
}

export async function saveClientAnamnesis(
  clientId: string,
  answers: AnamnesisAnswers,
): Promise<ClientAnamnesis> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("Não autenticado");

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

  if (error) throw error;
  return normalizeRecord(data);
}
