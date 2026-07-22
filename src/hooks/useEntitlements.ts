import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Entitlements {
  loading: boolean;
  userId: string | null;
  isAdmin: boolean;
  isPro: boolean;
  /** Admin or Pro subscriber — unlocks Advanced mode + Courses. */
  canPremium: boolean;
}

export function useEntitlements(): Entitlements {
  const [state, setState] = useState<Entitlements>({
    loading: true,
    userId: null,
    isAdmin: false,
    isPro: false,
    canPremium: false,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id ?? null;
      if (!uid) {
        if (active) setState({ loading: false, userId: null, isAdmin: false, isPro: false, canPremium: false });
        return;
      }
      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", uid),
        supabase.from("profiles").select("subscription_status").eq("id", uid).maybeSingle(),
      ]);
      const isAdmin = (roles ?? []).some((r) => r.role === "admin");
      const isPro = profile?.subscription_status === "pro";
      if (active) {
        setState({
          loading: false,
          userId: uid,
          isAdmin,
          isPro,
          canPremium: isAdmin || isPro,
        });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return state;
}
