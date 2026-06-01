import { supabase } from "@/integrations/supabase/client";

export type ProcedureType = "colocacao" | "manutencao";

export type TechnicalRecordGlueProduct = {
  id: string;
  name: string;
  brand: string | null;
};

export type TechnicalRecord = {
  id: string;
  user_id: string;
  client_id: string;
  procedure_type: ProcedureType | string;
  lash_model: string | null;
  curl: string | null;
  thickness: string | null;
  sizes_used: string[];
  volume: string | null;
  glue_used: string | null;
  glue_product_id: string | null;
  glue_product?: TechnicalRecordGlueProduct | null;
  application_date: string;
  maintenance_days: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type TechnicalRecordInput = {
  procedure_type: ProcedureType;
  lash_model?: string | null;
  curl?: string | null;
  thickness?: string | null;
  sizes_used?: string[];
  volume?: string | null;
  glue_product_id?: string | null;
  glue_used?: string | null;
  application_date: string;
  maintenance_days: number;
  notes?: string | null;
};

export const PROCEDURE_TYPE_OPTIONS: Array<{ value: ProcedureType; label: string }> = [
  { value: "colocacao", label: "Colocação" },
  { value: "manutencao", label: "Manutenção" },
];

function normalizeSizes(values: string[] | undefined) {
  return (values ?? []).map((value) => value.trim()).filter(Boolean);
}

function normalize(input: TechnicalRecordInput) {
  return {
    procedure_type: input.procedure_type,
    lash_model: input.lash_model?.trim() || null,
    curl: input.curl?.trim() || null,
    thickness: input.thickness?.trim() || null,
    sizes_used: normalizeSizes(input.sizes_used),
    volume: input.volume?.trim() || null,
    glue_product_id: input.glue_product_id || null,
    glue_used: input.glue_used?.trim() || null,
    application_date: input.application_date,
    maintenance_days: Number.isFinite(input.maintenance_days) ? input.maintenance_days : 21,
    notes: input.notes?.trim() || null,
  };
}

function normalizeRecord(record: TechnicalRecord): TechnicalRecord {
  return {
    ...record,
    sizes_used: Array.isArray(record.sizes_used)
      ? record.sizes_used
      : String(record.sizes_used ?? "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
    maintenance_days: Number(record.maintenance_days ?? 21),
  };
}

export function getProcedureTypeLabel(type: string) {
  if (type === "colocacao") return "Colocação";
  if (type === "manutencao") return "Manutenção";
  return type;
}

export function getGlueDisplayName(record: TechnicalRecord) {
  if (record.glue_product) {
    return record.glue_product.brand
      ? `${record.glue_product.name} • ${record.glue_product.brand}`
      : record.glue_product.name;
  }

  return record.glue_used;
}

export async function listTechnicalRecords(clientId: string): Promise<TechnicalRecord[]> {
  const { data, error } = await supabase
    .from("client_technical_records")
    .select("*, glue_product:products(id,name,brand)")
    .eq("client_id", clientId)
    .order("application_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as TechnicalRecord[]).map(normalizeRecord);
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
    .select("*, glue_product:products(id,name,brand)")
    .single();
  if (error) throw error;
  return normalizeRecord(data as TechnicalRecord);
}

export async function updateTechnicalRecord(
  id: string,
  input: TechnicalRecordInput,
): Promise<TechnicalRecord> {
  const { data, error } = await supabase
    .from("client_technical_records")
    .update(normalize(input))
    .eq("id", id)
    .select("*, glue_product:products(id,name,brand)")
    .single();
  if (error) throw error;
  return normalizeRecord(data as TechnicalRecord);
}

export async function deleteTechnicalRecord(id: string): Promise<void> {
  const { error } = await supabase.from("client_technical_records").delete().eq("id", id);
  if (error) throw error;
}
