import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarPlus, Instagram, Pencil, Phone, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { InitialsAvatar } from "@/components/app/page-shell";
import { AnamnesisSection } from "@/components/anamnesis-section";
import { ClientAppointmentsSection } from "@/components/client-appointments-section";
import { ClientFormDialog } from "@/components/client-form-dialog";
import { MaintenanceStatusSection } from "@/components/maintenance-status-section";
import { TechnicalRecordsSection } from "@/components/technical-records-section";
import { WhatsAppActionButton } from "@/components/whatsapp-action-button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deleteClient, getClient } from "@/lib/clients-api";

export const Route = createFileRoute("/_authenticated/clientes/$id")({
  head: () => ({ meta: [{ title: "Cliente — Lash Panel" }] }),
  component: ClientDetailPage,
});

function formatDate(value: string | null) {
  if (!value) return "—";
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
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/clientes">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </Button>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-52 w-full rounded-2xl" />
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error instanceof Error ? error.message : "Erro ao carregar cliente."}
        </div>
      )}

      {client && (
        <>
          <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
            <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
              <section className="beauty-panel rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <InitialsAvatar name={client.name} className="h-16 w-16 text-lg" />
                  <div className="min-w-0 flex-1">
                    <Badge variant={client.status === "active" ? "default" : "secondary"}>
                      {client.status === "active" ? "Ativa" : "Inativa"}
                    </Badge>
                    <h1 className="display-title mt-2 truncate text-4xl text-foreground">
                      {client.name}
                    </h1>
                  </div>
                </div>

                <dl className="mt-5 space-y-3 text-sm">
                  <InfoRow
                    icon={<Phone className="h-4 w-4" />}
                    label="WhatsApp"
                    value={client.phone}
                  />
                  <InfoRow
                    icon={<Instagram className="h-4 w-4" />}
                    label="Instagram"
                    value={client.instagram || "—"}
                  />
                  <InfoRow label="Nascimento" value={formatDate(client.birth_date)} />
                  <InfoRow label="Cadastro" value={formatDate(client.created_at)} />
                </dl>

                {client.notes && (
                  <div className="mt-4 rounded-2xl border bg-secondary/60 p-3">
                    <p className="text-xs font-bold uppercase text-muted-foreground">Observações</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                      {client.notes}
                    </p>
                  </div>
                )}

                <div className="mt-5 grid gap-2">
                  <WhatsAppActionButton
                    clientId={client.id}
                    clientName={client.name}
                    phone={client.phone}
                    className="w-full"
                  />
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <Button variant="outline" onClick={() => setEditOpen(true)}>
                      <Pencil className="h-4 w-4" />
                      Editar cliente
                    </Button>
                    <Button
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setConfirmOpen(true)}
                      aria-label="Excluir cliente"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button asChild variant="secondary">
                    <Link to="/atendimentos">
                      <CalendarPlus className="h-4 w-4" />
                      Novo atendimento
                    </Link>
                  </Button>
                </div>
              </section>

              <MaintenanceStatusSection clientId={client.id} />
            </aside>

            <Tabs defaultValue="overview" className="min-w-0">
              <div className="hide-scrollbar overflow-x-auto pb-1">
                <TabsList className="w-max min-w-full justify-start">
                  <TabsTrigger value="overview">Visão geral</TabsTrigger>
                  <TabsTrigger value="technical">Ficha técnica</TabsTrigger>
                  <TabsTrigger value="anamnesis">Anamnese</TabsTrigger>
                  <TabsTrigger value="history">Histórico</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="overview" className="space-y-4">
                <ClientAppointmentsSection clientId={client.id} />
              </TabsContent>

              <TabsContent value="technical">
                <TechnicalRecordsSection clientId={client.id} />
              </TabsContent>

              <TabsContent value="anamnesis">
                <AnamnesisSection
                  clientId={client.id}
                  clientName={client.name}
                  phone={client.phone}
                />
              </TabsContent>

              <TabsContent value="history">
                <ClientAppointmentsSection clientId={client.id} />
              </TabsContent>
            </Tabs>
          </div>

          <ClientFormDialog open={editOpen} onOpenChange={setEditOpen} client={client} />

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
                  {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
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
      <dt className="flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="min-w-0 text-right text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}
