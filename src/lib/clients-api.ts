import { supabase } from "@/integrations/supabase/client";
import { getAuthenticatedUserId, throwSupabaseError } from "@/lib/supabase-errors";

export type ClientStatus = "active" | "inactive";

export type Client = {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  instagram: string | null;
  birth_date: string | null;
  notes: string | null;
  status: ClientStatus;
  created_at: string;
  updated_at: string;
};

export type ClientInput = {
  name: string;
  phone: string;
  instagram?: string | null;
  birth_date?: string | null;
  notes?: string | null;
  status: ClientStatus;
};

export async function listClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("name", { ascending: true });
  if (error) throwSupabaseError(error, "Erro ao carregar clientes.");
  return (data ?? []) as Client[];
}

export async function getClient(id: string): Promise<Client> {
  const { data, error } = await supabase.from("clients").select("*").eq("id", id).single();
  if (error) throwSupabaseError(error, "Cliente não encontrada.");
  return data as Client;
}

export async function createClient(input: ClientInput): Promise<Client> {
  const userId = await getAuthenticatedUserId();

  const payload = {
    user_id: userId,
    name: input.name.trim(),
    phone: input.phone.trim(),
    instagram: input.instagram?.trim() || null,
    birth_date: input.birth_date || null,
    notes: input.notes?.trim() || null,
    status: input.status,
  };

  const { data, error } = await supabase.from("clients").insert(payload).select().single();
  if (error) throwSupabaseError(error, "Erro ao criar cliente.");
  return data as Client;
}

export async function updateClient(id: string, input: ClientInput): Promise<Client> {
  const payload = {
    name: input.name.trim(),
    phone: input.phone.trim(),
    instagram: input.instagram?.trim() || null,
    birth_date: input.birth_date || null,
    notes: input.notes?.trim() || null,
    status: input.status,
  };
  const { data, error } = await supabase
    .from("clients")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throwSupabaseError(error, "Erro ao atualizar cliente.");
  return data as Client;
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throwSupabaseError(error, "Erro ao excluir cliente.");
}

export async function countClients(): Promise<number> {
  const { count, error } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true });
  if (error) throwSupabaseError(error, "Erro ao contar clientes.");
  return count ?? 0;
}

export async function countActiveClients(): Promise<number> {
  const { count, error } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");
  if (error) throwSupabaseError(error, "Erro ao contar clientes ativas.");
  return count ?? 0;
}
