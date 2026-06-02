import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  ANAMNESIS_QUESTIONS,
  EMPTY_ANAMNESIS_ANSWERS,
  type AnamnesisAnswers,
} from "@/lib/anamnesis-api";
import {
  getPublicAnamnesisToken,
  isPublicAnamnesisTokenUsable,
  submitPublicAnamnesis,
} from "@/lib/anamnesis-public-api";

export const Route = createFileRoute("/anamnese/$token")({
  head: () => ({ meta: [{ title: "Anamnese - Lash Manager" }] }),
  component: PublicAnamnesisPage,
});

function PublicAnamnesisPage() {
  const { token } = Route.useParams();
  const [answers, setAnswers] = useState<AnamnesisAnswers>(EMPTY_ANAMNESIS_ANSWERS);
  const [submitted, setSubmitted] = useState(false);

  const {
    data: tokenInfo,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["public-anamnesis", token],
    queryFn: () => getPublicAnamnesisToken(token),
  });

  const mutation = useMutation({
    mutationFn: () => submitPublicAnamnesis(token, answers),
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar anamnese.");
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!answers.accepted_terms) {
      toast.error("Marque o aceite do termo de responsabilidade para enviar.");
      return;
    }
    mutation.mutate();
  };

  const invalidMessage = getInvalidMessage(tokenInfo);

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground">
      <div className="mx-auto w-full max-w-md space-y-4">
        <header className="rounded-xl border bg-card p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <Badge variant="secondary">Anamnese</Badge>
              <h1 className="mt-2 text-xl font-semibold tracking-tight">
                {tokenInfo?.business_name ?? "Lash Manager"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Formulário de segurança antes do atendimento.
              </p>
            </div>
          </div>
        </header>

        {isLoading && (
          <div className="rounded-xl border bg-card p-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-3 h-24 w-full" />
          </div>
        )}

        {isError && (
          <StatusCard
            title="Link indisponível"
            description={
              error instanceof Error ? error.message : "Não foi possível abrir este link."
            }
          />
        )}

        {!isLoading && !isError && (!tokenInfo || invalidMessage) && (
          <StatusCard
            title="Link indisponível"
            description={invalidMessage ?? "Peça um novo link de anamnese à profissional."}
          />
        )}

        {submitted && (
          <StatusCard
            success
            title="Anamnese enviada"
            description="Obrigada. Suas respostas foram registradas e a profissional já pode consultar no painel."
          />
        )}

        {!submitted && tokenInfo && !invalidMessage && (
          <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Cliente</p>
              <p className="text-base font-semibold">{tokenInfo.client_name}</p>
              {tokenInfo.professional_name && (
                <p className="text-sm text-muted-foreground">
                  Profissional: {tokenInfo.professional_name}
                </p>
              )}
            </div>

            <div className="mt-5 space-y-3">
              {ANAMNESIS_QUESTIONS.map((question) => (
                <CheckboxRow
                  key={question.key}
                  label={question.label}
                  checked={Boolean(answers[question.key])}
                  onCheckedChange={(checked) => setAnswers({ ...answers, [question.key]: checked })}
                />
              ))}
            </div>

            <div className="mt-5 space-y-2">
              <Label htmlFor="public-anamnesis-notes">Observações adicionais</Label>
              <Textarea
                id="public-anamnesis-notes"
                rows={4}
                value={answers.additional_notes}
                onChange={(event) =>
                  setAnswers({ ...answers, additional_notes: event.target.value })
                }
              />
            </div>

            <div className="mt-5">
              <CheckboxRow
                label="Li e aceito o termo de responsabilidade para o procedimento."
                checked={answers.accepted_terms}
                onCheckedChange={(checked) => setAnswers({ ...answers, accepted_terms: checked })}
              />
            </div>

            <Button type="submit" className="mt-5 h-12 w-full" disabled={mutation.isPending}>
              {mutation.isPending ? "Enviando..." : "Enviar anamnese"}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}

function getInvalidMessage(
  tokenInfo: Awaited<ReturnType<typeof getPublicAnamnesisToken>> | null | undefined,
) {
  if (!tokenInfo) return "Este link de anamnese não foi encontrado.";
  if (tokenInfo.revoked_at) return "Este link foi cancelado pela profissional.";
  if (tokenInfo.used_at) return "Esta anamnese já foi preenchida por este link.";
  if (!isPublicAnamnesisTokenUsable(tokenInfo)) {
    return "Este link expirou. Peça um novo link de anamnese à profissional.";
  }
  return null;
}

function StatusCard({
  title,
  description,
  success = false,
}: {
  title: string;
  description: string;
  success?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 text-center">
      {success && <CheckCircle2 className="mx-auto mb-3 h-9 w-9 text-primary" />}
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function CheckboxRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 rounded-lg border bg-background p-3 text-sm">
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        className="mt-0.5"
      />
      <span className="text-foreground">{label}</span>
    </label>
  );
}
