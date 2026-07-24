
REVOKE EXECUTE ON FUNCTION public.consume_stock_on_order_part() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.restore_stock_on_order_part_delete() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_order_receivable() FROM PUBLIC, anon, authenticated;
