CREATE TABLE public.whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  message_type text NOT NULL CHECK (
    message_type IN ('cancelamento', 'lembrete_manutencao', 'lembrete_agendar')
  ),
  name text NOT NULL,
  message text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_whatsapp_templates_user_id ON public.whatsapp_templates(user_id);
CREATE INDEX idx_whatsapp_templates_message_type ON public.whatsapp_templates(message_type);

CREATE TABLE public.whatsapp_message_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  template_id uuid REFERENCES public.whatsapp_templates(id) ON DELETE SET NULL,
  message_type text NOT NULL CHECK (
    message_type IN ('cancelamento', 'lembrete_manutencao', 'lembrete_agendar')
  ),
  phone text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'sent', 'failed', 'canceled')
  ),
  provider_message_id text,
  error_message text,
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_whatsapp_message_logs_user_id ON public.whatsapp_message_logs(user_id);
CREATE INDEX idx_whatsapp_message_logs_client_id ON public.whatsapp_message_logs(client_id);
CREATE INDEX idx_whatsapp_message_logs_status ON public.whatsapp_message_logs(status);
CREATE INDEX idx_whatsapp_message_logs_message_type ON public.whatsapp_message_logs(message_type);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_message_logs TO authenticated;
GRANT ALL ON public.whatsapp_templates TO service_role;
GRANT ALL ON public.whatsapp_message_logs TO service_role;

ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_message_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own whatsapp templates"
ON public.whatsapp_templates FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own whatsapp templates"
ON public.whatsapp_templates FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own whatsapp templates"
ON public.whatsapp_templates FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own whatsapp templates"
ON public.whatsapp_templates FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own whatsapp logs"
ON public.whatsapp_message_logs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own whatsapp logs"
ON public.whatsapp_message_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own whatsapp logs"
ON public.whatsapp_message_logs FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own whatsapp logs"
ON public.whatsapp_message_logs FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_whatsapp_templates_updated_at
BEFORE UPDATE ON public.whatsapp_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_message_logs_updated_at
BEFORE UPDATE ON public.whatsapp_message_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
