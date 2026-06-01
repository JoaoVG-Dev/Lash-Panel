CREATE TABLE public.client_technical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  procedure_type text NOT NULL,
  lash_model text,
  curl text,
  thickness text,
  sizes_used text,
  volume text,
  glue_used text,
  application_date date NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ctr_client_id ON public.client_technical_records(client_id);
CREATE INDEX idx_ctr_user_id ON public.client_technical_records(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_technical_records TO authenticated;
GRANT ALL ON public.client_technical_records TO service_role;

ALTER TABLE public.client_technical_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own technical records"
ON public.client_technical_records FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create technical records for their own clients"
ON public.client_technical_records FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = client_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own technical records"
ON public.client_technical_records FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own technical records"
ON public.client_technical_records FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_client_technical_records_updated_at
BEFORE UPDATE ON public.client_technical_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();