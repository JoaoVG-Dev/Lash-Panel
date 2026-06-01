import { createFileRoute } from "@tanstack/react-router";
import { Users, CalendarCheck, Bell, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageEmpty } from "@/components/page-empty";
import { countClients } from "@/lib/clients-api";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Início — Lash Manager" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data: clientCount, isLoading } = useQuery({
    queryKey: ["clients", "count"],
    queryFn: countClients,
    refetchOnMount: "always",
  });

  const cards = [
    { label: "Clientes", value: isLoading ? "…" : String(clientCount ?? 0), icon: Users },
    { label: "Atendimentos hoje", value: "0", icon: CalendarCheck },
    { label: "Manutenções próximas", value: "0", icon: Bell },
    { label: "Produtos em alerta", value: "0", icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{label}</span>
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Próximas manutenções</h2>
        <PageEmpty
          title="Nenhuma manutenção próxima"
          description="Quando você cadastrar atendimentos, eles aparecerão aqui."
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Produtos com alerta</h2>
        <PageEmpty
          title="Nenhum produto em alerta"
          description="Cadastre seus produtos para acompanhar validade e estoque."
        />
      </section>
    </div>
  );
}
