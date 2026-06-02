import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarClock,
  Package,
  Pencil,
  Plus,
  Search,
  Tags,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { FilterChip, PageHeader, StatCard } from "@/components/app/page-shell";
import { PageEmpty } from "@/components/page-empty";
import { ProductBrandsSection } from "@/components/product-brands-section";
import { ProductFormDialog } from "@/components/product-form-dialog";
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
import {
  deleteProduct,
  getProductAlert,
  getProductBrandName,
  getProductTypeLabel,
  isProductInAlert,
  listProducts,
  PRODUCT_TYPES,
  type Product,
  type ProductAlert,
  type ProductType,
} from "@/lib/products-api";

export const Route = createFileRoute("/_authenticated/produtos")({
  head: () => ({ meta: [{ title: "Produtos — Lash Panel" }] }),
  component: ProdutosPage,
});

type ProductFilter = ProductType | "todos";

function formatDate(value: string | null) {
  if (!value) return null;
  const [year, month, day] = value.split("T")[0].split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function ProdutosPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ProductFilter>("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [toDelete, setToDelete] = useState<Product | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["products"],
    queryFn: listProducts,
  });

  const products = useMemo(() => data ?? [], [data]);
  const alertCount = useMemo(() => products.filter(isProductInAlert).length, [products]);
  const glueCount = products.filter((product) => product.product_type === "cola").length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesType = typeFilter === "todos" || product.product_type === typeFilter;
      const searchable = [
        product.name,
        getProductBrandName(product),
        product.category,
        getProductTypeLabel(product.product_type),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = !q || searchable.includes(q);
      return matchesType && matchesSearch;
    });
  }, [products, search, typeFilter]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["products", "alert-count"] });
      toast.success("Produto excluído");
      setToDelete(null);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir produto");
    },
  });

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Estoque"
        title="Produtos"
        description="Controle marcas, validade, quantidade e produtos usados na ficha técnica."
        icon={Package}
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Novo
          </Button>
        }
      />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Produtos" value={products.length} icon={Package} />
        <StatCard label="Em alerta" value={alertCount} icon={AlertTriangle} tone="warning" />
        <div className="hidden sm:block">
          <StatCard label="Colas" value={glueCount} icon={Tags} tone="lavender" />
        </div>
      </section>

      <section className="beauty-panel space-y-3 rounded-2xl p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar produto, marca ou categoria"
            className="pl-11"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
          <FilterChip active={typeFilter === "todos"} onClick={() => setTypeFilter("todos")}>
            Todos
          </FilterChip>
          {PRODUCT_TYPES.map((type) => (
            <FilterChip
              key={type.value}
              active={typeFilter === type.value}
              onClick={() => setTypeFilter(type.value)}
            >
              {type.label}
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
          {error instanceof Error ? error.message : "Erro ao carregar produtos."}
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <PageEmpty
          title={products.length ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
          description={
            products.length
              ? "Tente outro nome, marca ou tipo."
              : "Adicione produtos para acompanhar quantidade, validade e estoque."
          }
          action={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Novo produto
            </Button>
          }
        />
      )}

      {!isLoading && filtered.length > 0 && (
        <ul className="grid gap-3 lg:grid-cols-2">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={() => openEdit(product)}
              onDelete={() => setToDelete(product)}
            />
          ))}
        </ul>
      )}

      <ProductBrandsSection />

      <ProductFormDialog open={dialogOpen} onOpenChange={setDialogOpen} product={editing} />

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. {toDelete?.name} será removido do estoque.
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

function ProductCard({
  product,
  onEdit,
  onDelete,
}: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const alert = getProductAlert(product);

  return (
    <li className="beauty-card rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-bold text-foreground">{product.name}</h2>
            <AlertBadge alert={alert} />
            {product.status === "inactive" && <Badge variant="secondary">Inativo</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {getProductTypeLabel(product.product_type)}
            {getProductBrandName(product) ? ` • ${getProductBrandName(product)}` : ""}
          </p>
        </div>

        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Editar produto">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
            aria-label="Excluir produto"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <InfoPill label="Estoque" value={`${product.quantity} ${product.unit}`} />
        <InfoPill
          label="Alerta"
          value={
            product.alert_quantity === null
              ? "Sem mínimo"
              : `${product.alert_quantity} ${product.unit}`
          }
        />
        <InfoPill
          label="Validade"
          value={formatDate(product.expiration_date) ?? "Sem data"}
          icon={CalendarClock}
        />
        <InfoPill label="Categoria" value={product.category || "Geral"} />
      </div>

      {product.notes && (
        <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-secondary/60 p-3 text-xs text-foreground">
          {product.notes}
        </p>
      )}
    </li>
  );
}

function AlertBadge({ alert }: { alert: ProductAlert }) {
  if (alert === "ok") return <Badge variant="outline">OK</Badge>;

  const copy = {
    expired: "Vencido",
    expiring: "Vence em breve",
    low_stock: "Estoque baixo",
  } satisfies Record<Exclude<ProductAlert, "ok">, string>;

  return <Badge variant={alert === "expired" ? "destructive" : "secondary"}>{copy[alert]}</Badge>;
}

function InfoPill({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="rounded-2xl bg-secondary/70 px-3 py-2">
      <p className="flex items-center gap-1 text-[11px] font-bold uppercase text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-bold text-foreground">{value}</p>
    </div>
  );
}
