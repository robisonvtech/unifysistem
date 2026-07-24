import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, TrendingUp, TrendingDown, Wallet, CheckCircle2, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { formatBRL } from "@/lib/orders";

export const Route = createFileRoute("/_authenticated/finance")({
  head: () => ({
    meta: [
      { title: "Financeiro — RepairAI" },
      { name: "description", content: "Contas a receber, a pagar e fluxo de caixa." },
    ],
  }),
  component: FinancePage,
});

type TxType = "income" | "expense";
type TxStatus = "pending" | "paid" | "cancelled";

interface Tx {
  id: string;
  order_id: string | null;
  type: TxType;
  category: string | null;
  description: string;
  amount_cents: number;
  status: TxStatus;
  due_date: string | null;
  paid_at: string | null;
  payment_method: string | null;
  created_at: string;
}

const STATUS_LABEL: Record<TxStatus, string> = { pending: "Pendente", paid: "Pago", cancelled: "Cancelado" };
const STATUS_CLASS: Record<TxStatus, string> = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  cancelled: "bg-muted text-muted-foreground border-border",
};

function FinancePage() {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    type: "expense" as TxType,
    description: "",
    category: "",
    amount: "0,00",
    due_date: "",
    status: "pending" as TxStatus,
    payment_method: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("finance_transactions")
      .select("*")
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(500);
    setTxs((data as Tx[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!form.description.trim()) return toast.error("Informe a descrição.");
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const cents = Math.round(parseFloat(form.amount.replace(",", ".") || "0") * 100);
    if (cents <= 0) return toast.error("Valor inválido.");
    const { error } = await supabase.from("finance_transactions").insert({
      owner_id: u.user.id,
      type: form.type,
      description: form.description.trim(),
      category: form.category.trim() || null,
      amount_cents: cents,
      status: form.status,
      due_date: form.due_date || null,
      paid_at: form.status === "paid" ? new Date().toISOString() : null,
      payment_method: form.payment_method.trim() || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Lançamento salvo.");
    setOpen(false);
    setForm({ type: "expense", description: "", category: "", amount: "0,00", due_date: "", status: "pending", payment_method: "" });
    load();
  }

  async function markPaid(tx: Tx) {
    const { error } = await supabase.from("finance_transactions")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", tx.id);
    if (error) return toast.error(error.message);
    toast.success("Baixado como pago.");
    load();
  }

  async function remove(tx: Tx) {
    if (!confirm("Excluir este lançamento?")) return;
    const { error } = await supabase.from("finance_transactions").delete().eq("id", tx.id);
    if (error) return toast.error(error.message);
    load();
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const inMonth = (d: string | null) => d ? new Date(d) >= monthStart : false;

  const receivablesPending = txs.filter((t) => t.type === "income" && t.status === "pending");
  const payablesPending = txs.filter((t) => t.type === "expense" && t.status === "pending");
  const incomeMonth = txs.filter((t) => t.type === "income" && t.status === "paid" && inMonth(t.paid_at)).reduce((s, t) => s + t.amount_cents, 0);
  const expenseMonth = txs.filter((t) => t.type === "expense" && t.status === "paid" && inMonth(t.paid_at)).reduce((s, t) => s + t.amount_cents, 0);
  const balanceMonth = incomeMonth - expenseMonth;
  const totalReceivable = receivablesPending.reduce((s, t) => s + t.amount_cents, 0);
  const totalPayable = payablesPending.reduce((s, t) => s + t.amount_cents, 0);

  const kpis = [
    { label: "Receita do mês", value: formatBRL(incomeMonth), icon: TrendingUp, color: "text-emerald-600" },
    { label: "Despesa do mês", value: formatBRL(expenseMonth), icon: TrendingDown, color: "text-orange-600" },
    { label: "Saldo do mês", value: formatBRL(balanceMonth), icon: Wallet, color: balanceMonth >= 0 ? "text-primary" : "text-destructive" },
    { label: "A receber", value: formatBRL(totalReceivable), icon: TrendingUp, color: "text-amber-600" },
    { label: "A pagar", value: formatBRL(totalPayable), icon: TrendingDown, color: "text-red-600" },
  ];

  function TxRow({ t }: { t: Tx }) {
    const overdue = t.status === "pending" && t.due_date && new Date(t.due_date) < new Date(now.toDateString());
    return (
      <li className="rounded-xl border border-border bg-card p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="truncate text-sm font-semibold">{t.description}</span>
              <Badge variant="outline" className={`text-[10px] ${STATUS_CLASS[t.status]}`}>{STATUS_LABEL[t.status]}</Badge>
              {overdue && <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-[10px] text-destructive">Vencido</Badge>}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {[t.category, t.due_date && `venc. ${new Date(t.due_date).toLocaleDateString("pt-BR")}`, t.payment_method]
                .filter(Boolean).join(" · ") || "—"}
            </div>
            {t.order_id && (
              <Link to="/orders/$id" params={{ id: t.order_id }} className="mt-1 inline-flex items-center gap-1 text-[11px] text-primary">
                <ExternalLink className="h-3 w-3" /> Abrir OS
              </Link>
            )}
          </div>
          <div className="text-right">
            <div className={`text-sm font-bold ${t.type === "income" ? "text-emerald-600" : "text-orange-600"}`}>
              {t.type === "income" ? "+" : "−"}{formatBRL(t.amount_cents)}
            </div>
            <div className="mt-1 flex justify-end gap-1">
              {t.status === "pending" && (
                <Button size="icon" variant="ghost" onClick={() => markPaid(t)} title="Baixar"><CheckCircle2 className="h-4 w-4 text-emerald-600" /></Button>
              )}
              <Button size="icon" variant="ghost" onClick={() => remove(t)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          </div>
        </div>
      </li>
    );
  }

  return (
    <div className="px-4 py-4">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Financeiro</h1>
          <p className="text-xs text-muted-foreground">Contas, caixa e recebimentos.</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Novo</Button>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-2">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{k.label}</span>
              <k.icon className={`h-4 w-4 ${k.color}`} />
            </div>
            <div className="mt-1 text-lg font-bold">{k.value}</div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="receivable">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="receivable">A receber</TabsTrigger>
          <TabsTrigger value="payable">A pagar</TabsTrigger>
          <TabsTrigger value="all">Todos</TabsTrigger>
        </TabsList>

        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <>
            <TabsContent value="receivable">
              {receivablesPending.length === 0 ? (
                <Empty label="Nenhuma conta a receber." />
              ) : (
                <ul className="mt-3 space-y-2">{receivablesPending.map((t) => <TxRow key={t.id} t={t} />)}</ul>
              )}
            </TabsContent>
            <TabsContent value="payable">
              {payablesPending.length === 0 ? (
                <Empty label="Nenhuma conta a pagar." />
              ) : (
                <ul className="mt-3 space-y-2">{payablesPending.map((t) => <TxRow key={t.id} t={t} />)}</ul>
              )}
            </TabsContent>
            <TabsContent value="all">
              {txs.length === 0 ? (
                <Empty label="Nenhum lançamento." />
              ) : (
                <ul className="mt-3 space-y-2">{txs.map((t) => <TxRow key={t.id} t={t} />)}</ul>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo lançamento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as TxType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Receita</SelectItem>
                    <SelectItem value="expense">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as TxStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Descrição *</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Aluguel, compra de peças..." />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Categoria</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
              <div><Label>Valor (R$) *</Label><Input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
              <div><Label>Vencimento</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
              <div><Label>Forma pgto</Label><Input value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} placeholder="Pix, cartão..." /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="mt-3 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}
