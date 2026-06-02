import { supabase } from "@/integrations/supabase/client";

type ErrorLike = {
  code?: string;
  details?: string;
  hint?: string;
  message?: string;
};

function getErrorText(error: unknown) {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;

  const item = error as ErrorLike;
  return [item.code, item.message, item.details, item.hint].filter(Boolean).join(" ");
}

export function getSupabaseErrorMessage(
  error: unknown,
  fallback = "Não foi possível concluir a operação.",
) {
  const text = getErrorText(error);
  const normalized = text.toLowerCase();

  if (
    normalized.includes("relation") ||
    normalized.includes("schema cache") ||
    normalized.includes("could not find the table") ||
    normalized.includes("42p01") ||
    normalized.includes("pgrst204")
  ) {
    return "Banco de dados ainda não está atualizado. Aplique as migrations do Supabase.";
  }

  if (
    normalized.includes("row-level security") ||
    normalized.includes("violates row-level security") ||
    normalized.includes("permission denied") ||
    normalized.includes("42501")
  ) {
    return "Você não tem permissão para alterar esse registro.";
  }

  if (
    normalized.includes("jwt") ||
    normalized.includes("not authenticated") ||
    normalized.includes("auth session missing") ||
    normalized.includes("invalid login credentials")
  ) {
    return "Sua sessão expirou ou suas credenciais estão incorretas.";
  }

  if (normalized.includes("foreign key") || normalized.includes("23503")) {
    if (normalized.includes("client")) return "Selecione uma cliente válida.";
    if (normalized.includes("product") || normalized.includes("glue")) {
      return "Selecione um produto válido.";
    }
    return "Existe um vínculo inválido neste registro.";
  }

  if (normalized.includes("duplicate key") || normalized.includes("23505")) {
    return "Já existe um registro com essas informações.";
  }

  if (
    normalized.includes("not-null") ||
    normalized.includes("null value") ||
    normalized.includes("23502")
  ) {
    return "Preencha todos os campos obrigatórios.";
  }

  if (
    normalized.includes("invalid input syntax") ||
    normalized.includes("invalid uuid") ||
    normalized.includes("22p02")
  ) {
    return "O registro informado é inválido.";
  }

  if (normalized.includes("pgrst116") || normalized.includes("no rows")) {
    return "Registro não encontrado.";
  }

  return text || fallback;
}

export function throwSupabaseError(error: unknown, fallback?: string): never {
  throw new Error(getSupabaseErrorMessage(error, fallback));
}

export async function getAuthenticatedUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throwSupabaseError(error, "Não foi possível validar sua sessão.");
  const userId = data.user?.id;
  if (!userId) throw new Error("Você precisa estar logado para continuar.");
  return userId;
}
