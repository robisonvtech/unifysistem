import { createFileRoute } from "@tanstack/react-router";
import { usePlan } from "@/context/PlanContext";
import { StartDashboard } from "@/components/dashboards/StartDashboard";
import { ProDashboard } from "@/components/dashboards/ProDashboard";
import { EliteDashboard } from "@/components/dashboards/EliteDashboard";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel — Unify RepairAI" },
      { name: "description", content: "Painel de inteligência artificial e gestão da sua assistência técnica." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { plan } = usePlan();

  if (plan === "start") {
    return <StartDashboard />;
  }

  if (plan === "elite") {
    return <EliteDashboard />;
  }

  return <ProDashboard />;
}
