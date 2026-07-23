import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { STATUS_LABEL, STATUS_COLOR, formatBRL, formatOSNumber, type OrderStatus } from "@/lib/orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, Clock, Package, CheckCircle2, TrendingUp, Timer, Plus, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel — RepairAI" },
      { name: "description", content: "Painel de gestão da sua assistência técnica." },
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
  avg_repair_days: number | null;
}

interface RecentOrder {
  id: string;
  number: number;
  status: OrderStatus;
  created_at: string;
  customers: { name: string } | null;
  devices: { brand: string; model: string } | null;
}

function DashboardPage() {
  const [m, setM] = useState<Metrics | null>(null);
  const [recent, setRecent] = useState<RecentOrder[]>([]);

  useEffect(() => {
    (async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { data: orders } = await supabase
        .from("service_orders")
        .select("status, price_cents, delivered_at, created_at");
      const list = orders ?? [];
      const openStatuses: OrderStatus[] = ["awaiting_diagnosis", "awaiting_approval", "awaiting_part", "in_repair", "ready"];
      const deliveredThisMonth = list.filter(
        (o) => o.status === "delivered" && o.delivered_at && o.delivered_at >= monthStart,
      );
      const revenueMonth = deliveredThisMonth.reduce((s, o) => s + (o.price_cents ?? 0), 0);
      const durations = deliveredThisMonth
        .map((o) => (o.delivered_at ? (new Date(o.delivered_at).getTime() - new Date(o.created_at).getTime()) / 86400000 : null))
        .filter((n): n is number => n !== null);
      const avg = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : null;

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

  const cards = [
    { label: "OS abertas", value: m?.open ?? "—", icon: ClipboardList, color: "text-primary" },
    { label: "Em reparo", value: m?.in_repair ?? "—", icon: Clock, color: "text-blue-600" },
    { label: "Aguardando peça", value: m?.awaiting_part ?? "—", icon: Package, color: "text-orange-600" },
    { label: "Aguard. aprovação", value: m?.awaiting_approval ?? "—", icon: AlertCircle, color: "text-amber-600" },
    { label: "Prontos", value: m?.ready ?? "—", icon: CheckCircle2, color: "text-emerald-600" },
    { label: "Entregues no mês", value: m?.delivered_month ?? "—", icon: CheckCircle2, color: "text-primary" },
    { label: "Receita do mês", value: m ? formatBRL(m.revenue_month_cents) : "—", icon: TrendingUp, color: "text-primary" },
    { label: "Tempo médio", value: m?.avg_repair_days ? `${m.avg_repair_days.toFixed(1)} d` : "—", icon: Timer, color: "text-slate-600" },
  ];

  return (
    <div className="px-4 py-4">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Painel</h1>
          <p className="text-xs text-muted-foreground">Visão geral da assistência técnica.</p>
        </div>
        <Button asChild size="sm">
          <Link to="/orders/new"><Plus className="h-4 w-4" /> Nova OS</Link>
        </Button>
      </header>

      <div className="grid grid-cols-2 gap-2">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{c.label}</span>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </div>
            <div className="mt-1 text-xl font-bold">{c.value}</div>
          </div>
        ))}
      </div>

      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">OS recentes</h2>
          <Link to="/orders" className="text-xs text-primary">Ver todas</Link>
        </div>
        {recent.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhuma OS ainda. <Link to="/orders/new" className="text-primary underline">Criar a primeira</Link>.
          </div>
        ) : (
          <ul className="space-y-2">
            {recent.map((o) => (
              <li key={o.id}>
                <Link
                  to="/orders/$id"
                  params={{ id: o.id }}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-3 transition hover:border-primary/40"
                >
                  <div>
                    <div className="text-sm font-semibold">{formatOSNumber(o.number)} — {o.customers?.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {o.devices ? `${o.devices.brand} ${o.devices.model}` : "—"}
                    </div>
                  </div>
                  <Badge variant="outline" className={STATUS_COLOR[o.status]}>{STATUS_LABEL[o.status]}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
