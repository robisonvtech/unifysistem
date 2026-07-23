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
    <div className="px-4 py-4">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Ordens de Serviço</h1>
          <p className="text-xs text-muted-foreground">{orders.length} OS no total.</p>
        </div>
        <Button asChild size="sm">
          <Link to="/orders/new"><Plus className="h-4 w-4" /> Nova</Link>
        </Button>
      </header>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por número, cliente, aparelho..."
          className="pl-9"
        />
      </div>

      <div className="mb-3 flex gap-1 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition",
            filter === "all" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground",
          )}
        >
          Todas
        </button>
        {STATUS_ORDER.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition",
              filter === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground",
            )}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhuma OS encontrada.
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((o) => (
            <li key={o.id}>
              <Link
                to="/orders/$id"
                params={{ id: o.id }}
                className="block rounded-xl border border-border bg-card p-3 transition hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{formatOSNumber(o.number)}</span>
                      <span className="truncate text-sm text-muted-foreground">{o.customers?.name ?? "—"}</span>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                      {o.devices ? `${o.devices.brand} ${o.devices.model} — ` : ""}
                      {o.reported_issue}
                    </div>
                  </div>
                  <Badge variant="outline" className={cn("shrink-0 text-[10px]", STATUS_COLOR[o.status])}>
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
