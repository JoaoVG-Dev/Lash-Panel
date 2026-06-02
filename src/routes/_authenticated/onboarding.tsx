import { useEffect, useState } from "react";
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { BrandMark } from "@/components/app/brand-mark";
import { PageHeader } from "@/components/app/page-shell";
import { ProfessionalSettingsFields } from "@/components/professional-settings-fields";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DEFAULT_SETTINGS,
  getUserSettings,
  isOnboardingComplete,
  isProfessionalProfileComplete,
  saveUserSettings,
  settingsToInput,
  type UserSettingsInput,
} from "@/lib/settings-api";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Primeira configuração — Lash Panel" }] }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState<UserSettingsInput>({
    ...DEFAULT_SETTINGS,
    working_days: [...DEFAULT_SETTINGS.working_days],
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["settings"],
    queryFn: getUserSettings,
  });

  useEffect(() => {
    if (!data) return;
    setForm(settingsToInput(data));
  }, [data]);

  const mutation = useMutation({
    mutationFn: (input: UserSettingsInput) => saveUserSettings(input, { completeOnboarding: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Perfil configurado");
      navigate({ to: "/dashboard", replace: true });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar perfil");
    },
  });

  const draftMutation = useMutation({
    mutationFn: (input: UserSettingsInput) =>
      saveUserSettings(input, { completeOnboarding: false }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Rascunho salvo");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar rascunho");
    },
  });

  if (isOnboardingComplete(data)) return <Navigate to="/dashboard" replace />;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isProfessionalProfileComplete(form)) {
      toast.error("Preencha nome do negócio, profissional, WhatsApp e dias de atendimento.");
      return;
    }
    mutation.mutate(form);
  };

  return (
    <form className="mx-auto max-w-4xl space-y-5" onSubmit={handleSubmit}>
      <div className="hidden md:block">
        <BrandMark />
      </div>

      <PageHeader
        eyebrow="Primeira configuração"
        title="Prepare seu painel"
        description="Essas informações aparecem nos links públicos, mensagens de WhatsApp e agenda da profissional."
        icon={Sparkles}
      />

      <div className="grid grid-cols-3 gap-2">
        {["Perfil", "Atendimento", "Mensagens"].map((step, index) => (
          <div
            key={step}
            className="beauty-card flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold text-foreground"
          >
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
              {index + 1}
            </span>
            <span className="truncate">{step}</span>
          </div>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error instanceof Error ? error.message : "Erro ao carregar perfil."}
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <ProfessionalSettingsFields form={form} onChange={setForm} showMessages={false} />
          <div className="beauty-panel sticky bottom-4 z-10 grid gap-2 rounded-2xl p-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              disabled={draftMutation.isPending || mutation.isPending}
              onClick={() => draftMutation.mutate(form)}
            >
              {draftMutation.isPending ? "Salvando..." : "Salvar e continuar depois"}
            </Button>
            <Button type="submit" disabled={mutation.isPending || draftMutation.isPending}>
              <CheckCircle2 className="h-4 w-4" />
              {mutation.isPending ? "Salvando..." : "Salvar e continuar"}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
