
-- 1. Revoke execute on SECURITY DEFINER functions from anon/authenticated/public
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

REVOKE ALL ON FUNCTION public.get_tracking(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_tracking(text) TO service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.grant_admin_for_owner_email() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_service_order_event() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.consume_stock_on_order_part() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.restore_stock_on_order_part_delete() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_order_receivable() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

-- 2. user_roles: add admin-only write policies to prevent privilege escalation
CREATE POLICY "Only admins can insert roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. service_orders: revoke any anon access; public tracking goes through server role only
REVOKE ALL ON TABLE public.service_orders FROM anon;
