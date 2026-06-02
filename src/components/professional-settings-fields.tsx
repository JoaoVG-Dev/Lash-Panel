import { Building2, Clock3, MessageCircle } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WORKING_DAY_OPTIONS, type UserSettingsInput, type WorkingDay } from "@/lib/settings-api";
import { cn } from "@/lib/utils";

type Props = {
  form: UserSettingsInput;
  onChange: (form: UserSettingsInput) => void;
  showMessages?: boolean;
};

export function ProfessionalSettingsFields({ form, onChange, showMessages = true }: Props) {
  const toggleWorkingDay = (day: WorkingDay, checked: boolean) => {
    const current = form.working_days ?? [];
    const next = checked ? [...current, day] : current.filter((item) => item !== day);
    onChange({ ...form, working_days: next });
  };

  return (
    <>
      <section className="beauty-card space-y-4 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-bold text-foreground">Perfil profissional</h2>
            <p className="text-xs text-muted-foreground">
              Dados que aparecem nas mensagens e links.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="business-name">Nome do negócio *</Label>
            <Input
              id="business-name"
              value={form.business_name ?? ""}
              onChange={(event) => onChange({ ...form, business_name: event.target.value })}
              placeholder="Studio Lash"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="professional-name">Nome da profissional *</Label>
            <Input
              id="professional-name"
              value={form.professional_name ?? ""}
              onChange={(event) => onChange({ ...form, professional_name: event.target.value })}
              placeholder="Seu nome"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="professional-whatsapp">WhatsApp *</Label>
            <Input
              id="professional-whatsapp"
              inputMode="tel"
              value={form.whatsapp_phone ?? ""}
              onChange={(event) => onChange({ ...form, whatsapp_phone: event.target.value })}
              placeholder="(11) 99999-9999"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="professional-instagram">Instagram</Label>
            <Input
              id="professional-instagram"
              value={form.instagram ?? ""}
              onChange={(event) => onChange({ ...form, instagram: event.target.value })}
              placeholder="@studio"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="business-description">Descrição</Label>
          <Textarea
            id="business-description"
            rows={3}
            value={form.business_description ?? ""}
            onChange={(event) => onChange({ ...form, business_description: event.target.value })}
            placeholder="Atendimento especializado em extensão de cílios."
          />
        </div>
      </section>

      <section className="beauty-card space-y-4 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700">
            <Clock3 className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-bold text-foreground">Atendimento</h2>
            <p className="text-xs text-muted-foreground">
              Prazo de manutenção e horários de agenda.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="maintenance-days">Prazo padrão</Label>
            <Input
              id="maintenance-days"
              type="number"
              min={1}
              value={form.maintenance_days_default}
              onChange={(event) =>
                onChange({
                  ...form,
                  maintenance_days_default: Number(event.target.value || 21),
                })
              }
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
                onChange({ ...form, reminder_days_before: Number(event.target.value || 0) })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="opening-time">Abre às</Label>
            <Input
              id="opening-time"
              type="time"
              value={form.opening_time}
              onChange={(event) => onChange({ ...form, opening_time: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="closing-time">Fecha às</Label>
            <Input
              id="closing-time"
              type="time"
              value={form.closing_time}
              onChange={(event) => onChange({ ...form, closing_time: event.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Dias de atendimento</Label>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {WORKING_DAY_OPTIONS.map((day) => {
              const checked = form.working_days.includes(day.value);
              return (
                <label
                  key={day.value}
                  className={cn(
                    "flex h-11 items-center justify-center gap-1 rounded-full border text-xs font-bold transition-colors",
                    checked
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-card text-muted-foreground",
                  )}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(value) => toggleWorkingDay(day.value, value === true)}
                    className="sr-only"
                  />
                  {day.label}
                </label>
              );
            })}
          </div>
        </div>
      </section>

      {showMessages && (
        <section className="beauty-card space-y-4 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
              <MessageCircle className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-foreground">Mensagens do WhatsApp</h2>
              <p className="text-xs text-muted-foreground">Templates usados nos botões manuais.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="default-message">Lembrete de manutenção</Label>
              <Textarea
                id="default-message"
                rows={4}
                value={form.default_whatsapp_message}
                onChange={(event) =>
                  onChange({ ...form, default_whatsapp_message: event.target.value })
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
                  onChange({ ...form, schedule_reminder_message: event.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmation-message">Confirmação de atendimento</Label>
              <Textarea
                id="confirmation-message"
                rows={4}
                value={form.appointment_confirmation_message}
                onChange={(event) =>
                  onChange({ ...form, appointment_confirmation_message: event.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="anamnesis-link-message">Link de anamnese</Label>
              <Textarea
                id="anamnesis-link-message"
                rows={4}
                value={form.anamnesis_link_message}
                onChange={(event) =>
                  onChange({ ...form, anamnesis_link_message: event.target.value })
                }
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="cancellation-message">Cancelamento</Label>
              <Textarea
                id="cancellation-message"
                rows={4}
                value={form.cancellation_message}
                onChange={(event) =>
                  onChange({ ...form, cancellation_message: event.target.value })
                }
              />
            </div>
          </div>
        </section>
      )}
    </>
  );
}
