
-- ============ ENUM STATUS ============
DO $$ BEGIN
  CREATE TYPE public.order_status AS ENUM (
    'awaiting_diagnosis',
    'awaiting_approval',
    'awaiting_part',
    'in_repair',
    'ready',
    'delivered',
    'warranty',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ CUSTOMERS ============
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  doc text,
  address text,
  photo_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX customers_owner_idx ON public.customers(owner_id);
CREATE INDEX customers_phone_idx ON public.customers(owner_id, phone);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers owner or admin read" ON public.customers
  FOR SELECT TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "customers owner insert" ON public.customers
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "customers owner or admin update" ON public.customers
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "customers owner or admin delete" ON public.customers
  FOR DELETE TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER customers_touch BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ DEVICES ============
CREATE TABLE public.devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand text NOT NULL,
  model text NOT NULL,
  imei text,
  serial text,
  color text,
  device_password text,
  accessories jsonb NOT NULL DEFAULT '[]'::jsonb,
  condition text,
  battery_pct int,
  photos jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX devices_customer_idx ON public.devices(customer_id);
CREATE INDEX devices_owner_idx ON public.devices(owner_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.devices TO authenticated;
GRANT ALL ON public.devices TO service_role;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "devices owner or admin read" ON public.devices
  FOR SELECT TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "devices owner insert" ON public.devices
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "devices owner or admin update" ON public.devices
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "devices owner or admin delete" ON public.devices
  FOR DELETE TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER devices_touch BEFORE UPDATE ON public.devices
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ SERVICE ORDERS ============
CREATE SEQUENCE public.service_orders_number_seq START 1001;

CREATE TABLE public.service_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number bigint NOT NULL DEFAULT nextval('public.service_orders_number_seq') UNIQUE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  device_id uuid NOT NULL REFERENCES public.devices(id) ON DELETE RESTRICT,
  status public.order_status NOT NULL DEFAULT 'awaiting_diagnosis',
  reported_issue text NOT NULL,
  diagnosis text,
  services jsonb NOT NULL DEFAULT '[]'::jsonb,
  parts jsonb NOT NULL DEFAULT '[]'::jsonb,
  price_cents int NOT NULL DEFAULT 0,
  warranty_days int NOT NULL DEFAULT 90,
  estimated_delivery date,
  intake_checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
  delivery_checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
  internal_notes text,
  customer_notes text,
  public_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(18), 'hex'),
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX so_owner_idx ON public.service_orders(owner_id);
CREATE INDEX so_customer_idx ON public.service_orders(customer_id);
CREATE INDEX so_status_idx ON public.service_orders(owner_id, status);

ALTER SEQUENCE public.service_orders_number_seq OWNED BY public.service_orders.number;
GRANT USAGE ON SEQUENCE public.service_orders_number_seq TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_orders TO authenticated;
GRANT ALL ON public.service_orders TO service_role;
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "so owner or admin read" ON public.service_orders
  FOR SELECT TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "so owner insert" ON public.service_orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "so owner or admin update" ON public.service_orders
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "so owner or admin delete" ON public.service_orders
  FOR DELETE TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER service_orders_touch BEFORE UPDATE ON public.service_orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ ORDER EVENTS (timeline) ============
CREATE TABLE public.service_order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX soe_order_idx ON public.service_order_events(order_id, created_at DESC);

GRANT SELECT, INSERT ON public.service_order_events TO authenticated;
GRANT ALL ON public.service_order_events TO service_role;
ALTER TABLE public.service_order_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "soe owner or admin read" ON public.service_order_events
  FOR SELECT TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "soe owner insert" ON public.service_order_events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Auto-log status changes and creation into timeline
CREATE OR REPLACE FUNCTION public.log_service_order_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.service_order_events (order_id, owner_id, actor_id, type, payload)
    VALUES (NEW.id, NEW.owner_id, auth.uid(), 'created',
            jsonb_build_object('status', NEW.status, 'number', NEW.number));
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.service_order_events (order_id, owner_id, actor_id, type, payload)
    VALUES (NEW.id, NEW.owner_id, auth.uid(), 'status_change',
            jsonb_build_object('from', OLD.status, 'to', NEW.status));
    IF NEW.status = 'delivered' AND NEW.delivered_at IS NULL THEN
      NEW.delivered_at = now();
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.log_service_order_event() FROM PUBLIC;

CREATE TRIGGER so_log_insert AFTER INSERT ON public.service_orders
  FOR EACH ROW EXECUTE FUNCTION public.log_service_order_event();
CREATE TRIGGER so_log_status BEFORE UPDATE ON public.service_orders
  FOR EACH ROW EXECUTE FUNCTION public.log_service_order_event();

-- ============ PUBLIC TRACKING RPC ============
-- Returns safe columns for a service order by public token, without exposing internal notes.
CREATE OR REPLACE FUNCTION public.get_tracking(_token text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'number', so.number,
    'status', so.status,
    'reported_issue', so.reported_issue,
    'diagnosis', so.diagnosis,
    'estimated_delivery', so.estimated_delivery,
    'price_cents', so.price_cents,
    'warranty_days', so.warranty_days,
    'customer_notes', so.customer_notes,
    'created_at', so.created_at,
    'updated_at', so.updated_at,
    'delivered_at', so.delivered_at,
    'customer', jsonb_build_object('name', c.name),
    'device', jsonb_build_object(
      'brand', d.brand, 'model', d.model, 'color', d.color,
      'photos', d.photos
    ),
    'events', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'type', e.type, 'payload', e.payload, 'created_at', e.created_at
      ) ORDER BY e.created_at)
      FROM public.service_order_events e WHERE e.order_id = so.id
    ), '[]'::jsonb)
  )
  FROM public.service_orders so
  JOIN public.customers c ON c.id = so.customer_id
  JOIN public.devices d ON d.id = so.device_id
  WHERE so.public_token = _token;
$$;
REVOKE ALL ON FUNCTION public.get_tracking(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_tracking(text) TO anon, authenticated;
