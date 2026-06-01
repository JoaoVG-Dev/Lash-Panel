CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  technical_record_id uuid REFERENCES public.client_technical_records(id) ON DELETE SET NULL,
  appointment_type text NOT NULL DEFAULT 'manutencao',
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (
    status IN ('scheduled', 'completed', 'canceled', 'no_show')
  ),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX idx_appointments_scheduled_at ON public.appointments(scheduled_at);
CREATE INDEX idx_appointments_status ON public.appointments(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own appointments"
ON public.appointments FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create appointments for their own clients"
ON public.appointments FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = client_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own appointments"
ON public.appointments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own appointments"
ON public.appointments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
