import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Copy, Printer, Trash2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { STATUS_LABEL, STATUS_COLOR, STATUS_ORDER, formatBRL, formatOSNumber, publicBaseUrl, type OrderStatus } from "@/lib/orders";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/orders/$id")({
  head: () => ({ meta: [{ title: "OS — RepairAI" }] }),
  component: OrderDetail,
});

interface OrderFull {
  id: string;
  number: number;
  status: OrderStatus;
  reported_issue: string;
  diagnosis: string | null;
  price_cents: number;
  warranty_days: number;
  estimated_delivery: string | null;
  internal_notes: string | null;
  customer_notes: string | null;
  public_token: string;
  created_at: string;
  delivered_at: string | null;
  customers: { id: string; name: string; phone: string | null; email: string | null } | null;
  devices: { id: string; brand: string; model: string; imei: string | null; color: string | null; device_password: string | null; battery_pct: number | null; accessories: string[]; condition: string | null } | null;
}

interface Event {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

interface OrderPart {
  id: string;
  part_id: string | null;
  name: string;
  qty: number;
  unit_price_cents: number;
}
interface StockPart {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  price_cents: number;
  stock_qty: number;
}

function OrderDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const [o, setO] = useState<OrderFull | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [qr, setQr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [orderParts, setOrderParts] = useState<OrderPart[]>([]);
  const [stock, setStock] = useState<StockPart[]>([]);
  const [selectedPartId, setSelectedPartId] = useState<string>("");
  const [manualName, setManualName] = useState("");
  const [manualPrice, setManualPrice] = useState("0,00");
  const [addQty, setAddQty] = useState("1");

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("service_orders")
      .select("*, customers(id, name, phone, email), devices(id, brand, model, imei, color, device_password, battery_pct, accessories, condition)")
      .eq("id", id).maybeSingle();
    setO(data as unknown as OrderFull);
    const { data: ev } = await supabase
      .from("service_order_events")
      .select("id, type, payload, created_at")
      .eq("order_id", id)
      .order("created_at", { ascending: true });
    setEvents((ev as unknown as Event[]) ?? []);
    if (data?.public_token) {
      const url = `${publicBaseUrl()}/track/${data.public_token}`;
      const dataUrl = await QRCode.toDataURL(url, { width: 200, margin: 1 });
      setQr(dataUrl);
    }
    const { data: op } = await supabase
      .from("order_parts")
      .select("id, part_id, name, qty, unit_price_cents")
      .eq("order_id", id)
      .order("created_at", { ascending: true });
    setOrderParts((op as OrderPart[]) ?? []);
    const { data: st } = await supabase
      .from("parts")
      .select("id, name, brand, model, price_cents, stock_qty")
      .order("name");
    setStock((st as StockPart[]) ?? []);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(s: OrderStatus) {
    setSaving(true);
    const { error } = await supabase.from("service_orders").update({ status: s }).eq("id", id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Status atualizado.");
    load();
  }

  async function saveField(patch: Record<string, unknown>) {
    setSaving(true);
    const { error } = await (supabase.from("service_orders") as unknown as { update: (v: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<{ error: { message: string } | null }> } })
      .update(patch).eq("id", id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Salvo.");
    load();
  }

  async function addPart() {
    const qty = parseInt(addQty, 10) || 1;
    if (qty <= 0) return toast.error("Quantidade inválida.");
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    let payload: { owner_id: string; order_id: string; part_id: string | null; name: string; qty: number; unit_price_cents: number };
    if (selectedPartId) {
      const p = stock.find((s) => s.id === selectedPartId);
      if (!p) return toast.error("Peça não encontrada.");
      if (p.stock_qty < qty) return toast.error("Estoque insuficiente.");
      payload = { owner_id: u.user.id, order_id: id, part_id: p.id, name: p.name, qty, unit_price_cents: p.price_cents };
    } else {
      if (!manualName.trim()) return toast.error("Selecione uma peça ou informe o nome.");
      const cents = Math.round(parseFloat(manualPrice.replace(",", ".") || "0") * 100);
      payload = { owner_id: u.user.id, order_id: id, part_id: null, name: manualName.trim(), qty, unit_price_cents: cents };
    }
    const { error } = await supabase.from("order_parts").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Peça adicionada.");
    setSelectedPartId(""); setManualName(""); setManualPrice("0,00"); setAddQty("1");
    load();
  }

  async function removePart(pid: string) {
    const { error } = await supabase.from("order_parts").delete().eq("id", pid);
    if (error) return toast.error(error.message);
    load();
  }

  async function removeOrder() {
    if (!confirm("Excluir esta OS? Esta ação não pode ser desfeita.")) return;
    const { error } = await supabase.from("service_orders").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("OS excluída.");
    nav({ to: "/orders" });
  }

  const partsTotal = orderParts.reduce((s, p) => s + p.qty * p.unit_price_cents, 0);

  if (!o) return <div className="p-6 text-sm text-muted-foreground">Carregando…</div>;

  const trackUrl = `${publicBaseUrl()}/track/${o.public_token}`;

  return (
    <div className="pb-6">
      <div className="hero-aura absolute inset-x-0 top-0 -z-10 h-56" />
      <header className="mb-4 flex items-center gap-2 print:hidden">
        <Button variant="ghost" size="icon" asChild><Link to="/orders"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div className="flex-1">
          <h1 className="gradient-text text-2xl font-bold tracking-tight">{formatOSNumber(o.number)}</h1>
          <p className="text-xs text-muted-foreground">Criada em {new Date(o.created_at).toLocaleString("pt-BR")}</p>
        </div>
        <Button size="icon" variant="ghost" onClick={() => window.print()}><Printer className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" onClick={removeOrder}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </header>

      <section className="premium-card mb-4 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</span>
          <Badge variant="outline" className={STATUS_COLOR[o.status]}>{STATUS_LABEL[o.status]}</Badge>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              disabled={saving || s === o.status}
              onClick={() => updateStatus(s)}
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${s === o.status ? "gradient-primary border-transparent text-primary-foreground shadow-[0_6px_16px_-8px_oklch(0.505_0.235_27.5/0.6)]" : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </section>


      <section className="mb-4 rounded-xl border border-border bg-card p-4">
        <h2 className="mb-2 text-sm font-semibold">Cliente</h2>
        <p className="text-sm">{o.customers?.name}</p>
        <p className="text-xs text-muted-foreground">{o.customers?.phone ?? "—"} · {o.customers?.email ?? "—"}</p>
      </section>

      <section className="mb-4 rounded-xl border border-border bg-card p-4">
        <h2 className="mb-2 text-sm font-semibold">Aparelho</h2>
        <p className="text-sm font-medium">{o.devices?.brand} {o.devices?.model}</p>
        <dl className="mt-2 grid grid-cols-2 gap-y-1 text-xs">
          <dt className="text-muted-foreground">IMEI</dt><dd>{o.devices?.imei ?? "—"}</dd>
          <dt className="text-muted-foreground">Cor</dt><dd>{o.devices?.color ?? "—"}</dd>
          <dt className="text-muted-foreground">Senha</dt><dd className="font-mono">{o.devices?.device_password ?? "—"}</dd>
          <dt className="text-muted-foreground">Bateria</dt><dd>{o.devices?.battery_pct ? `${o.devices.battery_pct}%` : "—"}</dd>
          <dt className="text-muted-foreground">Acessórios</dt><dd>{o.devices?.accessories?.length ? o.devices.accessories.join(", ") : "—"}</dd>
          <dt className="text-muted-foreground">Condição</dt><dd>{o.devices?.condition ?? "—"}</dd>
        </dl>
      </section>

      <section className="mb-4 rounded-xl border border-border bg-card p-4">
        <h2 className="mb-2 text-sm font-semibold">Serviço</h2>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Defeito relatado</Label>
            <Textarea defaultValue={o.reported_issue} rows={2} onBlur={(e) => e.target.value !== o.reported_issue && saveField({ reported_issue: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Diagnóstico técnico</Label>
            <Textarea defaultValue={o.diagnosis ?? ""} rows={3} onBlur={(e) => saveField({ diagnosis: e.target.value || null })} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Valor</Label>
              <Input defaultValue={(o.price_cents / 100).toFixed(2).replace(".", ",")} onBlur={(e) => {
                const cents = Math.round(parseFloat(e.target.value.replace(",", ".") || "0") * 100);
                if (cents !== o.price_cents) saveField({ price_cents: cents });
              }} />
            </div>
            <div>
              <Label className="text-xs">Garantia (dias)</Label>
              <Input type="number" defaultValue={o.warranty_days} onBlur={(e) => {
                const v = parseInt(e.target.value, 10) || 0;
                if (v !== o.warranty_days) saveField({ warranty_days: v });
              }} />
            </div>
            <div>
              <Label className="text-xs">Prazo</Label>
              <Input type="date" defaultValue={o.estimated_delivery ?? ""} onBlur={(e) => saveField({ estimated_delivery: e.target.value || null })} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Nota para o cliente (aparece no link público)</Label>
            <Textarea defaultValue={o.customer_notes ?? ""} rows={2} onBlur={(e) => saveField({ customer_notes: e.target.value || null })} />
          </div>
          <div>
            <Label className="text-xs">Notas internas (só técnico)</Label>
            <Textarea defaultValue={o.internal_notes ?? ""} rows={2} onBlur={(e) => saveField({ internal_notes: e.target.value || null })} />
          </div>
        </div>
        <div className="mt-3 space-y-1 text-right text-sm">
          <p className="text-muted-foreground">Peças: <span className="font-medium text-foreground">{formatBRL(partsTotal)}</span></p>
          <p className="font-semibold">Total: {formatBRL(o.price_cents + partsTotal)}</p>
        </div>
      </section>

      <section className="mb-4 rounded-xl border border-border bg-card p-4">
        <h2 className="mb-2 text-sm font-semibold">Peças usadas</h2>
        {orderParts.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma peça vinculada.</p>
        ) : (
          <ul className="mb-3 space-y-1.5">
            {orderParts.map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{p.name}</div>
                  <div className="text-muted-foreground">{p.qty}× · {formatBRL(p.unit_price_cents)} un</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{formatBRL(p.qty * p.unit_price_cents)}</span>
                  <Button size="icon" variant="ghost" onClick={() => removePart(p.id)} className="print:hidden"><X className="h-3.5 w-3.5 text-destructive" /></Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="rounded-lg border border-dashed border-border p-2 print:hidden">
          <div className="mb-2">
            <Label className="text-xs">Do estoque</Label>
            <Select value={selectedPartId || "none"} onValueChange={(v) => setSelectedPartId(v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Selecionar peça..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Peça avulsa (manual) —</SelectItem>
                {stock.map((s) => (
                  <SelectItem key={s.id} value={s.id} disabled={s.stock_qty <= 0}>
                    {s.name}{s.brand ? ` · ${s.brand}` : ""} — {s.stock_qty} un · {formatBRL(s.price_cents)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!selectedPartId && (
            <div className="mb-2 grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Nome</Label><Input value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="Ex: Cola B7000" /></div>
              <div><Label className="text-xs">Preço (R$)</Label><Input value={manualPrice} onChange={(e) => setManualPrice(e.target.value)} /></div>
            </div>
          )}
          <div className="flex items-end gap-2">
            <div className="w-24"><Label className="text-xs">Qtd</Label><Input type="number" value={addQty} onChange={(e) => setAddQty(e.target.value)} /></div>
            <Button size="sm" onClick={addPart}><Plus className="h-4 w-4" /> Adicionar peça</Button>
          </div>
        </div>
      </section>


      <section className="mb-4 rounded-xl border border-border bg-card p-4 print:hidden">
        <h2 className="mb-2 text-sm font-semibold">Acompanhamento do cliente</h2>
        <div className="flex items-center gap-3">
          {qr && <img src={qr} alt="QR" className="h-24 w-24 rounded border border-border" />}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted-foreground">{trackUrl}</p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(trackUrl); toast.success("Link copiado."); }}>
                <Copy className="h-3.5 w-3.5" /> Copiar link
              </Button>
              <Button size="sm" variant="outline" asChild><a href={trackUrl} target="_blank" rel="noreferrer">Abrir</a></Button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 print:hidden">
        <h2 className="mb-2 text-sm font-semibold">Timeline</h2>
        {events.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sem eventos.</p>
        ) : (
          <ol className="space-y-2">
            {events.map((e) => (
              <li key={e.id} className="flex gap-3 border-l-2 border-primary/30 pl-3">
                <div className="flex-1">
                  <p className="text-xs font-medium">
                    {e.type === "created" && "OS criada"}
                    {e.type === "status_change" && `Status: ${STATUS_LABEL[(e.payload.from as OrderStatus)] ?? e.payload.from} → ${STATUS_LABEL[(e.payload.to as OrderStatus)] ?? e.payload.to}`}
                    {e.type !== "created" && e.type !== "status_change" && e.type}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{new Date(e.created_at).toLocaleString("pt-BR")}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
