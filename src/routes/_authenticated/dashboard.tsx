import { useMemo, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bell,
  CalendarCheck,
  CalendarClock,
  FileQuestion,
  Package,
  Plus,
  Send,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

import { QuickActionCard, SectionCard, StatCard } from "@/components/app/page-shell";
import { PageEmpty } from "@/components/page-empty";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  countTodayAppointments,
  getAppointmentTypeLabel,
  listUpcomingAppointments,
  type Appointment,
} from "@/lib/appointments-api";
import { listClientsWithPendingAnamnesis, type PendingAnamnesisClient } from "@/lib/anamnesis-api";
import { countActiveClients } from "@/lib/clients-api";
import {
  formatMaintenanceDate,
  listMaintenanceOverview,
  type MaintenanceStatusKey,
} from "@/lib/maintenance-api";
import {
  getProductAlert,
  getProductTypeLabel,
  isProductInAlert,
  listProducts,
  type Product,
  type ProductAlert,
} from "@/lib/products-api";
import { getUserSettings } from "@/lib/settings-api";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Início - Lash Panel" }] }),
  component: DashboardPage,
});

const MAINTENANCE_BADGES: Record<MaintenanceStatusKey, "default" | "secondary" | "destructive"> = {
  no_record: "secondary",
  on_track: "default",
  upcoming: "secondary",
  overdue: "destructive",
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getFirstName(value: string | null | undefined) {
  return value?.trim().split(" ")[0] || "profissional";
}

function DashboardPage() {
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: getUserSettings,
  });

  const { data: activeClientCount, isLoading: isLoadingClients } = useQuery({
    queryKey: ["clients", "active-count"],
    queryFn: countActiveClients,
    refetchOnMount: "always",
  });

  const { data: todayAppointments, isLoading: isLoadingAppointments } = useQuery({
    queryKey: ["appointments", "today-count"],
    queryFn: countTodayAppointments,
  });

  const { data: upcomingAppointments, isLoading: isLoadingUpcomingAppointments } = useQuery({
    queryKey: ["appointments", "upcoming"],
    queryFn: () => listUpcomingAppointments(5),
  });

  const { data: maintenanceOverview, isLoading: isLoadingMaintenance } = useQuery({
    queryKey: ["maintenance", "overview"],
    queryFn: listMaintenanceOverview,
  });

  const { data: pendingAnamnesis, isLoading: isLoadingPendingAnamnesis } = useQuery({
    queryKey: ["anamnesis", "pending-clients"],
    queryFn: () => listClientsWithPendingAnamnesis(5),
  });

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: listProducts,
  });

  const alertProducts = useMemo(() => (products ?? []).filter(isProductInAlert), [products]);
  const upcomingMaintenanceCount = useMemo(
    () => (maintenanceOverview ?? []).filter((item) => item.status.key === "upcoming").length,
    [maintenanceOverview],
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="beauty-panel overflow-hidden rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-extrabold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Rotina do estúdio
            </p>
            <h1 className="display-title mt-3 text-4xl text-foreground sm:text-5xl">
              Olá, {getFirstName(settings?.professional_name)}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Veja seus atendimentos, alertas e próximas ações para manter o dia fluindo.
            </p>
          </div>
          <div className="rounded-2xl border bg-card/80 px-4 py-3 text-primary shadow-sm sm:min-w-32 sm:text-right">
            <p className="text-xs font-bold uppercase">Hoje</p>
            <p className="text-2xl font-extrabold">{todayAppointments ?? 0}</p>
            <p className="text-xs font-semibold text-muted-foreground">atendimentos</p>
          </div>
        </div>
      </section>

      <DashboardSection
        title="Próximos atendimentos"
        description="Acompanhe os horários que pedem atenção primeiro no seu dia."
        actionLabel="Abrir agenda"
        actionTo="/atendimentos"
        priority
      >
        {!isLoadingUpcomingAppointments && (upcomingAppointments ?? []).length === 0 && (
          <PageEmpty
            title="Nenhum atendimento futuro"
            description="Quando um horário for agendado, ele aparece aqui com cliente, procedimento e data."
            action={
              <Button asChild size="sm">
                <Link to="/atendimentos">
                  <CalendarCheck className="h-4 w-4" />
                  Agendar atendimento
                </Link>
              </Button>
            }
          />
        )}

        {(upcomingAppointments ?? []).length > 0 && (
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(upcomingAppointments ?? []).map((appointment) => (
              <UpcomingAppointmentRow key={appointment.id} appointment={appointment} />
            ))}
          </ul>
        )}
      </DashboardSection>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Clientes ativas"
          value={isLoadingClients ? "..." : String(activeClientCount ?? 0)}
          icon={Users}
          helper="Base ativa do estúdio"
        />
        <StatCard
          label="Atendimentos hoje"
          value={isLoadingAppointments ? "..." : String(todayAppointments ?? 0)}
          icon={CalendarCheck}
          tone="success"
          helper="Agenda do dia"
        />
        <StatCard
          label="Manutenções próximas"
          value={isLoadingMaintenance ? "..." : String(upcomingMaintenanceCount)}
          icon={Bell}
          tone="lavender"
          helper="Dentro do período de lembrete"
        />
        <StatCard
          label="Produtos em alerta"
          value={isLoadingProducts ? "..." : String(alertProducts.length)}
          icon={AlertTriangle}
          tone="warning"
          helper="Estoque ou validade"
        />
      </section>

      <SectionCard
        title="Ações rápidas"
        description="Atalhos com área de toque maior para iniciar os fluxos mais usados."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Link to="/clientes" className="block">
            <QuickActionCard icon={Plus} label="Nova cliente" description="Cadastrar perfil" />
          </Link>
          <Link to="/atendimentos" className="block">
            <QuickActionCard
              icon={CalendarCheck}
              label="Novo atendimento"
              description="Abrir agenda"
            />
          </Link>
          <Link to="/produtos" className="block">
            <QuickActionCard icon={Package} label="Novo produto" description="Atualizar estoque" />
          </Link>
          <Link to="/clientes" className="block">
            <QuickActionCard icon={Send} label="Enviar anamnese" description="Solicitar dados" />
          </Link>
        </div>
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <DashboardSection
          title="Anamneses pendentes"
          description="Clientes que ainda precisam completar as informações antes do atendimento."
          actionLabel="Ver clientes"
          actionTo="/clientes"
        >
          {!isLoadingPendingAnamnesis && (pendingAnamnesis ?? []).length === 0 && (
            <PageEmpty
              title="Nenhuma anamnese pendente"
              description="Clientes ativas sem anamnese preenchida aparecerão aqui."
              action={
                <Button asChild variant="outline" size="sm">
                  <Link to="/clientes">
                    <Send className="h-4 w-4" />
                    Enviar anamnese
                  </Link>
                </Button>
              }
            />
          )}

          {(pendingAnamnesis ?? []).length > 0 && (
            <ul className="space-y-2">
              {(pendingAnamnesis ?? []).map((client) => (
                <PendingAnamnesisRow key={client.id} client={client} />
              ))}
            </ul>
          )}
        </DashboardSection>

        <DashboardSection
          title="Próximas manutenções"
          description="Lembretes para manter o relacionamento ativo após o procedimento."
          actionLabel="Ver clientes"
          actionTo="/clientes"
        >
          {!isLoadingMaintenance && (maintenanceOverview ?? []).length === 0 && (
            <PageEmpty
              title="Nenhuma manutenção próxima"
              description="As clientes em período de lembrete aparecerão aqui."
              action={
                <Button asChild variant="outline" size="sm">
                  <Link to="/clientes">
                    <Users className="h-4 w-4" />
                    Abrir clientes
                  </Link>
                </Button>
              }
            />
          )}

          {(maintenanceOverview ?? []).length > 0 && (
            <ul className="space-y-2">
              {(maintenanceOverview ?? []).slice(0, 5).map((item) => (
                <li key={item.clientId} className="rounded-2xl border bg-card/85 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-foreground">
                        {item.clientName}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Vence em {formatMaintenanceDate(item.status.dueDate)}
                      </p>
                    </div>
                    <Badge variant={MAINTENANCE_BADGES[item.status.key]}>{item.status.label}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DashboardSection>

        <DashboardSection
          title="Produtos com alerta"
          description="Itens que merecem conferência de estoque ou validade."
          actionLabel="Ver estoque"
          actionTo="/produtos"
        >
          {!isLoadingProducts && alertProducts.length === 0 && (
            <PageEmpty
              title="Nenhum produto em alerta"
              description="Validade e estoque baixo aparecerão aqui."
              action={
                <Button asChild variant="outline" size="sm">
                  <Link to="/produtos">
                    <Package className="h-4 w-4" />
                    Abrir estoque
                  </Link>
                </Button>
              }
            />
          )}

          {alertProducts.length > 0 && (
            <ul className="space-y-2">
              {alertProducts.slice(0, 5).map((product) => (
                <ProductAlertRow key={product.id} product={product} />
              ))}
            </ul>
          )}
        </DashboardSection>
      </div>
    </div>
  );
}

function DashboardSection({
  title,
  description,
  actionLabel,
  actionTo,
  children,
  priority,
}: {
  title: string;
  description?: string;
  actionLabel: string;
  actionTo: "/clientes" | "/atendimentos" | "/produtos";
  children: ReactNode;
  priority?: boolean;
}) {
  return (
    <SectionCard
      title={title}
      description={description}
      className={priority ? "border-primary/20 bg-card/95" : undefined}
      action={
        <Button
          asChild
          variant={priority ? "default" : "link"}
          size={priority ? "sm" : "default"}
          className={priority ? "" : "h-auto p-0 text-xs"}
        >
          <Link to={actionTo}>{actionLabel}</Link>
        </Button>
      }
    >
      {children}
    </SectionCard>
  );
}

function UpcomingAppointmentRow({ appointment }: { appointment: Appointment }) {
  return (
    <li className="rounded-2xl border bg-card/80 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">
            {appointment.client?.name ?? "Cliente"}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" />
            {getAppointmentTypeLabel(appointment.appointment_type)} -{" "}
            {formatDateTime(appointment.scheduled_at)}
          </p>
        </div>
        <Badge variant="secondary">Agendado</Badge>
      </div>
    </li>
  );
}

function PendingAnamnesisRow({ client }: { client: PendingAnamnesisClient }) {
  return (
    <li className="rounded-2xl border bg-card/80 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">{client.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {client.phone || "Telefone não informado"}
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link to="/clientes/$id" params={{ id: client.id }}>
            <FileQuestion className="h-4 w-4" />
            Abrir
          </Link>
        </Button>
      </div>
    </li>
  );
}

function ProductAlertRow({ product }: { product: Product }) {
  const alert = getProductAlert(product);

  return (
    <li className="rounded-2xl border bg-card/80 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">{product.name}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <Package className="h-3.5 w-3.5" />
            {getProductTypeLabel(product.product_type)} - {product.quantity} {product.unit}
          </p>
        </div>
        <ProductAlertBadge alert={alert} />
      </div>
    </li>
  );
}

function ProductAlertBadge({ alert }: { alert: ProductAlert }) {
  const labels = {
    expired: "Vencido",
    expiring: "Vence em breve",
    low_stock: "Estoque baixo",
    ok: "OK",
  } satisfies Record<ProductAlert, string>;

  return <Badge variant={alert === "expired" ? "destructive" : "secondary"}>{labels[alert]}</Badge>;
}
