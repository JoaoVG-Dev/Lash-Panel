CREATE OR REPLACE FUNCTION public.normalize_product_brand_name(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(
    regexp_replace(
      trim(
        translate(
          coalesce(input, ''),
          'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ',
          'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn'
        )
      ),
      '\s+',
      ' ',
      'g'
    )
  );
$$;

CREATE TABLE IF NOT EXISTS public.product_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  normalized_name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_product_brand_normalized_name()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.name := trim(regexp_replace(coalesce(NEW.name, ''), '\s+', ' ', 'g'));
  NEW.normalized_name := public.normalize_product_brand_name(NEW.name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_product_brand_normalized_name ON public.product_brands;
CREATE TRIGGER set_product_brand_normalized_name
BEFORE INSERT OR UPDATE OF name ON public.product_brands
FOR EACH ROW
EXECUTE FUNCTION public.set_product_brand_normalized_name();

DROP TRIGGER IF EXISTS update_product_brands_updated_at ON public.product_brands;
CREATE TRIGGER update_product_brands_updated_at
BEFORE UPDATE ON public.product_brands
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_product_brands_user_id
ON public.product_brands(user_id);

CREATE INDEX IF NOT EXISTS idx_product_brands_status
ON public.product_brands(status);

CREATE UNIQUE INDEX IF NOT EXISTS product_brands_user_normalized_name_key
ON public.product_brands(user_id, normalized_name);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_brands TO authenticated;
GRANT ALL ON public.product_brands TO service_role;

ALTER TABLE public.product_brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own product brands" ON public.product_brands;
CREATE POLICY "Users can view their own product brands"
ON public.product_brands FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own product brands" ON public.product_brands;
CREATE POLICY "Users can create their own product brands"
ON public.product_brands FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own product brands" ON public.product_brands;
CREATE POLICY "Users can update their own product brands"
ON public.product_brands FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own product brands" ON public.product_brands;
CREATE POLICY "Users can delete their own product brands"
ON public.product_brands FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS brand_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_brand_id_fkey'
  ) THEN
    ALTER TABLE public.products
    ADD CONSTRAINT products_brand_id_fkey
    FOREIGN KEY (brand_id)
    REFERENCES public.product_brands(id)
    ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_brand_id
ON public.products(brand_id);

WITH legacy_brands AS (
  SELECT
    user_id,
    min(trim(regexp_replace(brand, '\s+', ' ', 'g'))) AS name,
    public.normalize_product_brand_name(brand) AS normalized_name
  FROM public.products
  WHERE brand IS NOT NULL
    AND trim(brand) <> ''
  GROUP BY user_id, public.normalize_product_brand_name(brand)
)
INSERT INTO public.product_brands (user_id, name, normalized_name)
SELECT user_id, name, normalized_name
FROM legacy_brands
WHERE normalized_name <> ''
ON CONFLICT (user_id, normalized_name) DO UPDATE
SET name = EXCLUDED.name,
    updated_at = now();

UPDATE public.products AS product
SET brand_id = brand.id
FROM public.product_brands AS brand
WHERE product.brand_id IS NULL
  AND product.brand IS NOT NULL
  AND trim(product.brand) <> ''
  AND product.user_id = brand.user_id
  AND public.normalize_product_brand_name(product.brand) = brand.normalized_name;
