import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageEmpty } from "@/components/page-empty";

export const Route = createFileRoute("/_authenticated/atendimentos")({
  head: () => ({ meta: [{ title: "Atendimentos — Lash Manager" }] }),
  component: AtendimentosPage,
});

function AtendimentosPage() {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="h-11" size="sm">
          <Plus className="h-4 w-4 mr-1" /> Novo atendimento
        </Button>
      </div>
      <PageEmpty
        title="Nenhum atendimento ainda"
        description="Registre seus atendimentos para acompanhar fichas, anamnese e manutenções."
      />
    </div>
  );
}