CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.product_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_images TO authenticated;
GRANT ALL ON public.product_images TO service_role;

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_images_select_public ON public.product_images
FOR SELECT TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM public.products p
  JOIN public.shops s ON s.id = p.shop_id
  WHERE p.id = product_images.product_id AND p.is_published AND s.is_active
));

CREATE POLICY product_images_manage_own ON public.product_images
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.products p
  JOIN public.shops s ON s.id = p.shop_id
  WHERE p.id = product_images.product_id AND s.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.products p
  JOIN public.shops s ON s.id = p.shop_id
  WHERE p.id = product_images.product_id AND s.owner_id = auth.uid()
));

CREATE INDEX product_images_product_id_idx ON public.product_images(product_id);

CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  group_name text NOT NULL DEFAULT 'Option',
  value text NOT NULL,
  price_delta integer NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.product_variants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
GRANT ALL ON public.product_variants TO service_role;

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_variants_select_public ON public.product_variants
FOR SELECT TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM public.products p
  JOIN public.shops s ON s.id = p.shop_id
  WHERE p.id = product_variants.product_id AND p.is_published AND s.is_active
));

CREATE POLICY product_variants_manage_own ON public.product_variants
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.products p
  JOIN public.shops s ON s.id = p.shop_id
  WHERE p.id = product_variants.product_id AND s.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.products p
  JOIN public.shops s ON s.id = p.shop_id
  WHERE p.id = product_variants.product_id AND s.owner_id = auth.uid()
));

CREATE INDEX product_variants_product_id_idx ON public.product_variants(product_id);

CREATE TRIGGER product_images_set_updated_at
BEFORE UPDATE ON public.product_images
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER product_variants_set_updated_at
BEFORE UPDATE ON public.product_variants
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.decrement_product_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    UPDATE public.products
    SET stock = GREATEST(0, stock - NEW.quantity)
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER order_items_decrement_stock
AFTER INSERT ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.decrement_product_stock();