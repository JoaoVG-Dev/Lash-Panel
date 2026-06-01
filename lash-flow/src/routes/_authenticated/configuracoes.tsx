import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — Lash Manager" }] }),
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const [prazo, setPrazo] = useState("21");
  const [antecedencia, setAntecedencia] = useState("3");
  const [mensagem, setMensagem] = useState(
    "Oi! Sua manutenção de cílios está chegando. Quer agendar?",
  );

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        toast.success("Configurações salvas (localmente nesta fase).");
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="prazo">Prazo padrão de manutenção (dias)</Label>
        <Input
          id="prazo"
          type="number"
          min={1}
          value={prazo}
          onChange={(e) => setPrazo(e.target.value)}
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="antecedencia">Lembrete com quantos dias de antecedência</Label>
        <Input
          id="antecedencia"
          type="number"
          min={0}
          value={antecedencia}
          onChange={(e) => setAntecedencia(e.target.value)}
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="mensagem">Mensagem padrão de WhatsApp</Label>
        <Textarea
          id="mensagem"
          rows={4}
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full h-11">
        Salvar
      </Button>
    </form>
  );
}
