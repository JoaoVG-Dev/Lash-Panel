import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { TechnicalRecordFormDialog } from "@/components/technical-record-form-dialog";
import {
  deleteTechnicalRecord,
  getGlueDisplayName,
  getProcedureTypeLabel,
  listTechnicalRecords,
  type TechnicalRecord,
} from "@/lib/technical-records-api";

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const [y, m, d] = value.split("T")[0].split("-");
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}

export function TechnicalRecordsSection({ clientId }: { clientId: string }) {
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TechnicalRecord | null>(null);
  const [toDelete, setToDelete] = useState<TechnicalRecord | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["technical-records", clientId],
    queryFn: () => listTechnicalRecords(clientId),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTechnicalRecord(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["technical-records", clientId] });
      toast.success("Ficha excluída");
      setToDelete(null);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir");
    },
  });

  const records = data ?? [];
  const latest = records[0];
  const history = records.slice(1);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (r: TechnicalRecord) => {
    setEditing(r);
    setFormOpen(true);
  };

  return (
    <section className="beauty-card rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">Ficha técnica</h3>
        <Button size="sm" onClick={openCreate} className="h-9">
          <Plus className="mr-1 h-4 w-4" /> Nova
        </Button>
      </div>

      <div className="mt-3 space-y-3">
        {isLoading && <Skeleton className="h-28 w-full rounded-lg" />}

        {isError && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            {error instanceof Error ? error.message : "Erro ao carregar fichas."}
          </div>
        )}

        {!isLoading && !isError && records.length === 0 && (
          <div className="rounded-2xl border border-dashed p-4 text-center">
            <p className="text-sm text-foreground">Nenhuma ficha técnica ainda</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Cadastre a primeira ficha desta cliente.
            </p>
          </div>
        )}

        {latest && (
          <RecordCard
            record={latest}
            highlighted
            onEdit={() => openEdit(latest)}
            onDelete={() => setToDelete(latest)}
          />
        )}

        {history.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Histórico</p>
            {history.map((r) => (
              <RecordCard
                key={r.id}
                record={r}
                onEdit={() => openEdit(r)}
                onDelete={() => setToDelete(r)}
              />
            ))}
          </div>
        )}
      </div>

      <TechnicalRecordFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        clientId={clientId}
        record={editing}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ficha técnica?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
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
    </section>
  );
}

function RecordCard({
  record,
  highlighted,
  onEdit,
  onDelete,
}: {
  record: TechnicalRecord;
  highlighted?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const glueName = getGlueDisplayName(record);
  const fields: Array<[string, string | null]> = [
    ["Modelo", record.lash_model],
    ["Curvatura", record.curl],
    ["Espessura", record.thickness],
    ["Volume", record.volume],
    ["Cola", glueName],
    ["Retorno", `${record.maintenance_days} dias`],
  ];
  const filled = fields.filter(([, v]) => v && v.trim());

  return (
    <div
      className={`rounded-2xl border p-3 ${
        highlighted ? "border-primary/40 bg-primary/5" : "bg-card/80"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium text-foreground">
              {getProcedureTypeLabel(record.procedure_type)}
            </p>
            {highlighted && <Badge variant="default">Atual</Badge>}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatDate(record.application_date)}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0"
            onClick={onEdit}
            aria-label="Editar"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 text-destructive hover:text-destructive"
            onClick={onDelete}
            aria-label="Excluir"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {record.sizes_used.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {record.sizes_used.map((size) => (
            <Badge key={size} variant="secondary" className="text-[10px]">
              {size}
            </Badge>
          ))}
        </div>
      )}

      {filled.length > 0 && (
        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
          {filled.map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-secondary/60 px-3 py-2">
              <dt className="font-bold uppercase text-muted-foreground">{k}</dt>
              <dd className="mt-1 truncate font-semibold text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      )}

      {record.notes && (
        <p className="mt-2 whitespace-pre-wrap text-xs text-foreground">{record.notes}</p>
      )}
    </div>
  );
}
