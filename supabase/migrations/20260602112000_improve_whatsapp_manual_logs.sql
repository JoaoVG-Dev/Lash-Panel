ALTER TABLE public.whatsapp_message_logs
  ADD COLUMN IF NOT EXISTS template_type text,
  ADD COLUMN IF NOT EXISTS message_body text,
  ADD COLUMN IF NOT EXISTS opened_at timestamptz;

UPDATE public.whatsapp_message_logs
SET
  template_type = COALESCE(template_type, message_type),
  message_body = COALESCE(message_body, message),
  opened_at = CASE
    WHEN status = 'manual_opened' THEN COALESCE(opened_at, sent_at, created_at)
    ELSE opened_at
  END;

ALTER TABLE public.whatsapp_message_logs
  DROP CONSTRAINT IF EXISTS whatsapp_message_logs_message_type_check;

ALTER TABLE public.whatsapp_message_logs
  ADD CONSTRAINT whatsapp_message_logs_message_type_check
  CHECK (
    message_type IN (
      'cancelamento',
      'confirmacao_atendimento',
      'lembrete_manutencao',
      'lembrete_agendar',
      'link_anamnese'
    )
  );

ALTER TABLE public.whatsapp_templates
  DROP CONSTRAINT IF EXISTS whatsapp_templates_message_type_check;

ALTER TABLE public.whatsapp_templates
  ADD CONSTRAINT whatsapp_templates_message_type_check
  CHECK (
    message_type IN (
      'cancelamento',
      'confirmacao_atendimento',
      'lembrete_manutencao',
      'lembrete_agendar',
      'link_anamnese'
    )
  );

ALTER TABLE public.whatsapp_message_logs
  DROP CONSTRAINT IF EXISTS whatsapp_message_logs_status_check;

ALTER TABLE public.whatsapp_message_logs
  ADD CONSTRAINT whatsapp_message_logs_status_check
  CHECK (status IN ('pending', 'manual_opened', 'sent', 'failed', 'canceled'));

CREATE INDEX IF NOT EXISTS idx_whatsapp_message_logs_template_type
ON public.whatsapp_message_logs(template_type);

CREATE INDEX IF NOT EXISTS idx_whatsapp_message_logs_opened_at
ON public.whatsapp_message_logs(opened_at);
