import { supabase } from "@/integrations/supabase/client";
import type { Json, Tables } from "@/integrations/supabase/types";
import { EMPTY_ANAMNESIS_ANSWERS, type AnamnesisAnswers } from "@/lib/anamnesis-api";
import { getAuthenticatedUserId, throwSupabaseError } from "@/lib/supabase-errors";
import { normalizeWhatsAppPhone } from "@/lib/whatsapp-api";

export type AnamnesisPublicToken = Tables<"anamnesis_public_tokens">;

export type PublicAnamnesisTokenInfo = {
  token_id: string;
  client_name: string;
  business_name: string | null;
  professional_name: string | null;
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
};

function normalizePublicTokenError(error: unknown) {
  const text = error instanceof Error ? error.message : JSON.stringify(error ?? "");
  const normalized = text.toLowerCase();

  if (normalized.includes("invalid_token")) return "Link de anamnese inválido.";
  if (normalized.includes("expired_token")) {
    return "Este link de anamnese expirou. Peça um novo link à profissional.";
  }
  if (normalized.includes("used_token")) {
    return "Esta anamnese já foi preenchida por este link.";
  }
  if (normalized.includes("revoked_token")) {
    return "Este link de anamnese foi cancelado pela profissional.";
  }

  return null;
}

export function buildPublicAnamnesisUrl(token: string) {
  const path = `/anamnese/${encodeURIComponent(token)}`;
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

export function isPublicAnamnesisTokenUsable(info: PublicAnamnesisTokenInfo) {
  return !info.used_at && !info.revoked_at && new Date(info.expires_at).getTime() > Date.now();
}

export function buildAnamnesisLinkMessage(clientName: string, link: string) {
  return `Oi, ${clientName}! Antes do atendimento, preencha sua anamnese por este link: ${link}`;
}

export function canSendAnamnesisLinkByWhatsApp(phone: string) {
  return normalizeWhatsAppPhone(phone).length > 0;
}

export async function getLatestAnamnesisPublicToken(
  clientId: string,
): Promise<AnamnesisPublicToken | null> {
  const { data, error } = await supabase
    .from("anamnesis_public_tokens")
    .select("*")
    .eq("client_id", clientId)
    .is("used_at", null)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throwSupabaseError(error, "Erro ao carregar link de anamnese.");
  return data;
}

export async function createAnamnesisPublicToken(clientId: string): Promise<AnamnesisPublicToken> {
  const userId = await getAuthenticatedUserId();
  const now = new Date().toISOString();

  const { error: revokeError } = await supabase
    .from("anamnesis_public_tokens")
    .update({ revoked_at: now })
    .eq("user_id", userId)
    .eq("client_id", clientId)
    .is("used_at", null)
    .is("revoked_at", null);

  if (revokeError) throwSupabaseError(revokeError, "Erro ao renovar link de anamnese.");

  const { data, error } = await supabase
    .from("anamnesis_public_tokens")
    .insert({ user_id: userId, client_id: clientId })
    .select()
    .single();

  if (error) throwSupabaseError(error, "Erro ao gerar link de anamnese.");
  return data;
}

export async function getPublicAnamnesisToken(
  token: string,
): Promise<PublicAnamnesisTokenInfo | null> {
  const { data, error } = await supabase.rpc("get_public_anamnesis_token", {
    p_token: token,
  });

  if (error) {
    const message = normalizePublicTokenError(error);
    if (message) throw new Error(message);
    throwSupabaseError(error, "Erro ao carregar link de anamnese.");
  }

  return (data?.[0] as PublicAnamnesisTokenInfo | undefined) ?? null;
}

export async function submitPublicAnamnesis(
  token: string,
  answers: AnamnesisAnswers,
): Promise<string> {
  const payload: AnamnesisAnswers = {
    ...EMPTY_ANAMNESIS_ANSWERS,
    ...answers,
    additional_notes: answers.additional_notes.trim(),
  };

  const { data, error } = await supabase.rpc("submit_public_anamnesis", {
    p_token: token,
    p_answers: payload as unknown as Json,
  });

  if (error) {
    const message = normalizePublicTokenError(error);
    if (message) throw new Error(message);
    throwSupabaseError(error, "Erro ao enviar anamnese.");
  }

  return data;
}
