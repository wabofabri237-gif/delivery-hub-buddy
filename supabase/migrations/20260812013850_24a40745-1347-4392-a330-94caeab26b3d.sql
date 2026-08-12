ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS courier_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS orders_courier_id_idx ON public.orders (courier_id);

CREATE POLICY "orders_select_courier" ON public.orders
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'livreur')
  AND (
    courier_id = auth.uid()
    OR (courier_id IS NULL AND status = 'preparee'::order_status)
  )
);

CREATE POLICY "orders_update_courier" ON public.orders
FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'livreur')
  AND (
    courier_id = auth.uid()
    OR (courier_id IS NULL AND status = 'preparee'::order_status)
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'livreur')
  AND courier_id = auth.uid()
);

CREATE POLICY "order_items_select_courier" ON public.order_items
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND public.has_role(auth.uid(), 'livreur')
      AND (
        o.courier_id = auth.uid()
        OR (o.courier_id IS NULL AND o.status = 'preparee'::order_status)
      )
  )
);