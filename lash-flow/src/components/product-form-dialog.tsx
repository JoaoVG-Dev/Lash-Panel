import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createProduct,
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

  useEffect(() => {
    if (!open) return;

    setForm(
      product
        ? {
            name: product.name,
            brand: product.brand ?? "",
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="product-brand">Marca</Label>
              <Input
                id="product-brand"
                value={form.brand ?? ""}
                onChange={(event) => setForm({ ...form, brand: event.target.value })}
              />
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

          <div className="grid grid-cols-2 gap-3">
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

          <div className="grid grid-cols-2 gap-3">
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
    </Dialog>
  );
}
