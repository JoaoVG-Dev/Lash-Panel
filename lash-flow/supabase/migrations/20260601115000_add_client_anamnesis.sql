CREATE TABLE public.client_anamnesis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, client_id)
);

CREATE INDEX idx_client_anamnesis_user_id ON public.client_anamnesis(user_id);
CREATE INDEX idx_client_anamnesis_client_id ON public.client_anamnesis(client_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_anamnesis TO authenticated;
GRANT ALL ON public.client_anamnesis TO service_role;

ALTER TABLE public.client_anamnesis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own anamnesis"
ON public.client_anamnesis FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create anamnesis for their own clients"
ON public.client_anamnesis FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = client_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own anamnesis"
ON public.client_anamnesis FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own anamnesis"
ON public.client_anamnesis FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_client_anamnesis_updated_at
BEFORE UPDATE ON public.client_anamnesis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
