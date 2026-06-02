import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getOrCreateBrandByName, listBrands, type ProductBrand } from "@/lib/brands-api";
import { Textarea } from "@/components/ui/textarea";
import {
  createProduct,
  getProductBrandName,
  PRODUCT_TYPES,
  updateProduct,
  type Product,
  type ProductInput,
  type ProductStatus,
  type ProductType,
} from "@/lib/products-api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
};

const UNIT_OPTIONS = ["un", "ml", "g", "par", "caixa", "bandeja"];

function emptyForm(): ProductInput {
  return {
    name: "",
    brand: "",
    brand_id: null,
    category: "",
    product_type: "outros",
    quantity: 0,
    unit: "un",
    expiration_date: "",
    alert_quantity: null,
    status: "active",
    notes: "",
  };
}

export function ProductFormDialog({ open, onOpenChange, product }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState<ProductInput>(emptyForm);
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");

  const { data: brands } = useQuery({
    queryKey: ["product-brands"],
    queryFn: () => listBrands({ includeInactive: true }),
    enabled: open,
  });

  const availableBrands = useMemo(
    () => (brands ?? []).filter((brand) => brand.status === "active" || brand.id === form.brand_id),
    [brands, form.brand_id],
  );

  useEffect(() => {
    if (!open) return;

    setForm(
      product
        ? {
            name: product.name,
            brand: getProductBrandName(product) ?? "",
            brand_id: product.brand_id,
            category: product.category ?? "",
            product_type: product.product_type,
            quantity: product.quantity,
            unit: product.unit,
            expiration_date: product.expiration_date ?? "",
            alert_quantity: product.alert_quantity,
            status: product.status,
            notes: product.notes ?? "",
          }
        : emptyForm(),
    );
  }, [open, product]);

  const mutation = useMutation({
    mutationFn: (input: ProductInput) => {
      if (product) return updateProduct(product.id, input);
      return createProduct(input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["products", "alert-count"] });
      toast.success(product ? "Produto atualizado" : "Produto cadastrado");
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar produto");
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Informe o nome do produto");
      return;
    }

    mutation.mutate(form);
  };

  const selectBrand = (brand: ProductBrand | null) => {
    setForm((current) => ({
      ...current,
      brand_id: brand?.id ?? null,
      brand: brand?.name ?? null,
    }));
  };

  const createBrandMutation = useMutation({
    mutationFn: (name: string) => getOrCreateBrandByName(name),
    onSuccess: (brand) => {
      qc.invalidateQueries({ queryKey: ["product-brands"] });
      selectBrand(brand);
      setNewBrandName("");
      setBrandDialogOpen(false);
      toast.success("Marca selecionada");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Erro ao criar marca");
    },
  });

  const handleCreateBrand = (event: React.FormEvent) => {
    event.preventDefault();
    createBrandMutation.mutate(newBrandName);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{product ? "Editar produto" : "Novo produto"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="product-name">Nome *</Label>
            <Input
              id="product-name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Cola, fio, primer..."
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="product-brand">Marca</Label>
              <Select
                value={form.brand_id ?? "none"}
                onValueChange={(value) => {
                  if (value === "create") {
                    setBrandDialogOpen(true);
                    return;
                  }

                  if (value === "none") {
                    selectBrand(null);
                    return;
                  }

                  const brand = (brands ?? []).find((item) => item.id === value) ?? null;
                  selectBrand(brand);
                }}
              >
                <SelectTrigger id="product-brand">
                  <SelectValue placeholder="Selecione a marca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem marca</SelectItem>
                  {availableBrands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                      {brand.status === "inactive" ? " (inativa)" : ""}
                    </SelectItem>
                  ))}
                  <SelectSeparator />
                  <SelectItem value="create">+ Criar nova marca</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product-category">Categoria</Label>
              <Input
                id="product-category"
                value={form.category ?? ""}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                placeholder="Uso diário"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="product-type">Tipo</Label>
              <Select
                value={form.product_type}
                onValueChange={(value) => setForm({ ...form, product_type: value as ProductType })}
              >
                <SelectTrigger id="product-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="product-status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => setForm({ ...form, status: value as ProductStatus })}
              >
                <SelectTrigger id="product-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_96px] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="product-quantity">Quantidade</Label>
              <Input
                id="product-quantity"
                type="number"
                min={0}
                step="0.01"
                value={form.quantity}
                onChange={(event) =>
                  setForm({ ...form, quantity: Number(event.target.value || 0) })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="product-unit">Unidade</Label>
              <Select
                value={form.unit}
                onValueChange={(value) => setForm({ ...form, unit: value })}
              >
                <SelectTrigger id="product-unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="product-expiration">Validade</Label>
              <Input
                id="product-expiration"
                type="date"
                value={form.expiration_date ?? ""}
                onChange={(event) => setForm({ ...form, expiration_date: event.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="product-alert">Alerta de estoque</Label>
              <Input
                id="product-alert"
                type="number"
                min={0}
                step="0.01"
                value={form.alert_quantity ?? ""}
                onChange={(event) =>
                  setForm({
                    ...form,
                    alert_quantity: event.target.value ? Number(event.target.value) : null,
                  })
                }
                placeholder="mínimo"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="product-notes">Observações</Label>
            <Textarea
              id="product-notes"
              rows={3}
              value={form.notes ?? ""}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
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

      <Dialog open={brandDialogOpen} onOpenChange={setBrandDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nova marca</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateBrand} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-brand-name">Nome da marca</Label>
              <Input
                id="new-brand-name"
                value={newBrandName}
                onChange={(event) => setNewBrandName(event.target.value)}
                placeholder="Ex.: Lash Pro"
                autoFocus
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setBrandDialogOpen(false)}
                disabled={createBrandMutation.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createBrandMutation.isPending}>
                {createBrandMutation.isPending ? "Salvando..." : "Criar marca"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
