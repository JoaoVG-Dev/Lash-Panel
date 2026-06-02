import { useMutation, useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getUserSettings } from "@/lib/settings-api";
import {
  buildWhatsAppUrl,
  getWhatsAppTemplateMessage,
  logWhatsAppMessage,
  personalizeMessage,
  type WhatsAppMessageType,
  type WhatsAppTemplateVariables,
} from "@/lib/whatsapp-api";
import { cn } from "@/lib/utils";

type Props = {
  clientId: string;
  clientName: string;
  phone: string;
  appointmentId?: string | null;
  messageType?: WhatsAppMessageType;
  messageOverride?: string;
  variables?: WhatsAppTemplateVariables;
  label?: string;
  variant?: "default" | "outline" | "ghost" | "link" | "secondary" | "destructive";
  className?: string;
  disabled?: boolean;
};

export function WhatsAppActionButton({
  clientId,
  clientName,
  phone,
  appointmentId,
  messageType = "lembrete_manutencao",
  messageOverride,
  variables,
  label = "WhatsApp",
  variant = "outline",
  className,
  disabled = false,
}: Props) {
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: getUserSettings,
  });

  const logMutation = useMutation({
    mutationFn: (message: string) =>
      logWhatsAppMessage({
        client_id: clientId,
        appointment_id: appointmentId ?? null,
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
    const template = messageOverride ?? getWhatsAppTemplateMessage(settings, messageType);
    const message = personalizeMessage(template, {
      nome: clientName,
      profissional: settings?.professional_name ?? "",
      negocio: settings?.business_name ?? "",
      ...variables,
    });

    let url: string;
    try {
      url = buildWhatsAppUrl(phone, message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Telefone inválido para WhatsApp.");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
    logMutation.mutate(message);
    toast.success("WhatsApp aberto. Confirme o envio na conversa.");
  };

  return (
    <Button
      type="button"
      variant={variant}
      className={cn("h-11", className)}
      onClick={handleClick}
      disabled={disabled}
    >
      <MessageCircle className="mr-1 h-4 w-4" />
      {label}
    </Button>
  );
}
