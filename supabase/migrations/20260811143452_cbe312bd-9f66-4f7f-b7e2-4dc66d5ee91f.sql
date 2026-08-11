ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS access_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS device_id text,
  ADD COLUMN IF NOT EXISTS blocked boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "own profile update" ON public.profiles;
CREATE POLICY "own profile update" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR (
      subscription_status = (SELECT p.subscription_status FROM public.profiles p WHERE p.id = auth.uid())
      AND blocked = (SELECT p.blocked FROM public.profiles p WHERE p.id = auth.uid())
      AND access_expires_at IS NOT DISTINCT FROM (SELECT p.access_expires_at FROM public.profiles p WHERE p.id = auth.uid())
    )
  )
);