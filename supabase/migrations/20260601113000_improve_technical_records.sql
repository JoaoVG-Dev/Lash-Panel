ALTER TABLE public.client_technical_records
ADD COLUMN glue_product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
ADD COLUMN maintenance_days integer NOT NULL DEFAULT 21 CHECK (maintenance_days > 0),
ADD COLUMN sizes_used_list text[] NOT NULL DEFAULT '{}'::text[];

UPDATE public.client_technical_records
SET sizes_used_list = array_remove(regexp_split_to_array(coalesce(sizes_used, ''), '\s*,\s*'), '')
WHERE sizes_used IS NOT NULL AND btrim(sizes_used) <> '';

ALTER TABLE public.client_technical_records
DROP COLUMN sizes_used;

ALTER TABLE public.client_technical_records
RENAME COLUMN sizes_used_list TO sizes_used;

CREATE INDEX idx_ctr_glue_product_id ON public.client_technical_records(glue_product_id);

DROP POLICY IF EXISTS "Users can create technical records for their own clients"
ON public.client_technical_records;

CREATE POLICY "Users can create technical records for their own clients"
ON public.client_technical_records FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = client_id AND c.user_id = auth.uid()
  )
  AND (
    glue_product_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = glue_product_id AND p.user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Users can update their own technical records"
ON public.client_technical_records;

CREATE POLICY "Users can update their own technical records"
ON public.client_technical_records FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND (
    glue_product_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = glue_product_id AND p.user_id = auth.uid()
    )
  )
);
