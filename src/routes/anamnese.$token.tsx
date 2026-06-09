import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { BrandMark } from "@/components/app/brand-mark";
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
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/anamnese/$token")({
  head: () => ({ meta: [{ title: "Anamnese - Lash Panel" }] }),
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
    <main className="app-background min-h-screen px-4 py-6 text-foreground sm:px-6">
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <header className="beauty-panel rounded-2xl p-5 sm:p-6">
          <BrandMark />
          <div className="mt-6">
            <Badge variant="secondary">Anamnese segura</Badge>
            <h1 className="display-title mt-3 text-4xl text-foreground sm:text-5xl">
              {tokenInfo?.business_name ?? "Lash Panel"}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Responda com calma. Suas informações ajudam a profissional a realizar um atendimento
              mais seguro.
            </p>
          </div>
        </header>

        {isLoading && (
          <div className="beauty-card rounded-2xl p-5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-3 h-28 w-full" />
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
          <form onSubmit={handleSubmit} className="space-y-5">
            <section className="beauty-card rounded-2xl p-5">
              <p className="text-xs font-bold uppercase text-muted-foreground">Cliente</p>
              <p className="mt-1 text-xl font-bold">{tokenInfo.client_name}</p>
              {tokenInfo.professional_name && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Profissional: {tokenInfo.professional_name}
                </p>
              )}
            </section>

            <section className="grid gap-3 md:grid-cols-2">
              {ANAMNESIS_QUESTIONS.map((question) => (
                <QuestionToggle
                  key={question.key}
                  label={question.label}
                  value={Boolean(answers[question.key])}
                  onChange={(checked) => setAnswers({ ...answers, [question.key]: checked })}
                />
              ))}
            </section>

            <section className="beauty-card space-y-3 rounded-2xl p-5">
              <Label htmlFor="public-anamnesis-notes">Observações adicionais</Label>
              <Textarea
                id="public-anamnesis-notes"
                rows={4}
                value={answers.additional_notes}
                onChange={(event) =>
                  setAnswers({ ...answers, additional_notes: event.target.value })
                }
                placeholder="Conte aqui qualquer informação importante para o atendimento."
              />
            </section>

            <section className="beauty-card rounded-2xl p-5">
              <label className="flex items-start gap-3 text-sm">
                <Checkbox
                  checked={answers.accepted_terms}
                  onCheckedChange={(value) =>
                    setAnswers({ ...answers, accepted_terms: value === true })
                  }
                  className="mt-0.5"
                />
                <span>
                  Li e aceito o termo de responsabilidade para o procedimento. Confirmo que as
                  respostas são verdadeiras.
                </span>
              </label>
              <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />O link é individual e só pode ser
                usado enquanto estiver válido.
              </p>
              <label className="mt-4 flex items-start gap-3 text-sm">
                <Checkbox
                  checked={answers.image_authorization}
                  onCheckedChange={(value) =>
                    setAnswers({ ...answers, image_authorization: value === true })
                  }
                  className="mt-0.5"
                />
                <span>
                  Autorizo o registro de fotos e vídeos do procedimento e a publicação em redes
                  sociais, portfólio e demais plataformas utilizadas pela profissional.
                </span>
              </label>
            </section>

            <Button type="submit" className="h-12 w-full" disabled={mutation.isPending}>
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
    <div className="beauty-card rounded-2xl p-6 text-center">
      {success && <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-primary" />}
      <h2 className="font-serif text-3xl font-bold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function QuestionToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="beauty-card rounded-2xl p-4">
      <p className="text-sm font-bold text-foreground">{label}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          className={cn(
            "h-11 rounded-xl border text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-card text-muted-foreground",
          )}
          onClick={() => onChange(true)}
        >
          Sim
        </button>
        <button
          type="button"
          className={cn(
            "h-11 rounded-xl border text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            !value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-card text-muted-foreground",
          )}
          onClick={() => onChange(false)}
        >
          Não
        </button>
      </div>
    </div>
  );
}
