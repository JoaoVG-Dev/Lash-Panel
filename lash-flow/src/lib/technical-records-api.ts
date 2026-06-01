import { supabase } from "@/integrations/supabase/client";

export type TechnicalRecord = {
  id: string;
  user_id: string;
  client_id: string;
  procedure_type: string;
  lash_model: string | null;
  curl: string | null;
  thickness: string | null;
  sizes_used: string | null;
  volume: string | null;
  glue_used: string | null;
  application_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type TechnicalRecordInput = {
  procedure_type: string;
  lash_model?: string | null;
  curl?: string | null;
  thickness?: string | null;
  sizes_used?: string | null;
  volume?: string | null;
  glue_used?: string | null;
  application_date: string;
  notes?: string | null;
};

function normalize(input: TechnicalRecordInput) {
  return {
    procedure_type: input.procedure_type.trim(),
    lash_model: input.lash_model?.trim() || null,
    curl: input.curl?.trim() || null,
    thickness: input.thickness?.trim() || null,
    sizes_used: input.sizes_used?.trim() || null,
    volume: input.volume?.trim() || null,
    glue_used: input.glue_used?.trim() || null,
    application_date: input.application_date,
    notes: input.notes?.trim() || null,
  };
}

export async function listTechnicalRecords(clientId: string): Promise<TechnicalRecord[]> {
  const { data, error } = await supabase
    .from("client_technical_records")
    .select("*")
    .eq("client_id", clientId)
    .order("application_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as TechnicalRecord[];
}

export async function createTechnicalRecord(
  clientId: string,
  input: TechnicalRecordInput,
): Promise<TechnicalRecord> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("Não autenticado");

  const { data, error } = await supabase
    .from("client_technical_records")
    .insert({ user_id: userId, client_id: clientId, ...normalize(input) })
    .select()
    .single();
  if (error) throw error;
  return data as TechnicalRecord;
}

export async function updateTechnicalRecord(
  id: string,
  input: TechnicalRecordInput,
): Promise<TechnicalRecord> {
  const { data, error } = await supabase
    .from("client_technical_records")
    .update(normalize(input))
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as TechnicalRecord;
}

export async function deleteTechnicalRecord(id: string): Promise<void> {
  const { error } = await supabase
    .from("client_technical_records")
    .delete()
    .eq("id", id);
  if (error) throw error;
}