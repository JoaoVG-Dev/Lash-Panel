import { supabase } from "@/integrations/supabase/client";

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
  if (error) throw error;
  return (data ?? []) as Client[];
}

export async function getClient(id: string): Promise<Client> {
  const { data, error } = await supabase.from("clients").select("*").eq("id", id).single();
  if (error) throw error;
  return data as Client;
}

export async function createClient(input: ClientInput): Promise<Client> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("Não autenticado");

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
  if (error) throw error;
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
  if (error) throw error;
  return data as Client;
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
}

export async function countClients(): Promise<number> {
  const { count, error } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}
