import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/orders";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, TrendingDown, Wallet, Wrench, CheckCircle2, Clock,
  Package, Users, ClipboardList, Plus,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/business")({
  head: () => ({
    meta: [
      { title: "Negócios — RepairAI" },
      { name: "description", content: "Receitas, despesas, reparos, vendas e estoque da sua assistência." },
      { property: "og:title", content: "Negócios — RepairAI" },
      { property: "og:description", content: "Painel de receita, despesa e reparos da sua assistência." },
    ],
  }),
  component: BusinessPage,
});

interface Totals {
  income: number;
  expense: number;
  receivable: number;
  payable: number;
  repairsTotal: number;
  repairsDone: number;
  repairsPending: number;
}

const EMPTY: Totals = {
  income: 0, expense: 0, receivable: 0, payable: 0,
  repairsTotal: 0, repairsDone: 0, repairsPending: 0,
};

function BusinessPage() {
  const [t, setT] = useState<Totals>(EMPTY);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const [{ data: txs }, { data: orders }] = await Promise.all([
      supabase.from("finance_transactions").select("type,status,amount_cents,paid_at").limit(1000),
      supabase.from("service_orders").select("status").limit(1000),
    ]);

    const list = txs ?? [];
    const paidInMonth = (d: string | null) => (d ? new Date(d) >= monthStart : false);
    const sum = (f: (x: (typeof list)[number]) => boolean) =>
      list.filter(f).reduce((s, x) => s + (x.amount_cents ?? 0), 0);

    const os = orders ?? [];
    const done = os.filter((o) => o.status === "delivered" || o.status === "ready").length;

    setT({
      income: sum((x) => x.type === "income" && x.status === "paid" && paidInMonth(x.paid_at)),
      expense: sum((x) => x.type === "expense" && x.status === "paid" && paidInMonth(x.paid_at)),
      receivable: sum((x) => x.type === "income" && x.status === "pending"),
      payable: sum((x) => x.type === "expense" && x.status === "pending"),
      repairsTotal: os.length,
      repairsDone: done,
      repairsPending: os.length - done,
    });
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const balance = t.income - t.expense;
  const pct = t.repairsTotal ? Math.round((t.repairsDone / t.repairsTotal) * 100) : 0;

  return (
    <div className="pb-6">
      <div className="hero-aura absolute inset-x-0 top-0 -z-10 h-56" />

      <header className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Negócios</h1>
          <p className="text-xs text-muted-foreground">Receita, despesa, reparos, vendas e estoque.</p>
        </div>
        <Button asChild size="sm" className="gradient-primary text-primary-foreground">
          <Link to="/finance"><Plus className="mr-1 h-4 w-4" /> Lançar</Link>
        </Button>
      </header>

      {/* Receita x Despesa */}
      <section className="premium-card p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Saldo do mês</span>
          <Wallet className={`h-4 w-4 ${balance >= 0 ? "text-primary" : "text-destructive"}`} />
        </div>
        <div className="mt-1 text-3xl font-extrabold tracking-tight">
          {loading ? "—" : formatBRL(balance)}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-300">
              <TrendingUp className="h-3.5 w-3.5" /> Receitas
            </div>
            <div className="mt-1 text-lg font-bold">{loading ? "—" : formatBRL(t.income)}</div>
            <div className="text-[10px] text-muted-foreground">A receber {formatBRL(t.receivable)}</div>
          </div>
          <div className="rounded-2xl border border-orange-500/25 bg-orange-500/10 p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-orange-600 dark:text-orange-300">
              <TrendingDown className="h-3.5 w-3.5" /> Despesas
            </div>
            <div className="mt-1 text-lg font-bold">{loading ? "—" : formatBRL(t.expense)}</div>
            <div className="text-[10px] text-muted-foreground">A pagar {formatBRL(t.payable)}</div>
          </div>
        </div>
      </section>

      {/* Reparos — card menor */}
      <section className="mt-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Wrench className="h-4 w-4 text-primary" /> Reparos realizados
          </div>
          <span className="text-xs font-bold text-primary">{t.repairsTotal}</span>
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs">
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" /> {t.repairsDone} concluídos
          </span>
          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-300">
            <Clock className="h-3.5 w-3.5" /> {t.repairsPending} pendentes
          </span>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full gradient-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </section>

      {/* Cadastros */}
      <section className="mt-4">
        <h2 className="mb-2 text-sm font-semibold">Cadastrar</h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            { to: "/orders/new", label: "Serviço / OS", desc: "Novo reparo", icon: ClipboardList },
            { to: "/finance", label: "Venda", desc: "Entrada no caixa", icon: TrendingUp },
            { to: "/inventory", label: "Estoque", desc: "Peças e saldo", icon: Package },
            { to: "/customers", label: "Cliente", desc: "Cadastro e histórico", icon: Users },
          ].map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-2xl border border-border bg-card p-3 transition hover:border-primary/40"
            >
              <l.icon className="h-5 w-5 text-primary" />
              <div className="mt-2 text-sm font-semibold">{l.label}</div>
              <div className="text-[11px] text-muted-foreground">{l.desc}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
