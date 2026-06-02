import { useEffect, useState } from "react";
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
  head: () => ({ meta: [{ title: "Primeira configuração — Lash Manager" }] }),
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
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">Configure seu perfil</h1>
        <p className="text-sm text-muted-foreground">
          Essas informações aparecem em links públicos, mensagens e agenda.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error instanceof Error ? error.message : "Erro ao carregar perfil."}
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <ProfessionalSettingsFields form={form} onChange={setForm} showMessages={false} />
          <Button type="submit" className="h-11 w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Salvando..." : "Começar"}
          </Button>
        </>
      )}
    </form>
  );
}
