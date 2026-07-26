import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { usePlan } from "@/hooks/usePlan";
import { hasAccessToApp } from "@/lib/subscription";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    const [{ data: profile }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("subscription_status").eq("id", data.user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", data.user.id),
    ]);
    const isAdmin = (roles ?? []).some((role) => role.role === "admin");
    if (!isAdmin && !hasAccessToApp(profile?.subscription_status)) {
      await supabase.auth.signOut();
      throw redirect({ to: "/auth" });
    }
    return { user: data.user };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const { plan } = usePlan();
  return (
    <div
      className="min-h-screen bg-background pb-[calc(5.5rem+env(safe-area-inset-bottom))] transition-colors"
      data-plan={plan}
    >
      <div className="mx-auto max-w-2xl px-4 pt-6">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
