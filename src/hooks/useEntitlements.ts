import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { hasAccessToApp, normalizeSubscriptionStatus } from "@/lib/subscription";

export interface Entitlements {
  loading: boolean;
  userId: string | null;
  isAdmin: boolean;
  isPro: boolean;
  plan: "free" | "start" | "pro" | "elite" | "inactive";
  /** Admin or any paid plan subscriber — unlocks Advanced mode + Courses. */
  canPremium: boolean;
}

export function useEntitlements(): Entitlements {
  const [state, setState] = useState<Entitlements>({
    loading: true,
    userId: null,
    isAdmin: false,
    isPro: false,
    plan: "free",
    canPremium: false,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id ?? null;
      if (!uid) {
        if (active) setState({ loading: false, userId: null, isAdmin: false, isPro: false, plan: "free", canPremium: false });
        return;
      }
      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", uid),
        supabase.from("profiles").select("subscription_status").eq("id", uid).maybeSingle(),
      ]);
      const isAdmin = (roles ?? []).some((r) => r.role === "admin");
      const plan = normalizeSubscriptionStatus(profile?.subscription_status);
      const isPro = plan === "pro" || plan === "elite";
      if (active) {
        setState({
          loading: false,
          userId: uid,
          isAdmin,
          isPro,
          plan,
          canPremium: isAdmin || hasAccessToApp(plan),
        });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return state;
}
