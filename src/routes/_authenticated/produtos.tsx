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
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
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
import { PageEmpty } from "@/components/page-empty";
import { ProductBrandsSection } from "@/components/product-brands-section";
import { ProductFormDialog } from "@/components/product-form-dialog";
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
  head: () => ({ meta: [{ title: "Produtos — Lash Manager" }] }),
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
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard label="Total" value={products.length} icon={Package} />
        <SummaryCard label="Em alerta" value={alertCount} icon={AlertTriangle} tone="warning" />
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar produto"
            className="h-11 pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Button className="h-11" onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" /> Novo
        </Button>
      </div>

      <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as ProductFilter)}>
        <SelectTrigger className="h-11">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os tipos</SelectItem>
          {PRODUCT_TYPES.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isLoading && (
        <div className="space-y-2">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error instanceof Error ? error.message : "Erro ao carregar produtos."}
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <PageEmpty
          title={products.length ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
          description={
            products.length
              ? "Tente outro nome ou tipo."
              : "Adicione produtos para acompanhar quantidade, validade e estoque."
          }
        />
      )}

      {!isLoading && filtered.length > 0 && (
        <ul className="space-y-2">
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

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: "warning";
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Icon className={tone === "warning" ? "h-4 w-4 text-amber-600" : "h-4 w-4 text-primary"} />
      </div>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
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
    <li className="rounded-xl border bg-card p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
            <AlertBadge alert={alert} />
            {product.status === "inactive" && (
              <Badge variant="secondary" className="text-[10px]">
                Inativo
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {getProductTypeLabel(product.product_type)}
            {getProductBrandName(product) ? ` • ${getProductBrandName(product)}` : ""}
          </p>
        </div>

        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Editar</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Excluir</span>
          </Button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
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
        <p className="mt-3 whitespace-pre-wrap rounded-lg bg-muted/40 p-2 text-xs text-foreground">
          {product.notes}
        </p>
      )}
    </li>
  );
}

function AlertBadge({ alert }: { alert: ProductAlert }) {
  if (alert === "ok") return null;

  const copy = {
    expired: "Vencido",
    expiring: "Vence em breve",
    low_stock: "Estoque baixo",
  } satisfies Record<Exclude<ProductAlert, "ok">, string>;

  return (
    <Badge variant={alert === "expired" ? "destructive" : "secondary"} className="text-[10px]">
      {copy[alert]}
    </Badge>
  );
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
    <div className="rounded-lg bg-muted/40 px-3 py-2">
      <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
      <p className="mt-0.5 truncate text-xs font-medium text-foreground">{value}</p>
    </div>
  );
}
