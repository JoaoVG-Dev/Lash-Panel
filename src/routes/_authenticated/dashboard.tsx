import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Bell, CalendarCheck, Package, Users, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageEmpty } from "@/components/page-empty";
import { countTodayAppointments } from "@/lib/appointments-api";
import { countClients } from "@/lib/clients-api";
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
  head: () => ({ meta: [{ title: "Início — Lash Manager" }] }),
  component: DashboardPage,
});

const MAINTENANCE_BADGES: Record<MaintenanceStatusKey, "default" | "secondary" | "destructive"> = {
  no_record: "secondary",
  on_track: "default",
  upcoming: "secondary",
  overdue: "destructive",
};

function DashboardPage() {
  const { data: clientCount, isLoading: isLoadingClients } = useQuery({
    queryKey: ["clients", "count"],
    queryFn: countClients,
    refetchOnMount: "always",
  });

  const { data: todayAppointments, isLoading: isLoadingAppointments } = useQuery({
    queryKey: ["appointments", "today-count"],
    queryFn: countTodayAppointments,
  });

  const { data: maintenanceOverview, isLoading: isLoadingMaintenance } = useQuery({
    queryKey: ["maintenance", "overview"],
    queryFn: listMaintenanceOverview,
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
      label: "Clientes",
      value: isLoadingClients ? "..." : String(clientCount ?? 0),
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

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Próximas manutenções</h2>
          <Button asChild variant="link" className="h-auto p-0 text-xs">
            <Link to="/clientes">Clientes</Link>
          </Button>
        </div>

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
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Produtos com alerta</h2>
          <Button asChild variant="link" className="h-auto p-0 text-xs">
            <Link to="/produtos">Estoque</Link>
          </Button>
        </div>

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
      </section>
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

function ProductAlertRow({ product }: { product: Product }) {
  const alert = getProductAlert(product);

  return (
    <li className="rounded-xl border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <Package className="h-3 w-3" />
            {getProductTypeLabel(product.product_type)} • {product.quantity} {product.unit}
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
