import { addDays, differenceInCalendarDays, isAfter, isBefore, parseISO } from "date-fns";
import { listClients } from "@/lib/clients-api";
import { getUserSettings } from "@/lib/settings-api";
import type { UserSettingsInput } from "@/lib/settings-api";
import { listTechnicalRecords, type TechnicalRecord } from "@/lib/technical-records-api";

export type MaintenanceStatusKey = "no_record" | "on_track" | "upcoming" | "overdue";

export type MaintenanceStatus = {
  key: MaintenanceStatusKey;
  label: string;
  description: string;
  dueDate: Date | null;
  daysUntilDue: number | null;
};

export type MaintenanceOverviewItem = {
  clientId: string;
  clientName: string;
  status: MaintenanceStatus;
};

function startOfToday(referenceDate = new Date()) {
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);
  return today;
}

export function getMaintenanceDueDate(record: TechnicalRecord | null | undefined) {
  if (!record) return null;
  return addDays(parseISO(record.application_date), record.maintenance_days || 21);
}

export function calculateMaintenanceStatus(
  latestRecord: TechnicalRecord | null | undefined,
  settings: Pick<UserSettingsInput, "reminder_days_before">,
  referenceDate = new Date(),
): MaintenanceStatus {
  if (!latestRecord) {
    return {
      key: "no_record",
      label: "Sem atendimento",
      description: "Cadastre uma ficha técnica para acompanhar a manutenção.",
      dueDate: null,
      daysUntilDue: null,
    };
  }

  const today = startOfToday(referenceDate);
  const dueDate = getMaintenanceDueDate(latestRecord);
  if (!dueDate) {
    return {
      key: "no_record",
      label: "Sem atendimento",
      description: "Cadastre uma ficha técnica para acompanhar a manutenção.",
      dueDate: null,
      daysUntilDue: null,
    };
  }

  const reminderDate = addDays(dueDate, -settings.reminder_days_before);
  const daysUntilDue = differenceInCalendarDays(dueDate, today);

  if (isAfter(today, dueDate)) {
    return {
      key: "overdue",
      label: "Manutenção vencida",
      description: "A cliente já passou do prazo sugerido para manutenção ou nova colocação.",
      dueDate,
      daysUntilDue,
    };
  }

  if (!isBefore(today, reminderDate)) {
    return {
      key: "upcoming",
      label: "Manutenção próxima",
      description: "Está no período ideal para chamar a cliente no WhatsApp.",
      dueDate,
      daysUntilDue,
    };
  }

  return {
    key: "on_track",
    label: "Em dia",
    description: "A manutenção ainda está dentro do prazo.",
    dueDate,
    daysUntilDue,
  };
}

export function formatMaintenanceDate(date: Date | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(date);
}

export async function listMaintenanceOverview(): Promise<MaintenanceOverviewItem[]> {
  const [settings, clients] = await Promise.all([getUserSettings(), listClients()]);
  const rows = await Promise.all(
    clients.map(async (client) => {
      const records = await listTechnicalRecords(client.id);
      return {
        clientId: client.id,
        clientName: client.name,
        status: calculateMaintenanceStatus(records[0] ?? null, settings),
      };
    }),
  );

  return rows
    .filter((item) => item.status.key === "upcoming" || item.status.key === "overdue")
    .sort((a, b) => {
      const aTime = a.status.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bTime = b.status.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });
}

export async function countUpcomingMaintenances(): Promise<number> {
  const overview = await listMaintenanceOverview();
  return overview.filter((item) => item.status.key === "upcoming").length;
}
