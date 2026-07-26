ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cakto_product_id text,
  ADD COLUMN IF NOT EXISTS cakto_subscription_id text,
  ADD COLUMN IF NOT EXISTS subscription_updated_at timestamptz;

CREATE OR REPLACE FUNCTION public.set_cakto_subscription_status(
  _email text,
  _status text,
  _product_id text,
  _subscription_id text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  _user_id uuid;
BEGIN
  IF _status NOT IN ('pro', 'inactive') THEN
    RAISE EXCEPTION 'Invalid subscription status';
  END IF;

  SELECT id INTO _user_id
  FROM auth.users
  WHERE lower(email) = lower(_email)
  LIMIT 1;

  IF _user_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.profiles
  SET subscription_status = _status,
      cakto_product_id = _product_id,
      cakto_subscription_id = COALESCE(_subscription_id, cakto_subscription_id),
      subscription_updated_at = now()
  WHERE id = _user_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.set_cakto_subscription_status(text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_cakto_subscription_status(text, text, text, text) TO service_role;
