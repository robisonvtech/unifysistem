import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { usePlan } from "@/hooks/usePlan";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
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
