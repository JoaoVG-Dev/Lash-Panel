import { supabase } from "@/integrations/supabase/client";
import { getAuthenticatedUserId, throwSupabaseError } from "@/lib/supabase-errors";

export type Service = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  price: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type ServiceInput = {
  name: string;
  description?: string | null;
  price: number;
  active: boolean;
};

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

function normalizeService(row: Service): Service {
  return {
    ...row,
    price: toNumber(row.price),
  };
}

function normalizeInput(input: ServiceInput) {
  const name = input.name.trim();
  const price = Number(input.price);

  if (!name) {
    throw new Error("Informe o nome do serviço.");
  }

  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Preço não pode ser negativo.");
  }

  return {
    name,
    description: input.description?.trim() || null,
    price,
    active: input.active,
  };
}

export async function listServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("name", { ascending: true });
  if (error) throwSupabaseError(error, "Erro ao carregar serviços.");
  return ((data ?? []) as Service[]).map(normalizeService);
}

export async function createService(input: ServiceInput): Promise<Service> {
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from("services")
    .insert({ user_id: userId, ...normalizeInput(input) })
    .select()
    .single();
  if (error) throwSupabaseError(error, "Erro ao criar serviço.");
  return normalizeService(data as Service);
}

export async function updateService(id: string, input: ServiceInput): Promise<Service> {
  const { data, error } = await supabase
    .from("services")
    .update(normalizeInput(input))
    .eq("id", id)
    .select()
    .single();
  if (error) throwSupabaseError(error, "Erro ao atualizar serviço.");
  return normalizeService(data as Service);
}

export async function deleteService(id: string): Promise<void> {
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) throwSupabaseError(error, "Erro ao excluir serviço.");
}
