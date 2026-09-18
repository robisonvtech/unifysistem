import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { STATUS_LABEL, STATUS_COLOR, formatBRL, type OrderStatus } from "@/lib/orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UnifyMascot } from "@/components/UnifyMascot";
import { usePlan } from "@/context/PlanContext";
import { cn } from "@/lib/utils";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  Plus,
  ArrowUpRight,
  Sparkles,
  MessageSquare,
  Wallet,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel — Unify RepairAI" },
      { name: "description", content: "Acompanhe ordens de serviço, receita e desempenho da sua assistência técnica." },
      { property: "og:title", content: "Painel — Unify RepairAI" },
      { property: "og:description", content: "Ordens, receita e reparos da sua assistência em um só painel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});

interface Metrics {
  revenue_cents: number;
  expenses_cents: number;
  profit_cents: number;
  receivable_cents: number;
  pending: number;
  done: number;
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

      const [{ data: allOrders }, { data: tx }] = await Promise.all([
        supabase.from("service_orders").select("id, status"),
        supabase
          .from("finance_transactions")
          .select("amount_cents, type, status, created_at")
          .gte("created_at", monthStart),
      ]);

      const list = (allOrders ?? []) as Array<{ status: string }>;
      const openStatuses: OrderStatus[] = ["awaiting_diagnosis", "awaiting_approval", "in_repair", "awaiting_part", "ready"];
      const rows = tx ?? [];
      const sum = (t: typeof rows) => t.reduce((s, r) => s + (r.amount_cents ?? 0), 0);

      const revenue = sum(rows.filter((t) => t.type === "income" && t.status === "paid"));
      const expenses = sum(rows.filter((t) => t.type === "expense" && t.status === "paid"));

      setM({
        revenue_cents: revenue,
        expenses_cents: expenses,
        profit_cents: revenue - expenses,
        receivable_cents: sum(rows.filter((t) => t.type === "income" && t.status !== "paid")),
        pending: list.filter((o) => openStatuses.includes(o.status as OrderStatus)).length,
        done: list.filter((o) => o.status === "delivered").length,
      });

      const { data: r } = await supabase
        .from("service_orders")
        .select("id, number, status, created_at, customers(name), devices(brand, model)")
        .order("created_at", { ascending: false })
        .limit(5);
      setRecent((r as unknown as RecentOrder[]) ?? []);
    })();
  }, []);

  const shortcuts = [
    { to: "/chat" as const, label: "Diagnóstico IA", icon: MessageSquare },
    { to: "/orders/new" as const, label: "Nova OS", icon: Plus },
    { to: "/customers" as const, label: "Clientes", icon: Users },
    { to: "/business" as const, label: "Negócios", icon: Wallet },
  ];

  return (
    <div className="relative min-h-[calc(100dvh-5rem)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 hero-aura" aria-hidden />

      <div className="relative pb-6">
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-widest",
                planName === "elite" && "bg-primary/12 text-primary",
                planName === "pro" && "gradient-primary text-primary-foreground",
                planName === "start" && "bg-secondary text-muted-foreground",
              )}
            >
              {planName === "elite" && <Sparkles className="h-2.5 w-2.5" />}
              {label}
            </span>
            <h1 className="mt-1.5 font-display text-2xl font-bold leading-tight">
              {greetingFor(new Date())}
              {displayName && <span className="font-normal text-muted-foreground">, {firstName(displayName)}</span>}
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">Sua bancada em um olhar.</p>
          </div>
          <UnifyMascot size={64} state="idle" aura={planName !== "start"} elite={planName === "elite"} />
        </header>

        {/* ===== Bento grid ===== */}
        <div className="grid grid-cols-4 gap-2.5">
          {/* Lucro — tile largo */}
          <div className="col-span-4 relative overflow-hidden rounded-[var(--radius)] p-5 text-primary-foreground gradient-primary shadow-[0_18px_44px_-24px_oklch(0.505_0.235_27.5/0.6)]">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" aria-hidden />
            <div className="relative flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] opacity-80">Lucro do mês</p>
                <p className="mt-1 font-display text-4xl font-bold">{m ? formatBRL(m.profit_cents) : "—"}</p>
                <p className="mt-1.5 flex items-center gap-1 text-xs opacity-90">
                  <ArrowUpRight className="h-3 w-3" />
                  {m ? formatBRL(m.revenue_cents) : "—"} recebido
                </p>
              </div>
              <Button
                asChild
                variant="secondary"
                size="sm"
                className="shrink-0 rounded-full border-0 bg-white/15 text-white backdrop-blur hover:bg-white/25"
              >
                <Link to="/finance">Financeiro</Link>
              </Button>
            </div>
          </div>

          {/* Gastos + A receber */}
          <div className="col-span-2 bento-tile p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
              <Wallet className="h-4 w-4" />
            </span>
            <p className="mt-3 text-[11px] font-medium text-muted-foreground">Gastos do mês</p>
            <p className="mt-0.5 font-display text-xl font-bold">{m ? formatBRL(m.expenses_cents) : "—"}</p>
          </div>
          <div className="col-span-2 bento-tile p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
              <Clock className="h-4 w-4" />
            </span>
            <p className="mt-3 text-[11px] font-medium text-muted-foreground">A receber</p>
            <p className="mt-0.5 font-display text-xl font-bold">{m ? formatBRL(m.receivable_cents) : "—"}</p>
          </div>

          {/* Diagnóstico IA — tile alto */}
          <Link
            to="/chat"
            className="col-span-2 row-span-2 bento-tile flex flex-col justify-between p-4"
          >
            <div>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MessageSquare className="h-4 w-4" />
              </span>
              <p className="mt-3 font-display text-base font-bold leading-snug">Diagnóstico com IA</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Sem limite de mensagens. Envie fotos, áudios e documentos.
              </p>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
              Abrir chat <ArrowUpRight className="h-3 w-3" />
            </span>
          </Link>

          {/* Serviços pendentes / concluídos */}
          <div className="col-span-2 bento-tile p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">Pendentes</span>
              <ClipboardList className="h-3.5 w-3.5 text-primary" />
            </div>
            <p className="mt-1 font-display text-2xl font-bold">{m?.pending ?? "—"}</p>
          </div>
          <div className="col-span-2 bento-tile p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">Concluídos</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <p className="mt-1 font-display text-2xl font-bold">{m?.done ?? "—"}</p>
          </div>

          {/* Atalhos */}
          {shortcuts
            .filter((s) => s.to !== "/chat")
            .map((s) => (
              <Link
                key={s.to}
                to={s.to}
                className="col-span-2 bento-tile flex items-center gap-2.5 p-3.5 text-xs font-semibold sm:col-span-1"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
                  <s.icon className="h-4 w-4" />
                </span>
                {s.label}
              </Link>
            ))}
        </div>

        <section className="mt-6">
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="font-display text-sm font-bold">Atividade recente</h2>
            <Link to="/orders" className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline">
              Ver todas <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="rounded-[var(--radius)] border border-dashed border-border p-8 text-center">
              <UnifyMascot size={56} state="idle" className="mx-auto opacity-70" />
              <p className="mt-3 text-sm text-muted-foreground">Nenhuma OS ainda.</p>
              <Button asChild size="sm" className="mt-3 rounded-full">
                <Link to="/orders/new">
                  <Plus className="h-3.5 w-3.5" /> Criar primeira OS
                </Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link
                    to="/orders/$id"
                    params={{ id: o.id }}
                    className="group flex items-center justify-between gap-3 bento-tile p-3.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                        #{o.number}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{o.customers?.name ?? "—"}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {o.devices ? `${o.devices.brand} ${o.devices.model}` : "Sem aparelho"}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn(STATUS_COLOR[o.status], "shrink-0 text-[10px]")}>
                      {STATUS_LABEL[o.status]}
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
