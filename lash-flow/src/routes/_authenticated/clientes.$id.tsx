import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Instagram, Pencil, Phone, Trash2 } from "lucide-react";
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
import { ClientFormDialog } from "@/components/client-form-dialog";
import { MaintenanceStatusSection } from "@/components/maintenance-status-section";
import { deleteClient, getClient } from "@/lib/clients-api";
import { TechnicalRecordsSection } from "@/components/technical-records-section";

export const Route = createFileRoute("/_authenticated/clientes/$id")({
  head: () => ({ meta: [{ title: "Cliente — Lash Manager" }] }),
  component: ClientDetailPage,
});

function formatDate(value: string | null) {
  if (!value) return "—";
  // birth_date is YYYY-MM-DD; avoid timezone issues
  const [y, m, d] = value.split("T")[0].split("-");
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}

function ClientDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const {
    data: client,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["client", id],
    queryFn: () => getClient(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteClient(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente excluída");
      navigate({ to: "/clientes" });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir");
    },
  });

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2 h-8 px-2">
        <Link to="/clientes">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Link>
      </Button>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error instanceof Error ? error.message : "Erro ao carregar cliente."}
        </div>
      )}

      {client && (
        <>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary">
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-semibold text-foreground">{client.name}</h2>
                <div className="mt-1">
                  <Badge variant={client.status === "active" ? "default" : "secondary"}>
                    {client.status === "active" ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              </div>
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              <InfoRow icon={<Phone className="h-4 w-4" />} label="WhatsApp" value={client.phone} />
              <InfoRow
                icon={<Instagram className="h-4 w-4" />}
                label="Instagram"
                value={client.instagram || "—"}
              />
              <InfoRow label="Nascimento" value={formatDate(client.birth_date)} />
              <InfoRow label="Cadastro" value={formatDate(client.created_at)} />
              {client.notes && (
                <div>
                  <dt className="text-xs text-muted-foreground">Observações</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                    {client.notes}
                  </dd>
                </div>
              )}
            </dl>

            <div className="mt-4 flex gap-2">
              <Button className="flex-1 h-11" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4 mr-1" /> Editar
              </Button>
              <Button
                variant="outline"
                className="h-11 text-destructive hover:text-destructive"
                onClick={() => setConfirmOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ClientFormDialog open={editOpen} onOpenChange={setEditOpen} client={client} />

          <TechnicalRecordsSection clientId={client.id} />

          <MaintenanceStatusSection clientId={client.id} />

          <FuturePlaceholder title="Anamnese" description="Em breve." />
          <FuturePlaceholder title="Atendimentos" description="Em breve." />

          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Os dados de {client.name} serão removidos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    deleteMutation.mutate();
                  }}
                  disabled={deleteMutation.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteMutation.isPending ? "Excluindo…" : "Excluir"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="text-right text-sm text-foreground">{value}</dd>
    </div>
  );
}

function FuturePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-card p-4">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
