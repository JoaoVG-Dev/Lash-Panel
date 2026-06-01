import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FilePenLine } from "lucide-react";
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
  EMPTY_ANAMNESIS_ANSWERS,
  getClientAnamnesis,
  saveClientAnamnesis,
  type AnamnesisAnswers,
} from "@/lib/anamnesis-api";

type BooleanAnamnesisKey = Exclude<keyof AnamnesisAnswers, "additional_notes">;

const QUESTIONS: Array<{ key: BooleanAnamnesisKey; label: string }> = [
  { key: "uses_contact_lenses", label: "Usa lentes de contato?" },
  { key: "has_allergy", label: "Possui alguma alergia?" },
  { key: "glue_or_cosmetic_allergy", label: "Tem alergia a cola ou cosméticos?" },
  { key: "recent_eye_procedure", label: "Fez procedimento recente nos olhos?" },
  { key: "pregnant", label: "Está grávida?" },
  { key: "eye_sensitivity", label: "Tem sensibilidade ocular?" },
  { key: "uses_medication", label: "Usa algum medicamento?" },
];

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
}

export function AnamnesisSection({ clientId }: { clientId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<AnamnesisAnswers>(EMPTY_ANAMNESIS_ANSWERS);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["anamnesis", clientId],
    queryFn: () => getClientAnamnesis(clientId),
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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!answers.accepted_terms) {
      toast.error("Marque o aceite do termo de responsabilidade");
      return;
    }
    mutation.mutate(answers);
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
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{data ? "Editar anamnese" : "Nova anamnese"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              {QUESTIONS.map((question) => (
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
