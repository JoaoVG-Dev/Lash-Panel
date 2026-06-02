import { supabase } from "@/integrations/supabase/client";
import {
  getAuthenticatedUserId,
  getSupabaseErrorMessage,
  throwSupabaseError,
} from "@/lib/supabase-errors";

export type ProductBrandStatus = "active" | "inactive";

export type ProductBrand = {
  id: string;
  user_id: string;
  name: string;
  normalized_name: string;
  description: string | null;
  status: ProductBrandStatus;
  created_at: string;
  updated_at: string;
};

export type ProductBrandInput = {
  name: string;
  description?: string | null;
  status?: ProductBrandStatus;
};

export function normalizeBrandName(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function sanitizeBrandInput(input: ProductBrandInput) {
  const name = input.name.trim().replace(/\s+/g, " ");
  const normalizedName = normalizeBrandName(name);

  if (!normalizedName) {
    throw new Error("Informe o nome da marca.");
  }

  return {
    name,
    normalized_name: normalizedName,
    description: input.description?.trim() || null,
    status: input.status ?? "active",
  };
}

function isDuplicateBrandError(error: unknown) {
  const message = getSupabaseErrorMessage(error).toLowerCase();
  return (
    message.includes("já existe") || message.includes("duplicate") || message.includes("23505")
  );
}

export async function listBrands(
  options: { includeInactive?: boolean } = {},
): Promise<ProductBrand[]> {
  let query = supabase.from("product_brands").select("*").order("name", { ascending: true });

  if (!options.includeInactive) {
    query = query.eq("status", "active");
  }

  const { data, error } = await query;
  if (error) throwSupabaseError(error, "Erro ao carregar marcas.");
  return (data ?? []) as ProductBrand[];
}

export async function createBrand(input: ProductBrandInput): Promise<ProductBrand> {
  const userId = await getAuthenticatedUserId();
  const payload = sanitizeBrandInput(input);

  const { data, error } = await supabase
    .from("product_brands")
    .insert({ user_id: userId, ...payload })
    .select()
    .single();

  if (error) {
    if (isDuplicateBrandError(error)) throw new Error("Essa marca já existe.");
    throwSupabaseError(error, "Erro ao criar marca.");
  }

  return data as ProductBrand;
}

export async function updateBrand(id: string, input: ProductBrandInput): Promise<ProductBrand> {
  const payload = sanitizeBrandInput(input);

  const { data, error } = await supabase
    .from("product_brands")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (isDuplicateBrandError(error)) throw new Error("Essa marca já existe.");
    throwSupabaseError(error, "Erro ao atualizar marca.");
  }

  return data as ProductBrand;
}

export async function deactivateBrand(id: string): Promise<ProductBrand> {
  const { data, error } = await supabase
    .from("product_brands")
    .update({ status: "inactive" })
    .eq("id", id)
    .select()
    .single();

  if (error) throwSupabaseError(error, "Erro ao inativar marca.");
  return data as ProductBrand;
}

export async function getOrCreateBrandByName(name: string): Promise<ProductBrand> {
  const userId = await getAuthenticatedUserId();
  const payload = sanitizeBrandInput({ name });

  const { data: existing, error: findError } = await supabase
    .from("product_brands")
    .select("*")
    .eq("normalized_name", payload.normalized_name)
    .maybeSingle();

  if (findError) throwSupabaseError(findError, "Erro ao buscar marca.");

  if (existing) {
    const brand = existing as ProductBrand;
    if (brand.status === "active") return brand;

    const { data, error } = await supabase
      .from("product_brands")
      .update({ status: "active" })
      .eq("id", brand.id)
      .select()
      .single();

    if (error) throwSupabaseError(error, "Erro ao reativar marca.");
    return data as ProductBrand;
  }

  const { data, error } = await supabase
    .from("product_brands")
    .insert({ user_id: userId, ...payload })
    .select()
    .single();

  if (error) {
    if (isDuplicateBrandError(error)) {
      const { data: duplicate, error: duplicateError } = await supabase
        .from("product_brands")
        .select("*")
        .eq("normalized_name", payload.normalized_name)
        .maybeSingle();

      if (duplicateError) throwSupabaseError(duplicateError, "Erro ao buscar marca existente.");
      if (duplicate) return duplicate as ProductBrand;
      throw new Error("Essa marca já existe.");
    }

    throwSupabaseError(error, "Erro ao criar marca.");
  }

  return data as ProductBrand;
}
