CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  brand text,
  category text,
  product_type text NOT NULL DEFAULT 'outros' CHECK (
    product_type IN ('cola', 'fios', 'removedor', 'primer', 'cleanser', 'outros')
  ),
  quantity numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'un',
  expiration_date date,
  alert_quantity numeric,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_user_id ON public.products(user_id);
CREATE INDEX idx_products_product_type ON public.products(product_type);
CREATE INDEX idx_products_expiration_date ON public.products(expiration_date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own products"
ON public.products FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own products"
ON public.products FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products"
ON public.products FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products"
ON public.products FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
