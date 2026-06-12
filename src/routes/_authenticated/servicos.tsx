import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeDollarSign, Pencil, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { FilterChip, PageHeader, StatCard } from "@/components/app/page-shell";
import { PageEmpty } from "@/components/page-empty";
import { ServiceFormDialog } from "@/components/service-form-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteService, listServices, type Service } from "@/lib/services-api";

export const Route = createFileRoute("/_authenticated/servicos")({
  head: () => ({ meta: [{ title: "Serviços - Lash Panel" }] }),
  component: ServicosPage,
});

type StatusFilter = "all" | "active" | "inactive";

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Ativos" },
  { value: "inactive", label: "Inativos" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function ServicosPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [toDelete, setToDelete] = useState<Service | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["services"],
    queryFn: listServices,
  });

  const services = useMemo(() => data ?? [], [data]);
  const activeCount = services.filter((service) => service.active).length;
  const inactiveCount = services.length - activeCount;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return services.filter((service) => {
      const matchesStatus =
        statusFilter === "all" || (statusFilter === "active" ? service.active : !service.active);
      const searchable = [service.name, service.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = !q || searchable.includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [services, search, statusFilter]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services"] });
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Serviço excluído");
      setToDelete(null);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir serviço");
    },
  });

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (service: Service) => {
    setEditing(service);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Catálogo"
        title="Serviços"
        description="Cadastre procedimentos, preços e disponibilidade para usar nos atendimentos."
        icon={Sparkles}
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Novo
          </Button>
        }
      />

      <section className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatCard label="Serviços" value={services.length} icon={Sparkles} />
        <StatCard label="Ativos" value={activeCount} icon={BadgeDollarSign} tone="success" />
        <StatCard label="Inativos" value={inactiveCount} icon={Sparkles} tone="lavender" />
      </section>

      <section className="beauty-panel space-y-3 rounded-2xl p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar serviço ou descrição"
            className="pl-11"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
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
        <div className="grid gap-3 lg:grid-cols-2">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error instanceof Error ? error.message : "Erro ao carregar serviços."}
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <PageEmpty
          title={services.length ? "Nenhum serviço encontrado" : "Nenhum serviço cadastrado"}
          description={
            services.length
              ? "Tente outro nome, descrição ou status."
              : "Adicione serviços para selecionar procedimentos e valores nos atendimentos."
          }
          action={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Novo serviço
            </Button>
          }
        />
      )}

      {!isLoading && filtered.length > 0 && (
        <ul className="grid gap-3 lg:grid-cols-2">
          {filtered.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onEdit={() => openEdit(service)}
              onDelete={() => setToDelete(service)}
            />
          ))}
        </ul>
      )}

      <ServiceFormDialog open={dialogOpen} onOpenChange={setDialogOpen} service={editing} />

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir serviço?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Atendimentos antigos manterão o valor salvo e o
              serviço aparecerá como removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                if (toDelete) deleteMutation.mutate(toDelete.id);
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ServiceCard({
  service,
  onEdit,
  onDelete,
}: {
  service: Service;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="beauty-card rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-bold text-foreground">{service.name}</h2>
            <Badge variant={service.active ? "outline" : "secondary"}>
              {service.active ? "Ativo" : "Inativo"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {service.description || "Sem descrição"}
          </p>
        </div>

        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Editar serviço">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
            aria-label="Excluir serviço"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <InfoPill label="Preço" value={formatCurrency(service.price)} />
        <InfoPill label="Status" value={service.active ? "Ativo" : "Inativo"} />
      </div>
    </li>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary/70 px-3 py-2">
      <p className="text-[11px] font-bold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-xs font-bold text-foreground">{value}</p>
    </div>
  );
}
