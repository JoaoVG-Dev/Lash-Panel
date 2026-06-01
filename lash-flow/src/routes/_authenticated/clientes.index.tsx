import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageEmpty } from "@/components/page-empty";
import { ClientFormDialog } from "@/components/client-form-dialog";
import { listClients, type Client } from "@/lib/clients-api";

export const Route = createFileRoute("/_authenticated/clientes/")({
  head: () => ({ meta: [{ title: "Clientes — Lash Manager" }] }),
  component: ClientesPage,
});

function ClientesPage() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["clients"],
    queryFn: listClients,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q),
    );
  }, [data, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone"
            className="pl-9 h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button className="h-11" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nova
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error instanceof Error ? error.message : "Erro ao carregar clientes."}
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <PageEmpty
          title={search ? "Nenhuma cliente encontrada" : "Nenhuma cliente cadastrada"}
          description={
            search
              ? "Tente outro termo de busca."
              : "Toque em “Nova” para adicionar sua primeira cliente."
          }
        />
      )}

      {!isLoading && filtered.length > 0 && (
        <ul className="space-y-2">
          {filtered.map((c) => (
            <ClientRow key={c.id} client={c} />
          ))}
        </ul>
      )}

      <ClientFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

function ClientRow({ client }: { client: Client }) {
  return (
    <li>
      <Link
        to="/clientes/$id"
        params={{ id: client.id }}
        className="flex items-center gap-3 rounded-xl border bg-card p-3 active:bg-accent"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
          {client.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-foreground">{client.name}</p>
            {client.status === "inactive" && (
              <Badge variant="secondary" className="text-[10px]">Inativa</Badge>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">{client.phone}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>
    </li>
  );
}