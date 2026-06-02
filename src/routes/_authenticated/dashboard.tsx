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
  Users,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageEmpty } from "@/components/page-empty";
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

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Início - Lash Manager" }] }),
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

function DashboardPage() {
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

  const cards = [
    {
      label: "Clientes ativas",
      value: isLoadingClients ? "..." : String(activeClientCount ?? 0),
      icon: Users,
    },
    {
      label: "Atendimentos hoje",
      value: isLoadingAppointments ? "..." : String(todayAppointments ?? 0),
      icon: CalendarCheck,
    },
    {
      label: "Manutenções próximas",
      value: isLoadingMaintenance ? "..." : String(upcomingMaintenanceCount),
      icon: Bell,
    },
    {
      label: "Produtos em alerta",
      value: isLoadingProducts ? "..." : String(alertProducts.length),
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </section>

      <section className="rounded-xl border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">Ações rápidas</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <QuickAction to="/clientes" icon={Plus} label="Nova cliente" />
          <QuickAction to="/atendimentos" icon={CalendarCheck} label="Novo atendimento" />
          <QuickAction to="/produtos" icon={Package} label="Novo produto" />
          <QuickAction to="/clientes" icon={Send} label="Enviar anamnese" />
        </div>
      </section>

      <DashboardSection title="Próximos atendimentos" actionLabel="Agenda" actionTo="/atendimentos">
        {!isLoadingUpcomingAppointments && (upcomingAppointments ?? []).length === 0 && (
          <PageEmpty
            title="Nenhum atendimento futuro"
            description="Os próximos horários agendados aparecerão aqui."
          />
        )}

        {(upcomingAppointments ?? []).length > 0 && (
          <ul className="space-y-2">
            {(upcomingAppointments ?? []).map((appointment) => (
              <UpcomingAppointmentRow key={appointment.id} appointment={appointment} />
            ))}
          </ul>
        )}
      </DashboardSection>

      <DashboardSection title="Anamneses pendentes" actionLabel="Clientes" actionTo="/clientes">
        {!isLoadingPendingAnamnesis && (pendingAnamnesis ?? []).length === 0 && (
          <PageEmpty
            title="Nenhuma anamnese pendente"
            description="Clientes ativas sem anamnese preenchida aparecerão aqui."
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

      <DashboardSection title="Próximas manutenções" actionLabel="Clientes" actionTo="/clientes">
        {!isLoadingMaintenance && (maintenanceOverview ?? []).length === 0 && (
          <PageEmpty
            title="Nenhuma manutenção próxima"
            description="As clientes em período de lembrete aparecerão aqui."
          />
        )}

        {(maintenanceOverview ?? []).length > 0 && (
          <ul className="space-y-2">
            {(maintenanceOverview ?? []).slice(0, 5).map((item) => (
              <li key={item.clientId} className="rounded-xl border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
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

      <DashboardSection title="Produtos com alerta" actionLabel="Estoque" actionTo="/produtos">
        {!isLoadingProducts && alertProducts.length === 0 && (
          <PageEmpty
            title="Nenhum produto em alerta"
            description="Validade e estoque baixo aparecerão aqui."
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
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function QuickAction({
  to,
  icon: Icon,
  label,
}: {
  to: "/clientes" | "/atendimentos" | "/produtos";
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Button asChild variant="outline" className="h-16 min-w-0 px-2 py-2">
      <Link to={to} className="flex min-w-0 flex-col items-center justify-center gap-1">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="whitespace-normal text-center text-xs leading-tight">{label}</span>
      </Link>
    </Button>
  );
}

function DashboardSection({
  title,
  actionLabel,
  actionTo,
  children,
}: {
  title: string;
  actionLabel: string;
  actionTo: "/clientes" | "/atendimentos" | "/produtos";
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <Button asChild variant="link" className="h-auto p-0 text-xs">
          <Link to={actionTo}>{actionLabel}</Link>
        </Button>
      </div>
      {children}
    </section>
  );
}

function UpcomingAppointmentRow({ appointment }: { appointment: Appointment }) {
  return (
    <li className="rounded-xl border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {appointment.client?.name ?? "Cliente"}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarClock className="h-3 w-3" />
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
    <li className="rounded-xl border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{client.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {client.phone || "Telefone não informado"}
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="h-9 shrink-0">
          <Link to="/clientes/$id" params={{ id: client.id }}>
            <FileQuestion className="mr-1 h-4 w-4" />
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
    <li className="rounded-xl border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <Package className="h-3 w-3" />
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
