import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Package, AlertTriangle, ArrowDownCircle, ArrowUpCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatBRL } from "@/lib/orders";

export const Route = createFileRoute("/_authenticated/inventory")({
  head: () => ({
    meta: [
      { title: "Estoque — RepairAI" },
      { name: "description", content: "Controle de peças e movimentações do estoque." },
    ],
  }),
  component: InventoryPage,
});

interface Part {
  id: string;
  sku: string | null;
  name: string;
  brand: string | null;
  model: string | null;
  category: string | null;
  cost_cents: number;
  price_cents: number;
  stock_qty: number;
  min_stock: number;
  notes: string | null;
}

function InventoryPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Part | null>(null);
  const [form, setForm] = useState({
    name: "", sku: "", brand: "", model: "", category: "",
    cost: "0,00", price: "0,00", stock_qty: "0", min_stock: "0", notes: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("parts").select("*").order("name");
    setParts((data as Part[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setEditing(null);
    setForm({ name: "", sku: "", brand: "", model: "", category: "", cost: "0,00", price: "0,00", stock_qty: "0", min_stock: "0", notes: "" });
    setOpen(true);
  }

  function openEdit(p: Part) {
    setEditing(p);
    setForm({
      name: p.name, sku: p.sku ?? "", brand: p.brand ?? "", model: p.model ?? "", category: p.category ?? "",
      cost: (p.cost_cents / 100).toFixed(2).replace(".", ","),
      price: (p.price_cents / 100).toFixed(2).replace(".", ","),
      stock_qty: String(p.stock_qty), min_stock: String(p.min_stock),
      notes: p.notes ?? "",
    });
    setOpen(true);
  }

  async function save() {
    if (!form.name.trim()) return toast.error("Informe o nome da peça.");
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return toast.error("Faça login.");
    const payload = {
      owner_id: u.user.id,
      name: form.name.trim(),
      sku: form.sku.trim() || null,
      brand: form.brand.trim() || null,
      model: form.model.trim() || null,
      category: form.category.trim() || null,
      cost_cents: Math.round(parseFloat(form.cost.replace(",", ".") || "0") * 100),
      price_cents: Math.round(parseFloat(form.price.replace(",", ".") || "0") * 100),
      stock_qty: parseInt(form.stock_qty, 10) || 0,
      min_stock: parseInt(form.min_stock, 10) || 0,
      notes: form.notes.trim() || null,
    };
    const q = editing
      ? supabase.from("parts").update(payload).eq("id", editing.id)
      : supabase.from("parts").insert(payload);
    const { error } = await q;
    if (error) return toast.error(error.message);
    toast.success(editing ? "Peça atualizada." : "Peça cadastrada.");
    setOpen(false);
    load();
  }

  async function adjust(p: Part, delta: number) {
    const newQty = p.stock_qty + delta;
    if (newQty < 0) return toast.error("Estoque não pode ficar negativo.");
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("parts").update({ stock_qty: newQty }).eq("id", p.id);
    if (error) return toast.error(error.message);
    await supabase.from("stock_movements").insert({
      owner_id: u.user.id, part_id: p.id, type: delta > 0 ? "in" : "adjust", qty: Math.abs(delta),
      reason: delta > 0 ? "Entrada manual" : "Ajuste manual",
    });
    load();
  }

  async function remove(p: Part) {
    if (!confirm(`Excluir "${p.name}"?`)) return;
    const { error } = await supabase.from("parts").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Peça excluída.");
    load();
  }

  const filtered = parts.filter((p) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return p.name.toLowerCase().includes(s)
      || (p.sku?.toLowerCase().includes(s) ?? false)
      || (p.brand?.toLowerCase().includes(s) ?? false)
      || (p.model?.toLowerCase().includes(s) ?? false);
  });

  const low = parts.filter((p) => p.stock_qty <= p.min_stock).length;
  const totalValue = parts.reduce((s, p) => s + p.stock_qty * p.cost_cents, 0);

  return (
    <div className="px-4 py-4">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Estoque</h1>
          <p className="text-xs text-muted-foreground">{parts.length} peças · valor: {formatBRL(totalValue)}</p>
        </div>
        <Button size="sm" onClick={openNew}><Plus className="h-4 w-4" /> Nova</Button>
      </header>

      {low > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <span><strong>{low}</strong> peça(s) com estoque abaixo do mínimo.</span>
        </div>
      )}

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar peça, SKU, marca..." className="pl-9" />
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <Package className="mx-auto mb-2 h-6 w-6" />
          Nenhuma peça no estoque.
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((p) => {
            const isLow = p.stock_qty <= p.min_stock;
            return (
              <li key={p.id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <button onClick={() => openEdit(p)} className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">{p.name}</span>
                      {isLow && <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-[10px] text-amber-700 dark:text-amber-300">Baixo</Badge>}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {[p.brand, p.model, p.sku].filter(Boolean).join(" · ") || "Sem detalhes"}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs">
                      <span className="font-medium">{p.stock_qty} un</span>
                      <span className="text-muted-foreground">custo {formatBRL(p.cost_cents)}</span>
                      <span className="text-primary">venda {formatBRL(p.price_cents)}</span>
                    </div>
                  </button>
                  <div className="flex flex-col gap-1">
                    <Button size="icon" variant="ghost" onClick={() => adjust(p, 1)} title="Entrada"><ArrowUpCircle className="h-4 w-4 text-emerald-600" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => adjust(p, -1)} title="Saída"><ArrowDownCircle className="h-4 w-4 text-orange-600" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(p)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild><span /></DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar peça" : "Nova peça"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Tela iPhone 11" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Marca</Label><Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></div>
              <div><Label>Modelo</Label><Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></div>
              <div><Label>SKU</Label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
              <div><Label>Categoria</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Tela, bateria..." /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Custo (R$)</Label><Input value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></div>
              <div><Label>Venda (R$)</Label><Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              <div><Label>Estoque</Label><Input type="number" value={form.stock_qty} onChange={(e) => setForm({ ...form, stock_qty: e.target.value })} /></div>
              <div><Label>Mínimo</Label><Input type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} /></div>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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
