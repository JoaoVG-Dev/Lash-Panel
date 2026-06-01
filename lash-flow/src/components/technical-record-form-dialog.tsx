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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createTechnicalRecord,
  updateTechnicalRecord,
  type TechnicalRecord,
  type TechnicalRecordInput,
} from "@/lib/technical-records-api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  record?: TechnicalRecord | null;
};

const PROCEDURE_TYPES = [
  "Extensão de cílios",
  "Manutenção de cílios",
  "Lash lifting",
  "Brow lamination",
  "Design de sobrancelhas",
  "Remoção",
  "Outro",
];

const LASH_MODELS = ["Natural", "Boneca", "Gatinho", "Fox eyes", "Delineado", "Personalizado"];
const CURLS = ["C", "CC", "D", "L", "M", "Outro"];

function today() {
  return new Date().toISOString().slice(0, 10);
}

const emptyForm = (): TechnicalRecordInput => ({
  procedure_type: "",
  lash_model: "",
  curl: "",
  thickness: "",
  sizes_used: "",
  volume: "",
  glue_used: "",
  application_date: today(),
  notes: "",
});

export function TechnicalRecordFormDialog({ open, onOpenChange, clientId, record }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState<TechnicalRecordInput>(emptyForm);

  useEffect(() => {
    if (open) {
      setForm(
        record
          ? {
              procedure_type: record.procedure_type,
              lash_model: record.lash_model ?? "",
              curl: record.curl ?? "",
              thickness: record.thickness ?? "",
              sizes_used: record.sizes_used ?? "",
              volume: record.volume ?? "",
              glue_used: record.glue_used ?? "",
              application_date: record.application_date,
              notes: record.notes ?? "",
            }
          : emptyForm(),
      );
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
    if (!form.procedure_type.trim()) return toast.error("Informe o tipo de procedimento");
    if (!form.application_date) return toast.error("Informe a data da aplicação");
    mutation.mutate(form);
  };

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
              onValueChange={(v) => setForm({ ...form, procedure_type: v })}
            >
              <SelectTrigger id="procedure_type">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {PROCEDURE_TYPES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
              <Select
                value={form.curl ?? ""}
                onValueChange={(v) => setForm({ ...form, curl: v })}
              >
                <SelectTrigger id="curl">
                  <SelectValue placeholder="—" />
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
                placeholder="0.05, 0.07…"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sizes_used">Tamanhos usados</Label>
            <Input
              id="sizes_used"
              value={form.sizes_used ?? ""}
              onChange={(e) => setForm({ ...form, sizes_used: e.target.value })}
              placeholder="ex.: 8, 9, 10, 11"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="volume">Volume</Label>
            <Input
              id="volume"
              value={form.volume ?? ""}
              onChange={(e) => setForm({ ...form, volume: e.target.value })}
              placeholder="Clássico, 2D, 3D…"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="glue_used">Cola utilizada</Label>
            <Input
              id="glue_used"
              value={form.glue_used ?? ""}
              onChange={(e) => setForm({ ...form, glue_used: e.target.value })}
            />
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
              {mutation.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}