import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { STATUS_LABEL, STATUS_COLOR, formatBRL, formatOSNumber, type OrderStatus } from "@/lib/orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UnifyMascot } from "@/components/UnifyMascot";
import { usePlan } from "@/context/PlanContext";
import { EliteDashboard } from "@/components/dashboards/EliteDashboard";
import { ProDashboard } from "@/components/dashboards/ProDashboard";
import { StartDashboard } from "@/components/dashboards/StartDashboard";
import { cn } from "@/lib/utils";
import {
  ClipboardList,
  Clock,
  Package,
  CheckCircle2,
  TrendingUp,
  Timer,
  Plus,
  AlertCircle,
  ArrowUpRight,
  Sparkles,
  MessageSquare,
  BookOpen,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel — Unify RepairAI" },
      { name: "description", content: "Painel de inteligência artificial e gestão da sua assistência técnica." },
    ],
  }),
  component: DashboardPage,
});

interface Metrics {
  open: number;
  in_repair: number;
  awaiting_part: number;
  awaiting_approval: number;
  ready: number;
  delivered_month: number;
  revenue_month_cents: number;
  avg_repair_days: number;
}

interface RecentOrder {
  id: string;
  number: number;
  status: OrderStatus;
  created_at: string;
  customers?: { name: string } | null;
  devices?: { brand: string; model: string } | null;
}

const PLAN_LABEL: Record<string, string> = { start: "START", pro: "PRO", elite: "ELITE" };

function DashboardPage() {
  const { plan } = usePlan();
  const planName: string = plan;
  const label = PLAN_LABEL[planName] ?? "START";
  if (planName === "elite") return <EliteDashboard />;
  if (planName === "pro") return <ProDashboard />;
  if (planName === "start") return <StartDashboard />;

  const [m, setM] = useState<Metrics | null>(null);
  const [recent, setRecent] = useState<RecentOrder[]>([]);
  const [displayName, setDisplayName] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (u.user) {
        const { data: p } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", u.user.id)
          .maybeSingle();
        setDisplayName(p?.display_name ?? u.user.email?.split("@")[0] ?? "");
      }

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { data: orders } = await supabase
        .from("service_orders")
        .select("id, number, status, created_at, customers(name), devices(brand, model)")
        .gte("created_at", monthStart)
        .order("created_at", { ascending: false });

      const list = (orders ?? []) as Array<{ status: string }>;
      const openStatuses: OrderStatus[] = ["awaiting_diagnosis", "awaiting_approval", "in_repair", "awaiting_part"];
      const deliveredThisMonth = list.filter((o) => o.status === "delivered");
      const revenueMonth = 0;
      const avg = 0;

      setM({
        open: list.filter((o) => openStatuses.includes(o.status as OrderStatus)).length,
        in_repair: list.filter((o) => o.status === "in_repair").length,
        awaiting_part: list.filter((o) => o.status === "awaiting_part").length,
        awaiting_approval: list.filter((o) => o.status === "awaiting_approval").length,
        ready: list.filter((o) => o.status === "ready").length,
        delivered_month: deliveredThisMonth.length,
        revenue_month_cents: revenueMonth,
        avg_repair_days: avg,
      });

      const { data: r } = await supabase
        .from("service_orders")
        .select("id, number, status, created_at, customers(name), devices(brand, model)")
        .order("created_at", { ascending: false })
        .limit(5);
      setRecent((r as unknown as RecentOrder[]) ?? []);
    })();
  }, []);

  const kpis = [
    { label: "OS abertas", value: m?.open ?? "—", icon: ClipboardList, accent: "primary" as const },
    { label: "Em reparo", value: m?.in_repair ?? "—", icon: Clock, accent: "info" as const },
    { label: "Aguard. peça", value: m?.awaiting_part ?? "—", icon: Package, accent: "warn" as const },
    { label: "Aguard. aprov.", value: m?.awaiting_approval ?? "—", icon: AlertCircle, accent: "warn" as const },
    { label: "Prontos", value: m?.ready ?? "—", icon: CheckCircle2, accent: "success" as const },
    { label: "Entregues (mês)", value: m?.delivered_month ?? "—", icon: CheckCircle2, accent: "primary" as const },
    { label: "Receita (mês)", value: m ? formatBRL(m.revenue_month_cents) : "—", icon: TrendingUp, accent: "primary" as const },
    { label: "Tempo médio", value: m?.avg_repair_days ? `${m.avg_repair_days.toFixed(1)} d` : "—", icon: Timer, accent: "muted" as const },
  ];

  const shortcuts = [
    { to: "/chat" as const, label: "Diagnóstico IA", icon: MessageSquare },
    { to: "/orders/new" as const, label: "Nova OS", icon: Plus },
    { to: "/customers" as const, label: "Clientes", icon: Users },
    { to: "/knowledge" as const, label: "Conhecimento", icon: BookOpen },
  ];

  const greeting = greetingFor(new Date());

  return (
    <div className="relative min-h-[calc(100dvh-5rem)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 hero-aura" aria-hidden />

      <div className="relative px-4 pt-5 pb-6">
        <header className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider",
                planName === "elite" && "bg-primary/15 text-primary elite-glow",
                planName === "pro" && "gradient-primary text-primary-foreground",
                planName === "start" && "bg-muted text-muted-foreground",
              )}>
                {planName === "elite" && <Sparkles className="h-2.5 w-2.5" />}
                {label}
              </span>
              <span className="text-[11px] text-muted-foreground">{formatDate(new Date())}</span>
            </div>
            <h1 className="text-2xl font-bold leading-tight tracking-tight">
              {greeting}
              {displayName && <span className="text-muted-foreground font-normal">, {firstName(displayName)}</span>}
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">Aqui está sua bancada hoje.</p>
          </div>
          <div className="shrink-0">
            <UnifyMascot size={72} state="idle" aura={planName !== "start"} elite={planName === "elite"} />
          </div>
        </header>

        <div className="mb-5 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {shortcuts.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="group flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-medium transition hover:border-primary/50 hover:text-primary"
            >
              <s.icon className="h-3.5 w-3.5" />
              {s.label}
            </Link>
          ))}
        </div>

        <div className={cn(
          "relative mb-4 overflow-hidden rounded-2xl p-5 text-primary-foreground",
          "gradient-primary shadow-[0_20px_50px_-20px_oklch(0.505_0.235_27.5/0.55)]",
        )}>
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" aria-hidden />
          <div className="relative flex items-end justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest opacity-80">Receita do mês</p>
              <p className="mt-1 text-3xl font-bold tracking-tight">
                {m ? formatBRL(m.revenue_month_cents) : "—"}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs opacity-90">
                <ArrowUpRight className="h-3 w-3" />
                {m?.delivered_month ?? 0} OS entregues
              </p>
            </div>
            <Button asChild variant="secondary" size="sm" className="rounded-full bg-white/15 text-white hover:bg-white/25 border-0 backdrop-blur">
              <Link to="/finance">Financeiro</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {kpis.slice(0, 6).map((k) => (
            <div
              key={k.label}
              className={cn(
                "relative overflow-hidden rounded-2xl border border-border bg-card p-3.5 transition",
                "hover:border-primary/40",
                planName === "elite" && "hover:shadow-[0_0_24px_oklch(0.62_0.26_27.5/0.25)]",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground">{k.label}</span>
                <span className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full",
                  k.accent === "primary" && "bg-primary/10 text-primary",
                  k.accent === "info" && "bg-blue-500/10 text-blue-500",
                  k.accent === "warn" && "bg-amber-500/10 text-amber-500",
                  k.accent === "success" && "bg-emerald-500/10 text-emerald-500",
                  k.accent === "muted" && "bg-muted text-muted-foreground",
                )}>
                  <k.icon className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight">{k.value}</div>
            </div>
          ))}
        </div>

        <section className="mt-6">
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-sm font-bold">Atividade recente</h2>
            <Link to="/orders" className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline">
              Ver todas <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <UnifyMascot size={56} state="idle" className="mx-auto opacity-70" />
              <p className="mt-3 text-sm text-muted-foreground">Nenhuma OS ainda.</p>
              <Button asChild size="sm" className="mt-3 rounded-full">
                <Link to="/orders/new"><Plus className="h-3.5 w-3.5" /> Criar primeira OS</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link
                    to="/orders/$id"
                    params={{ id: o.id }}
                    className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5 transition hover:border-primary/40"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs">
                        #{o.number}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{o.customers?.name ?? "—"}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {o.devices ? `${o.devices.brand} ${o.devices.model}` : "Sem aparelho"}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn(STATUS_COLOR[o.status as OrderStatus], "shrink-0 text-[10px]")}>
                      {STATUS_LABEL[o.status as OrderStatus]}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function greetingFor(d: Date) {
  const h = d.getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0];
}

function formatDate(d: Date) {
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
}
