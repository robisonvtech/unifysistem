
-- ============ ESTOQUE ============
CREATE TABLE public.parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sku TEXT,
  name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  category TEXT,
  cost_cents INTEGER NOT NULL DEFAULT 0,
  price_cents INTEGER NOT NULL DEFAULT 0,
  stock_qty INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parts TO authenticated;
GRANT ALL ON public.parts TO service_role;
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parts_owner_all" ON public.parts FOR ALL
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER parts_touch BEFORE UPDATE ON public.parts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX parts_owner_idx ON public.parts(owner_id);

CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES public.parts(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.service_orders(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('in','out','adjust')),
  qty INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sm_owner_all" ON public.stock_movements FOR ALL
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE INDEX sm_part_idx ON public.stock_movements(part_id);
CREATE INDEX sm_order_idx ON public.stock_movements(order_id);

-- Peças usadas em cada OS
CREATE TABLE public.order_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  part_id UUID REFERENCES public.parts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  unit_price_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_parts TO authenticated;
GRANT ALL ON public.order_parts TO service_role;
ALTER TABLE public.order_parts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "op_owner_all" ON public.order_parts FOR ALL
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE INDEX op_order_idx ON public.order_parts(order_id);

-- Trigger: quando adiciona peça na OS, dá baixa no estoque
CREATE OR REPLACE FUNCTION public.consume_stock_on_order_part()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.part_id IS NOT NULL AND NEW.qty > 0 THEN
    UPDATE public.parts SET stock_qty = stock_qty - NEW.qty WHERE id = NEW.part_id;
    INSERT INTO public.stock_movements (owner_id, part_id, order_id, type, qty, reason)
    VALUES (NEW.owner_id, NEW.part_id, NEW.order_id, 'out', NEW.qty, 'Uso na OS');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER order_parts_consume AFTER INSERT ON public.order_parts
  FOR EACH ROW EXECUTE FUNCTION public.consume_stock_on_order_part();

CREATE OR REPLACE FUNCTION public.restore_stock_on_order_part_delete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.part_id IS NOT NULL AND OLD.qty > 0 THEN
    UPDATE public.parts SET stock_qty = stock_qty + OLD.qty WHERE id = OLD.part_id;
    INSERT INTO public.stock_movements (owner_id, part_id, order_id, type, qty, reason)
    VALUES (OLD.owner_id, OLD.part_id, OLD.order_id, 'in', OLD.qty, 'Estorno OS');
  END IF;
  RETURN OLD;
END $$;
CREATE TRIGGER order_parts_restore AFTER DELETE ON public.order_parts
  FOR EACH ROW EXECUTE FUNCTION public.restore_stock_on_order_part_delete();

-- ============ FINANCEIRO ============
CREATE TABLE public.finance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.service_orders(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income','expense')),
  category TEXT,
  description TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','cancelled')),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_transactions TO authenticated;
GRANT ALL ON public.finance_transactions TO service_role;
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ft_owner_all" ON public.finance_transactions FOR ALL
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER ft_touch BEFORE UPDATE ON public.finance_transactions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX ft_owner_idx ON public.finance_transactions(owner_id);
CREATE INDEX ft_order_idx ON public.finance_transactions(order_id);
CREATE INDEX ft_status_idx ON public.finance_transactions(status);

-- Cria automaticamente conta a receber quando OS ganha preço/entrega, e marca paga na entrega
CREATE OR REPLACE FUNCTION public.sync_order_receivable()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  existing_id UUID;
BEGIN
  IF NEW.price_cents IS NULL OR NEW.price_cents <= 0 THEN
    RETURN NEW;
  END IF;

  SELECT id INTO existing_id FROM public.finance_transactions
    WHERE order_id = NEW.id AND type = 'income' LIMIT 1;

  IF existing_id IS NULL THEN
    INSERT INTO public.finance_transactions
      (owner_id, order_id, type, category, description, amount_cents, status, due_date, paid_at)
    VALUES (
      NEW.owner_id, NEW.id, 'income', 'Serviço',
      'OS #' || lpad(NEW.number::text, 5, '0'),
      NEW.price_cents,
      CASE WHEN NEW.status = 'delivered' THEN 'paid' ELSE 'pending' END,
      COALESCE(NEW.estimated_delivery, (now()::date + 7)),
      CASE WHEN NEW.status = 'delivered' THEN now() ELSE NULL END
    );
  ELSE
    UPDATE public.finance_transactions
      SET amount_cents = NEW.price_cents,
          description = 'OS #' || lpad(NEW.number::text, 5, '0'),
          status = CASE WHEN NEW.status = 'delivered' AND status <> 'paid' THEN 'paid' ELSE status END,
          paid_at = CASE WHEN NEW.status = 'delivered' AND paid_at IS NULL THEN now() ELSE paid_at END
      WHERE id = existing_id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER service_orders_receivable AFTER INSERT OR UPDATE OF price_cents, status, estimated_delivery
  ON public.service_orders FOR EACH ROW EXECUTE FUNCTION public.sync_order_receivable();
