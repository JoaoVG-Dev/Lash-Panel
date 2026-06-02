import { useMutation, useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getUserSettings } from "@/lib/settings-api";
import {
  buildWhatsAppUrl,
  logWhatsAppMessage,
  personalizeMessage,
  type WhatsAppMessageType,
} from "@/lib/whatsapp-api";

type Props = {
  clientId: string;
  clientName: string;
  phone: string;
  messageType?: WhatsAppMessageType;
  variant?: "default" | "outline";
};

export function WhatsAppActionButton({
  clientId,
  clientName,
  phone,
  messageType = "lembrete_manutencao",
  variant = "outline",
}: Props) {
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: getUserSettings,
  });

  const logMutation = useMutation({
    mutationFn: (message: string) =>
      logWhatsAppMessage({
        client_id: clientId,
        message_type: messageType,
        phone,
        message,
        status: "manual_opened",
      }),
    onError: () => {
      toast.error("WhatsApp aberto, mas não foi possível registrar o log.");
    },
  });

  const handleClick = () => {
    const baseMessage =
      messageType === "lembrete_agendar"
        ? settings?.schedule_reminder_message
        : settings?.default_whatsapp_message;
    const message = personalizeMessage(
      baseMessage ?? "Oi {nome}! Sua manutenção de cílios está chegando. Quer agendar?",
      clientName,
    );

    let url: string;
    try {
      url = buildWhatsAppUrl(phone, message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Telefone inválido para WhatsApp.");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
    logMutation.mutate(message);
  };

  return (
    <Button type="button" variant={variant} className="h-11" onClick={handleClick}>
      <MessageCircle className="mr-1 h-4 w-4" />
      WhatsApp
    </Button>
  );
}
