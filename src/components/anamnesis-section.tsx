import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, FilePenLine, LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  ANAMNESIS_QUESTIONS,
  EMPTY_ANAMNESIS_ANSWERS,
  getClientAnamnesis,
  saveClientAnamnesis,
  type AnamnesisAnswers,
} from "@/lib/anamnesis-api";
import {
  buildPublicAnamnesisUrl,
  createAnamnesisPublicToken,
  getLatestAnamnesisPublicToken,
} from "@/lib/anamnesis-public-api";
import { WhatsAppActionButton } from "@/components/whatsapp-action-button";

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
}

export function AnamnesisSection({
  clientId,
  clientName,
  phone,
}: {
  clientId: string;
  clientName: string;
  phone: string;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<AnamnesisAnswers>(EMPTY_ANAMNESIS_ANSWERS);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["anamnesis", clientId],
    queryFn: () => getClientAnamnesis(clientId),
  });

  const { data: publicToken, isLoading: isLoadingToken } = useQuery({
    queryKey: ["anamnesis-public-token", clientId],
    queryFn: () => getLatestAnamnesisPublicToken(clientId),
  });

  useEffect(() => {
    if (open) {
      setAnswers(data?.answers ?? EMPTY_ANAMNESIS_ANSWERS);
    }
  }, [data?.answers, open]);

  const mutation = useMutation({
    mutationFn: (input: AnamnesisAnswers) => saveClientAnamnesis(clientId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["anamnesis", clientId] });
      toast.success("Anamnese salva");
      setOpen(false);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar anamnese");
    },
  });

  const tokenMutation = useMutation({
    mutationFn: () => createAnamnesisPublicToken(clientId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["anamnesis-public-token", clientId] });
      toast.success("Link de anamnese gerado");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar link de anamnese");
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!answers.accepted_terms) {
      toast.error("Marque o aceite do termo de responsabilidade");
      return;
    }
    mutation.mutate(answers);
  };

  const anamnesisUrl = publicToken ? buildPublicAnamnesisUrl(publicToken.token) : null;

  const handleCopyLink = async () => {
    if (!anamnesisUrl) return;

    try {
      await navigator.clipboard.writeText(anamnesisUrl);
      toast.success("Link copiado");
    } catch {
      toast.error("Não foi possível copiar o link automaticamente.");
    }
  };

  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">Anamnese</h3>
        {!isLoading && (
          <Badge variant={data ? "default" : "secondary"}>{data ? "Preenchida" : "Pendente"}</Badge>
        )}
      </div>

      {isLoading && <Skeleton className="mt-3 h-20 w-full rounded-lg" />}

      {isError && (
        <div className="mt-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error instanceof Error ? error.message : "Erro ao carregar anamnese."}
        </div>
      )}

      {!isLoading && !isError && (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-muted-foreground">
            {data
              ? `Preenchida em ${formatDate(data.completed_at)}.`
              : "Ainda não há anamnese preenchida para esta cliente."}
          </p>
          <Button
            className="h-11 w-full"
            variant={data ? "outline" : "default"}
            onClick={() => setOpen(true)}
          >
            <FilePenLine className="mr-1 h-4 w-4" />
            {data ? "Editar anamnese" : "Preencher anamnese"}
          </Button>

          <div className="rounded-lg border bg-background p-3">
            <div className="flex items-start gap-2">
              <LinkIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">Link para a cliente preencher</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Gere um link seguro para a cliente preencher a anamnese sem acessar o painel.
                </p>
              </div>
            </div>

            {anamnesisUrl && (
              <div className="mt-3 rounded-md bg-muted p-2 text-xs text-muted-foreground">
                <p className="break-all">{anamnesisUrl}</p>
                <p className="mt-1">Expira em {formatDate(publicToken.expires_at)}.</p>
              </div>
            )}

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <Button
                type="button"
                className="h-11"
                variant={anamnesisUrl ? "outline" : "default"}
                onClick={() => tokenMutation.mutate()}
                disabled={tokenMutation.isPending || isLoadingToken}
              >
                {tokenMutation.isPending
                  ? "Gerando..."
                  : anamnesisUrl
                    ? "Gerar novo"
                    : "Gerar link"}
              </Button>
              <Button
                type="button"
                className="h-11"
                variant="outline"
                onClick={handleCopyLink}
                disabled={!anamnesisUrl}
              >
                <Copy className="mr-1 h-4 w-4" />
                Copiar
              </Button>
              <WhatsAppActionButton
                clientId={clientId}
                clientName={clientName}
                phone={phone}
                messageType="link_anamnese"
                variables={{ link_anamnese: anamnesisUrl ?? "" }}
                label="WhatsApp"
                disabled={!anamnesisUrl}
              />
            </div>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{data ? "Editar anamnese" : "Nova anamnese"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              {ANAMNESIS_QUESTIONS.map((question) => (
                <CheckboxRow
                  key={question.key}
                  label={question.label}
                  checked={Boolean(answers[question.key])}
                  onCheckedChange={(checked) => setAnswers({ ...answers, [question.key]: checked })}
                />
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="anamnesis-notes">Observações adicionais</Label>
              <Textarea
                id="anamnesis-notes"
                rows={4}
                value={answers.additional_notes}
                onChange={(event) =>
                  setAnswers({ ...answers, additional_notes: event.target.value })
                }
              />
            </div>

            <CheckboxRow
              label="Cliente aceitou o termo de responsabilidade"
              checked={answers.accepted_terms}
              onCheckedChange={(checked) => setAnswers({ ...answers, accepted_terms: checked })}
            />

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
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
    </section>
  );
}

function CheckboxRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 rounded-lg border bg-background p-3 text-sm">
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        className="mt-0.5"
      />
      <span className="text-foreground">{label}</span>
    </label>
  );
}
