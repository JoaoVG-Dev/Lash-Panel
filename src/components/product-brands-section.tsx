import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, Pencil, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createBrand,
  deactivateBrand,
  listBrands,
  updateBrand,
  type ProductBrand,
  type ProductBrandInput,
  type ProductBrandStatus,
} from "@/lib/brands-api";

function emptyBrandForm(): ProductBrandInput {
  return {
    name: "",
    description: "",
    status: "active",
  };
}

export function ProductBrandsSection() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductBrand | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["product-brands"],
    queryFn: () => listBrands({ includeInactive: true }),
  });

  const brands = useMemo(() => data ?? [], [data]);
  const filteredBrands = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter((brand) => brand.name.toLowerCase().includes(q));
  }, [brands, search]);

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateBrand(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product-brands"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Marca inativada");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Erro ao inativar marca");
    },
  });

  return (
    <section className="beauty-card space-y-3 rounded-2xl p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Marcas</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Cadastre marcas uma vez e selecione no produto.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="shrink-0"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Nova
        </Button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar marca"
          className="pl-10"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {isError && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error instanceof Error ? error.message : "Erro ao carregar marcas."}
        </div>
      )}

      {!isLoading && !isError && filteredBrands.length === 0 && (
        <div className="rounded-2xl bg-secondary/70 p-3 text-sm text-muted-foreground">
          {brands.length ? "Nenhuma marca encontrada." : "Nenhuma marca cadastrada ainda."}
        </div>
      )}

      {filteredBrands.length > 0 && (
        <ul className="space-y-2">
          {filteredBrands.map((brand) => (
            <li key={brand.id} className="rounded-2xl border bg-card/80 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-bold text-foreground">{brand.name}</p>
                    <Badge variant={brand.status === "active" ? "default" : "secondary"}>
                      {brand.status === "active" ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                  {brand.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {brand.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditing(brand);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Editar marca</span>
                  </Button>
                  {brand.status === "active" && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground"
                      onClick={() => deactivateMutation.mutate(brand.id)}
                      disabled={deactivateMutation.isPending}
                    >
                      <Ban className="h-4 w-4" />
                      <span className="sr-only">Inativar marca</span>
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <BrandFormDialog open={dialogOpen} onOpenChange={setDialogOpen} brand={editing} />
    </section>
  );
}

function BrandFormDialog({
  open,
  onOpenChange,
  brand,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand: ProductBrand | null;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<ProductBrandInput>(emptyBrandForm);

  useEffect(() => {
    if (!open) return;
    setForm(
      brand
        ? {
            name: brand.name,
            description: brand.description ?? "",
            status: brand.status,
          }
        : emptyBrandForm(),
    );
  }, [brand, open]);

  const mutation = useMutation({
    mutationFn: (input: ProductBrandInput) => {
      if (brand) return updateBrand(brand.id, input);
      return createBrand(input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product-brands"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success(brand ? "Marca atualizada" : "Marca criada");
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar marca");
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    mutation.mutate(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{brand ? "Editar marca" : "Nova marca"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="brand-name">Nome *</Label>
            <Input
              id="brand-name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Ex.: Lash Pro"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="brand-description">Descrição</Label>
            <Textarea
              id="brand-description"
              rows={3}
              value={form.description ?? ""}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="brand-status">Status</Label>
            <Select
              value={form.status ?? "active"}
              onValueChange={(value) => setForm({ ...form, status: value as ProductBrandStatus })}
            >
              <SelectTrigger id="brand-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="inactive">Inativa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
