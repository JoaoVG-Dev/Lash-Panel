CREATE TABLE IF NOT EXISTS public.anamnesis_public_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  token text NOT NULL DEFAULT (
    replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
  ),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (token)
);

CREATE INDEX IF NOT EXISTS idx_anamnesis_public_tokens_user_id
ON public.anamnesis_public_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_anamnesis_public_tokens_client_id
ON public.anamnesis_public_tokens(client_id);

CREATE INDEX IF NOT EXISTS idx_anamnesis_public_tokens_token
ON public.anamnesis_public_tokens(token);

CREATE INDEX IF NOT EXISTS idx_anamnesis_public_tokens_active
ON public.anamnesis_public_tokens(token, expires_at)
WHERE used_at IS NULL AND revoked_at IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.anamnesis_public_tokens TO authenticated;
GRANT ALL ON public.anamnesis_public_tokens TO service_role;

ALTER TABLE public.anamnesis_public_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own anamnesis public tokens"
ON public.anamnesis_public_tokens;

CREATE POLICY "Users can view their own anamnesis public tokens"
ON public.anamnesis_public_tokens FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create anamnesis public tokens for own clients"
ON public.anamnesis_public_tokens;

CREATE POLICY "Users can create anamnesis public tokens for own clients"
ON public.anamnesis_public_tokens FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = client_id AND c.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update their own anamnesis public tokens"
ON public.anamnesis_public_tokens;

CREATE POLICY "Users can update their own anamnesis public tokens"
ON public.anamnesis_public_tokens FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own anamnesis public tokens"
ON public.anamnesis_public_tokens;

CREATE POLICY "Users can delete their own anamnesis public tokens"
ON public.anamnesis_public_tokens FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_anamnesis_public_tokens_updated_at
ON public.anamnesis_public_tokens;

CREATE TRIGGER update_anamnesis_public_tokens_updated_at
BEFORE UPDATE ON public.anamnesis_public_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.get_public_anamnesis_token(p_token text)
RETURNS TABLE (
  token_id uuid,
  client_name text,
  business_name text,
  professional_name text,
  expires_at timestamptz,
  used_at timestamptz,
  revoked_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id AS token_id,
    c.name AS client_name,
    s.business_name,
    s.professional_name,
    t.expires_at,
    t.used_at,
    t.revoked_at
  FROM public.anamnesis_public_tokens t
  JOIN public.clients c ON c.id = t.client_id
  LEFT JOIN public.user_settings s ON s.user_id = t.user_id
  WHERE t.token = p_token
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_anamnesis_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_anamnesis_token(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.submit_public_anamnesis(p_token text, p_answers jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token_row public.anamnesis_public_tokens%ROWTYPE;
  saved_id uuid;
BEGIN
  SELECT *
  INTO token_row
  FROM public.anamnesis_public_tokens
  WHERE token = p_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_token';
  END IF;

  IF token_row.revoked_at IS NOT NULL THEN
    RAISE EXCEPTION 'revoked_token';
  END IF;

  IF token_row.used_at IS NOT NULL THEN
    RAISE EXCEPTION 'used_token';
  END IF;

  IF token_row.expires_at <= now() THEN
    RAISE EXCEPTION 'expired_token';
  END IF;

  INSERT INTO public.client_anamnesis (user_id, client_id, answers, completed_at)
  VALUES (token_row.user_id, token_row.client_id, p_answers, now())
  ON CONFLICT (user_id, client_id)
  DO UPDATE SET
    answers = EXCLUDED.answers,
    completed_at = now(),
    updated_at = now()
  RETURNING id INTO saved_id;

  UPDATE public.anamnesis_public_tokens
  SET used_at = now(), updated_at = now()
  WHERE id = token_row.id;

  RETURN saved_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_public_anamnesis(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_public_anamnesis(text, jsonb) TO anon, authenticated;
