DO $$ BEGIN CREATE TYPE public.payment_status AS ENUM ('en_attente','confirme','echoue','annule'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_status public.payment_status NOT NULL DEFAULT 'en_attente',
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS received_at timestamptz;

CREATE INDEX IF NOT EXISTS orders_available_idx ON public.orders (status, courier_id) WHERE courier_id IS NULL;

-- Guard: buyers cannot forge payment fields on insert
CREATE OR REPLACE FUNCTION public.orders_guard()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.payment_status := 'en_attente'; NEW.paid_at := NULL; NEW.courier_id := NULL;
    NEW.status := 'en_attente'; NEW.accepted_at := NULL; NEW.delivered_at := NULL; NEW.received_at := NULL;
    RETURN NEW;
  END IF;
  IF NEW.status = 'preparee' AND OLD.status <> 'preparee'
     AND NEW.payment_method <> 'cash' AND NEW.payment_status <> 'confirme' THEN
    RAISE EXCEPTION 'Paiement non confirmé : la commande ne peut pas être préparée';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS orders_guard_trg ON public.orders;
CREATE TRIGGER orders_guard_trg BEFORE INSERT OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.orders_guard();

-- Courier visibility: only paid (or cash) ready orders, unassigned, or own
DROP POLICY IF EXISTS orders_select_courier ON public.orders;
CREATE POLICY orders_select_courier ON public.orders FOR SELECT TO authenticated
USING (has_role(auth.uid(),'livreur') AND (courier_id = auth.uid() OR (courier_id IS NULL AND status = 'preparee' AND (payment_status = 'confirme' OR payment_method = 'cash'))));
DROP POLICY IF EXISTS orders_update_courier ON public.orders;

DROP POLICY IF EXISTS order_items_select_courier ON public.order_items;
CREATE POLICY order_items_select_courier ON public.order_items FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND has_role(auth.uid(),'livreur')
  AND (o.courier_id = auth.uid() OR (o.courier_id IS NULL AND o.status='preparee' AND (o.payment_status='confirme' OR o.payment_method='cash')))));

-- Admin: confirm payment (idempotent) -> order becomes available for delivery
CREATE OR REPLACE FUNCTION public.confirm_order_payment(_order_id uuid, _reference text)
RETURNS public.orders LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o public.orders;
BEGIN
  IF NOT has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  SELECT * INTO o FROM orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Commande introuvable'; END IF;
  IF o.payment_status = 'confirme' THEN RETURN o; END IF;
  IF o.status = 'annulee' THEN RAISE EXCEPTION 'Commande annulée'; END IF;
  UPDATE orders SET payment_status='confirme', paid_at=now(),
    payment_reference = COALESCE(NULLIF(trim(_reference),''), payment_reference),
    status = CASE WHEN status='en_attente' THEN 'preparee'::order_status ELSE status END
  WHERE id=_order_id RETURNING * INTO o;
  RETURN o;
END $$;

CREATE OR REPLACE FUNCTION public.reject_order_payment(_order_id uuid, _cancel boolean)
RETURNS public.orders LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o public.orders;
BEGIN
  IF NOT has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  SELECT * INTO o FROM orders WHERE id=_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Commande introuvable'; END IF;
  IF o.payment_status = 'confirme' THEN RAISE EXCEPTION 'Paiement déjà confirmé'; END IF;
  UPDATE orders SET payment_status = CASE WHEN _cancel THEN 'annule'::payment_status ELSE 'echoue'::payment_status END,
    status = 'annulee' WHERE id=_order_id RETURNING * INTO o;
  RETURN o;
END $$;

-- Buyer: submit transaction reference (does NOT mark paid)
CREATE OR REPLACE FUNCTION public.submit_payment_reference(_order_id uuid, _reference text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF length(trim(coalesce(_reference,''))) < 4 THEN RAISE EXCEPTION 'Référence invalide'; END IF;
  UPDATE orders SET payment_reference = left(trim(_reference),80)
  WHERE id=_order_id AND buyer_id=auth.uid() AND payment_status='en_attente' AND status='en_attente';
  IF NOT FOUND THEN RAISE EXCEPTION 'Commande non modifiable'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.buyer_cancel_order(_order_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE orders SET status='annulee', payment_status='annule'
  WHERE id=_order_id AND buyer_id=auth.uid() AND status='en_attente' AND payment_status<>'confirme';
  IF NOT FOUND THEN RAISE EXCEPTION 'Cette commande ne peut plus être annulée'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.buyer_confirm_receipt(_order_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE orders SET received_at = COALESCE(received_at, now()),
    payment_status = CASE WHEN payment_method='cash' THEN 'confirme'::payment_status ELSE payment_status END,
    paid_at = CASE WHEN payment_method='cash' THEN COALESCE(paid_at, now()) ELSE paid_at END
  WHERE id=_order_id AND buyer_id=auth.uid() AND status='livree';
  IF NOT FOUND THEN RAISE EXCEPTION 'La commande n''est pas encore livrée'; END IF;
END $$;

-- Courier actions (atomic, no double assignment)
CREATE OR REPLACE FUNCTION public.courier_accept_order(_order_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT has_role(auth.uid(),'livreur') THEN RAISE EXCEPTION 'Réservé aux livreurs certifiés'; END IF;
  UPDATE orders SET courier_id=auth.uid(), accepted_at=now()
  WHERE id=_order_id AND courier_id IS NULL AND status='preparee'
    AND (payment_status='confirme' OR payment_method='cash');
  IF NOT FOUND THEN
    IF EXISTS (SELECT 1 FROM orders WHERE id=_order_id AND courier_id=auth.uid()) THEN RETURN; END IF;
    RAISE EXCEPTION 'Course indisponible (déjà prise ou non payée)';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.courier_start_delivery(_order_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT has_role(auth.uid(),'livreur') THEN RAISE EXCEPTION 'Réservé aux livreurs certifiés'; END IF;
  UPDATE orders SET status='en_route' WHERE id=_order_id AND courier_id=auth.uid() AND status IN ('preparee','en_route');
  IF NOT FOUND THEN RAISE EXCEPTION 'Course non modifiable'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.courier_complete_delivery(_order_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT has_role(auth.uid(),'livreur') THEN RAISE EXCEPTION 'Réservé aux livreurs certifiés'; END IF;
  UPDATE orders SET status='livree', delivered_at=COALESCE(delivered_at, now())
  WHERE id=_order_id AND courier_id=auth.uid() AND status IN ('en_route','livree');
  IF NOT FOUND THEN RAISE EXCEPTION 'La course doit être en route'; END IF;
END $$;

DO $$ DECLARE f text; BEGIN
  FOREACH f IN ARRAY ARRAY['confirm_order_payment(uuid,text)','reject_order_payment(uuid,boolean)','submit_payment_reference(uuid,text)','buyer_cancel_order(uuid)','buyer_confirm_receipt(uuid)','courier_accept_order(uuid)','courier_start_delivery(uuid)','courier_complete_delivery(uuid)'] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated', f);
  END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.orders_guard() FROM PUBLIC, anon, authenticated;