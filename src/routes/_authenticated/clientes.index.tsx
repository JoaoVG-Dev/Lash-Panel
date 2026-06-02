import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Phone, Plus, Search, UserRoundCheck, Users } from "lucide-react";

import { FilterChip, InitialsAvatar, PageHeader, StatCard } from "@/components/app/page-shell";
import { ClientFormDialog } from "@/components/client-form-dialog";
import { PageEmpty } from "@/components/page-empty";
import { WhatsAppActionButton } from "@/components/whatsapp-action-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { listClients, type Client } from "@/lib/clients-api";

export const Route = createFileRoute("/_authenticated/clientes/")({
  head: () => ({ meta: [{ title: "Clientes — Lash Panel" }] }),
  component: ClientesPage,
});

type StatusFilter = "all" | "active" | "inactive";

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "active", label: "Ativas" },
  { value: "inactive", label: "Inativas" },
];

function ClientesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["clients"],
    queryFn: listClients,
  });

  const clients = useMemo(() => data ?? [], [data]);
  const activeCount = clients.filter((client) => client.status === "active").length;
  const inactiveCount = clients.length - activeCount;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients.filter((client) => {
      const matchesStatus = statusFilter === "all" || client.status === statusFilter;
      const matchesSearch =
        !q ||
        client.name.toLowerCase().includes(q) ||
        client.phone.toLowerCase().includes(q) ||
        (client.instagram ?? "").toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [clients, search, statusFilter]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Relacionamento"
        title="Clientes"
        description="Busque, acompanhe manutenção e abra rapidamente o perfil de cada cliente."
        icon={Users}
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Nova
          </Button>
        }
      />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Total" value={clients.length} icon={Users} />
        <StatCard label="Ativas" value={activeCount} icon={UserRoundCheck} tone="success" />
        <div className="hidden sm:block">
          <StatCard label="Inativas" value={inactiveCount} icon={Users} tone="lavender" />
        </div>
      </section>

      <section className="beauty-panel space-y-3 rounded-2xl p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone ou Instagram"
            className="pl-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
          {STATUS_FILTERS.map((filter) => (
            <FilterChip
              key={filter.value}
              active={statusFilter === filter.value}
              onClick={() => setStatusFilter(filter.value)}
            >
              {filter.label}
            </FilterChip>
          ))}
        </div>
      </section>

      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error instanceof Error ? error.message : "Erro ao carregar clientes."}
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <PageEmpty
          title={search ? "Nenhuma cliente encontrada" : "Nenhuma cliente cadastrada"}
          description={
            search
              ? "Tente outro termo de busca."
              : "Toque em Nova para adicionar sua primeira cliente."
          }
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Nova cliente
            </Button>
          }
        />
      )}

      {!isLoading && filtered.length > 0 && (
        <ul className="grid gap-3 lg:grid-cols-2">
          {filtered.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </ul>
      )}

      <ClientFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

function ClientCard({ client }: { client: Client }) {
  return (
    <li className="beauty-card rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <InitialsAvatar name={client.name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-bold text-foreground">{client.name}</h2>
            <Badge variant={client.status === "active" ? "default" : "secondary"}>
              {client.status === "active" ? "Ativa" : "Inativa"}
            </Badge>
          </div>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <Phone className="h-3.5 w-3.5" />
            {client.phone}
          </p>
          {client.instagram && (
            <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground">
              {client.instagram}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
        <Button asChild variant="outline">
          <Link to="/clientes/$id" params={{ id: client.id }}>
            Abrir perfil
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
        <WhatsAppActionButton
          clientId={client.id}
          clientName={client.name}
          phone={client.phone}
          label="WhatsApp"
          className="px-3"
        />
      </div>
    </li>
  );
}
