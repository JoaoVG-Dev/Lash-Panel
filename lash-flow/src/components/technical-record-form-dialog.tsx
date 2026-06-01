import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listGlueProducts } from "@/lib/products-api";
import {
  createTechnicalRecord,
  PROCEDURE_TYPE_OPTIONS,
  updateTechnicalRecord,
  type ProcedureType,
  type TechnicalRecord,
  type TechnicalRecordInput,
} from "@/lib/technical-records-api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  record?: TechnicalRecord | null;
};

const LASH_MODELS = ["Natural", "Boneca", "Gatinho", "Fox eyes", "Delineado", "Personalizado"];
const CURLS = ["C", "CC", "D", "L", "M", "Outro"];

function today() {
  return new Date().toISOString().slice(0, 10);
}

const emptyForm = (): TechnicalRecordInput => ({
  procedure_type: "colocacao",
  lash_model: "",
  curl: "",
  thickness: "",
  sizes_used: [],
  volume: "",
  glue_product_id: null,
  glue_used: "",
  application_date: today(),
  maintenance_days: 21,
  notes: "",
});

export function TechnicalRecordFormDialog({ open, onOpenChange, clientId, record }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState<TechnicalRecordInput>(emptyForm);
  const [sizeDraft, setSizeDraft] = useState("");

  const { data: glueProducts } = useQuery({
    queryKey: ["products", "glues"],
    queryFn: listGlueProducts,
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      setForm(
        record
          ? {
              procedure_type: record.procedure_type === "manutencao" ? "manutencao" : "colocacao",
              lash_model: record.lash_model ?? "",
              curl: record.curl ?? "",
              thickness: record.thickness ?? "",
              sizes_used: record.sizes_used ?? [],
              volume: record.volume ?? "",
              glue_product_id: record.glue_product_id,
              glue_used: record.glue_used ?? "",
              application_date: record.application_date,
              maintenance_days: record.maintenance_days ?? 21,
              notes: record.notes ?? "",
            }
          : emptyForm(),
      );
      setSizeDraft("");
    }
  }, [open, record]);

  const mutation = useMutation({
    mutationFn: async (input: TechnicalRecordInput) => {
      if (record) return updateTechnicalRecord(record.id, input);
      return createTechnicalRecord(clientId, input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["technical-records", clientId] });
      toast.success(record ? "Ficha atualizada" : "Ficha cadastrada");
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.application_date) return toast.error("Informe a data da aplicação");
    mutation.mutate(form);
  };

  const addSize = () => {
    const value = sizeDraft.trim();
    if (!value) return;
    const sizes = form.sizes_used ?? [];
    if (sizes.includes(value)) {
      setSizeDraft("");
      return;
    }
    setForm({ ...form, sizes_used: [...sizes, value] });
    setSizeDraft("");
  };

  const removeSize = (value: string) => {
    setForm({ ...form, sizes_used: (form.sizes_used ?? []).filter((size) => size !== value) });
  };

  const selectedGlueValue = form.glue_product_id ?? "none";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{record ? "Editar ficha técnica" : "Nova ficha técnica"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="procedure_type">Tipo de procedimento *</Label>
            <Select
              value={form.procedure_type}
              onValueChange={(v) => setForm({ ...form, procedure_type: v as ProcedureType })}
            >
              <SelectTrigger id="procedure_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROCEDURE_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="application_date">Data da aplicação *</Label>
              <Input
                id="application_date"
                type="date"
                value={form.application_date}
                onChange={(e) => setForm({ ...form, application_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maintenance_days">Retorno em dias</Label>
              <Input
                id="maintenance_days"
                type="number"
                min={1}
                value={form.maintenance_days}
                onChange={(e) =>
                  setForm({ ...form, maintenance_days: Number(e.target.value || 21) })
                }
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lash_model">Modelo / efeito</Label>
            <Select
              value={form.lash_model ?? ""}
              onValueChange={(v) => setForm({ ...form, lash_model: v })}
            >
              <SelectTrigger id="lash_model">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {LASH_MODELS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="curl">Curvatura</Label>
              <Select value={form.curl ?? ""} onValueChange={(v) => setForm({ ...form, curl: v })}>
                <SelectTrigger id="curl">
                  <SelectValue placeholder="-" />
                </SelectTrigger>
                <SelectContent>
                  {CURLS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="thickness">Espessura</Label>
              <Input
                id="thickness"
                value={form.thickness ?? ""}
                onChange={(e) => setForm({ ...form, thickness: e.target.value })}
                placeholder="0.05, 0.07..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="size-draft">Tamanhos usados</Label>
            <div className="flex gap-2">
              <Input
                id="size-draft"
                value={sizeDraft}
                onChange={(e) => setSizeDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSize();
                  }
                }}
                placeholder="ex.: 8, 9, 10"
              />
              <Button type="button" variant="outline" className="h-10" onClick={addSize}>
                <Plus className="mr-1 h-4 w-4" /> Adicionar
              </Button>
            </div>
            {(form.sizes_used ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(form.sizes_used ?? []).map((size) => (
                  <Badge key={size} variant="secondary" className="gap-1 pr-1">
                    {size}
                    <button
                      type="button"
                      onClick={() => removeSize(size)}
                      className="rounded-full p-0.5 hover:bg-background"
                      aria-label={`Remover tamanho ${size}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="volume">Volume</Label>
            <Input
              id="volume"
              value={form.volume ?? ""}
              onChange={(e) => setForm({ ...form, volume: e.target.value })}
              placeholder="Clássico, 2D, 3D..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="glue_product_id">Cola utilizada</Label>
            <Select
              value={selectedGlueValue}
              onValueChange={(v) => setForm({ ...form, glue_product_id: v === "none" ? null : v })}
            >
              <SelectTrigger id="glue_product_id">
                <SelectValue placeholder="Selecione uma cola" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma cola selecionada</SelectItem>
                {(glueProducts ?? []).map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.brand ? `${product.name} • ${product.brand}` : product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {record?.glue_used && !record.glue_product_id && (
              <p className="text-xs text-muted-foreground">Cola anterior: {record.glue_used}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Observações técnicas</Label>
            <Textarea
              id="notes"
              rows={3}
              value={form.notes ?? ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
