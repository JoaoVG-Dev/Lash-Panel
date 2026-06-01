import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageEmpty } from "@/components/page-empty";

export const Route = createFileRoute("/_authenticated/produtos")({
  head: () => ({ meta: [{ title: "Produtos — Lash Manager" }] }),
  component: ProdutosPage,
});

function ProdutosPage() {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="h-11" size="sm">
          <Plus className="h-4 w-4 mr-1" /> Novo produto
        </Button>
      </div>
      <PageEmpty
        title="Nenhum produto cadastrado"
        description="Adicione produtos para acompanhar quantidade, validade e status."
      />
    </div>
  );
}