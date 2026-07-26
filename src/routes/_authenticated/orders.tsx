import { createFileRoute, Link, Outlet, useMatchRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { STATUS_LABEL, STATUS_COLOR, STATUS_ORDER, formatOSNumber, type OrderStatus } from "@/lib/orders";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({
    meta: [
      { title: "Ordens de Serviço — RepairAI" },
      { name: "description", content: "Gerencie todas as OS da sua assistência técnica." },
    ],
  }),
  component: OrdersLayout,
});

interface OrderRow {
  id: string;
  number: number;
  status: OrderStatus;
  reported_issue: string;
  created_at: string;
  customers: { name: string } | null;
  devices: { brand: string; model: string } | null;
}

function OrdersLayout() {
  const matchRoute = useMatchRoute();
  // If a child route is active, render only the child.
  const isChild = matchRoute({ to: "/orders/new" }) || matchRoute({ to: "/orders/$id", fuzzy: true });
  if (isChild) return <Outlet />;

  return <OrdersList />;
}

function OrdersList() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("service_orders")
        .select("id, number, status, reported_issue, created_at, customers(name), devices(brand, model)")
        .order("created_at", { ascending: false })
        .limit(200);
      setOrders((data as unknown as OrderRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = orders.filter((o) => {
    if (filter !== "all" && o.status !== filter) return false;
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (
      String(o.number).includes(s) ||
      (o.customers?.name.toLowerCase().includes(s) ?? false) ||
      (o.devices && `${o.devices.brand} ${o.devices.model}`.toLowerCase().includes(s)) ||
      o.reported_issue.toLowerCase().includes(s)
    );
  });

  return (
    <div className="pb-6">
      <div className="hero-aura absolute inset-x-0 top-0 -z-10 h-64" />
      <header className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-primary">Operação</p>
          <h1 className="text-2xl font-bold tracking-tight">Ordens de Serviço</h1>
          <p className="text-xs text-muted-foreground">{orders.length} OS no total</p>
        </div>
        <Button asChild size="sm" className="gradient-primary text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.505_0.235_27.5/0.5)]">
          <Link to="/orders/new"><Plus className="h-4 w-4" /> Nova OS</Link>
        </Button>
      </header>

      <div className="glass-card mb-3 flex items-center gap-2 rounded-2xl px-3 py-1.5">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por número, cliente, aparelho..."
          className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
        />
      </div>

      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
            filter === "all" ? "gradient-primary border-transparent text-primary-foreground shadow-[0_6px_16px_-8px_oklch(0.505_0.235_27.5/0.6)]" : "border-border bg-card/50 text-muted-foreground hover:text-foreground",
          )}
        >
          Todas
        </button>
        {STATUS_ORDER.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
              filter === s ? "gradient-primary border-transparent text-primary-foreground shadow-[0_6px_16px_-8px_oklch(0.505_0.235_27.5/0.6)]" : "border-border bg-card/50 text-muted-foreground hover:text-foreground",
            )}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="premium-card p-10 text-center">
          <p className="text-sm font-medium">Nenhuma OS encontrada.</p>
          <p className="mt-1 text-xs text-muted-foreground">Crie a primeira para começar.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((o) => (
            <li key={o.id} className="animate-fade-up">
              <Link
                to="/orders/$id"
                params={{ id: o.id }}
                className="premium-card premium-card-hover block p-3.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="gradient-text text-sm font-bold">{formatOSNumber(o.number)}</span>
                      <span className="truncate text-sm font-medium">{o.customers?.name ?? "—"}</span>
                    </div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">
                      {o.devices ? `${o.devices.brand} ${o.devices.model} — ` : ""}
                      {o.reported_issue}
                    </div>
                  </div>
                  <Badge variant="outline" className={cn("shrink-0 text-[10px] font-semibold", STATUS_COLOR[o.status])}>
                    {STATUS_LABEL[o.status]}
                  </Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
