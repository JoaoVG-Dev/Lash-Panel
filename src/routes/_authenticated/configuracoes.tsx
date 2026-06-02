import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_SETTINGS,
  getUserSettings,
  saveUserSettings,
  type UserSettingsInput,
} from "@/lib/settings-api";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — Lash Manager" }] }),
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<UserSettingsInput>(DEFAULT_SETTINGS);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["settings"],
    queryFn: getUserSettings,
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      maintenance_days_default: data.maintenance_days_default,
      reminder_days_before: data.reminder_days_before,
      default_whatsapp_message: data.default_whatsapp_message,
      cancellation_message: data.cancellation_message,
      schedule_reminder_message: data.schedule_reminder_message,
    });
  }, [data]);

  const mutation = useMutation({
    mutationFn: saveUserSettings,
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
    mutation.mutate(form);
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error instanceof Error ? error.message : "Erro ao carregar configurações."}
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <section className="space-y-3 rounded-xl border bg-card p-4">
            <h2 className="text-sm font-semibold text-foreground">Manutenção</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="maintenance-days">Prazo padrão</Label>
                <Input
                  id="maintenance-days"
                  type="number"
                  min={1}
                  value={form.maintenance_days_default}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      maintenance_days_default: Number(event.target.value || 21),
                    })
                  }
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reminder-days">Lembrete antes</Label>
                <Input
                  id="reminder-days"
                  type="number"
                  min={0}
                  value={form.reminder_days_before}
                  onChange={(event) =>
                    setForm({ ...form, reminder_days_before: Number(event.target.value || 0) })
                  }
                  className="h-11"
                />
              </div>
            </div>
          </section>

          <section className="space-y-3 rounded-xl border bg-card p-4">
            <h2 className="text-sm font-semibold text-foreground">Mensagens do WhatsApp</h2>
            <div className="space-y-2">
              <Label htmlFor="default-message">Lembrete de manutenção</Label>
              <Textarea
                id="default-message"
                rows={4}
                value={form.default_whatsapp_message}
                onChange={(event) =>
                  setForm({ ...form, default_whatsapp_message: event.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule-message">Lembrete para agendar</Label>
              <Textarea
                id="schedule-message"
                rows={4}
                value={form.schedule_reminder_message}
                onChange={(event) =>
                  setForm({ ...form, schedule_reminder_message: event.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cancellation-message">Cancelamento</Label>
              <Textarea
                id="cancellation-message"
                rows={4}
                value={form.cancellation_message}
                onChange={(event) => setForm({ ...form, cancellation_message: event.target.value })}
              />
            </div>
          </section>

          <Button
            type="submit"
            className="sticky bottom-20 z-10 h-11 w-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </>
      )}
    </form>
  );
}
