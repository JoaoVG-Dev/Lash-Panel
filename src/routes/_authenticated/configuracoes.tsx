import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Settings2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/page-shell";
import { ProfessionalSettingsFields } from "@/components/professional-settings-fields";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DEFAULT_SETTINGS,
  getUserSettings,
  isProfessionalProfileComplete,
  saveUserSettings,
  settingsToInput,
  type UserSettingsInput,
} from "@/lib/settings-api";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — Lash Panel" }] }),
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
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
    mutationFn: (input: UserSettingsInput) =>
      saveUserSettings(input, {
        completeOnboarding: Boolean(data?.onboarding_completed_at),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Configurações salvas");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar configurações");
    },
  });

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
      <PageHeader
        eyebrow="Seu negócio"
        title="Configurações"
        description="Edite o perfil profissional, horários e mensagens padrão usadas nos fluxos do painel."
        icon={Settings2}
      />

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error instanceof Error ? error.message : "Erro ao carregar configurações."}
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <ProfessionalSettingsFields form={form} onChange={setForm} />

          <div className="beauty-panel sticky bottom-20 z-10 rounded-2xl p-2 md:bottom-6">
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              <Save className="h-4 w-4" />
              {mutation.isPending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
