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
import { createService, updateService, type Service, type ServiceInput } from "@/lib/services-api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service | null;
};

function emptyForm(): ServiceInput {
  return {
    name: "",
    description: "",
    price: 0,
    active: true,
  };
}

export function ServiceFormDialog({ open, onOpenChange, service }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState<ServiceInput>(emptyForm);

  useEffect(() => {
    if (!open) return;

    setForm(
      service
        ? {
            name: service.name,
            description: service.description ?? "",
            price: service.price,
            active: service.active,
          }
        : emptyForm(),
    );
  }, [open, service]);

  const mutation = useMutation({
    mutationFn: (input: ServiceInput) => {
      if (service) return updateService(service.id, input);
      return createService(input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services"] });
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success(service ? "Serviço atualizado" : "Serviço cadastrado");
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar serviço");
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Informe o nome do serviço");
      return;
    }
    if (!Number.isFinite(Number(form.price)) || Number(form.price) < 0) {
      toast.error("Informe um preço válido");
      return;
    }

    mutation.mutate(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{service ? "Editar serviço" : "Novo serviço"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="service-name">Nome *</Label>
            <Input
              id="service-name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Volume brasileiro, manutenção..."
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="service-description">Descrição</Label>
            <Textarea
              id="service-description"
              rows={3}
              value={form.description ?? ""}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="service-price">Preço *</Label>
              <Input
                id="service-price"
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(event) => setForm({ ...form, price: Number(event.target.value || 0) })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="service-status">Status</Label>
              <Select
                value={form.active ? "active" : "inactive"}
                onValueChange={(value) => setForm({ ...form, active: value === "active" })}
              >
                <SelectTrigger id="service-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
