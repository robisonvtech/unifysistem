import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Copy, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { STATUS_LABEL, STATUS_COLOR, STATUS_ORDER, formatBRL, formatOSNumber, publicBaseUrl, type OrderStatus } from "@/lib/orders";

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

function OrderDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const [o, setO] = useState<OrderFull | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [qr, setQr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  async function removeOrder() {
    if (!confirm("Excluir esta OS? Esta ação não pode ser desfeita.")) return;
    const { error } = await supabase.from("service_orders").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("OS excluída.");
    nav({ to: "/orders" });
  }

  if (!o) return <div className="p-6 text-sm text-muted-foreground">Carregando…</div>;

  const trackUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/track/${o.public_token}`;

  return (
    <div className="px-4 py-4">
      <header className="mb-4 flex items-center gap-2 print:hidden">
        <Button variant="ghost" size="icon" asChild><Link to="/orders"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">{formatOSNumber(o.number)}</h1>
          <p className="text-xs text-muted-foreground">Criada em {new Date(o.created_at).toLocaleString("pt-BR")}</p>
        </div>
        <Button size="icon" variant="ghost" onClick={() => window.print()}><Printer className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" onClick={removeOrder}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </header>

      <section className="mb-4 rounded-xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Status</span>
          <Badge variant="outline" className={STATUS_COLOR[o.status]}>{STATUS_LABEL[o.status]}</Badge>
        </div>
        <div className="flex flex-wrap gap-1">
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              disabled={saving || s === o.status}
              onClick={() => updateStatus(s)}
              className={`rounded-full border px-2.5 py-1 text-[11px] ${s === o.status ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:border-primary/40"}`}
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
        <p className="mt-3 text-right text-sm font-semibold">Total: {formatBRL(o.price_cents)}</p>
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
