import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/orders/new")({
  head: () => ({ meta: [{ title: "Nova OS — RepairAI" }] }),
  component: NewOrder,
});

interface Customer { id: string; name: string; phone: string | null }

function NewOrder() {
  const nav = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "" });
  const [device, setDevice] = useState({ brand: "", model: "", imei: "", color: "", device_password: "", accessories: "", condition: "", battery_pct: "" });
  const [reported, setReported] = useState("");
  const [price, setPrice] = useState("");
  const [warranty, setWarranty] = useState("90");
  const [estimated, setEstimated] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("customers").select("id, name, phone").order("name").limit(500);
      setCustomers((data as Customer[]) ?? []);
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reported.trim()) return toast.error("Informe o defeito relatado.");
    if (!device.brand.trim() || !device.model.trim()) return toast.error("Informe marca e modelo.");
    if (!customerId && !newCustomer.name.trim()) return toast.error("Selecione ou cadastre um cliente.");
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) throw new Error("Sessão expirada.");

      let finalCustomerId = customerId;
      if (!finalCustomerId) {
        // duplicate check by phone
        if (newCustomer.phone) {
          const { data: dup } = await supabase.from("customers").select("id").eq("phone", newCustomer.phone).maybeSingle();
          if (dup) finalCustomerId = dup.id;
        }
        if (!finalCustomerId) {
          const { data: c, error: cErr } = await supabase
            .from("customers")
            .insert({ owner_id: uid, name: newCustomer.name.trim(), phone: newCustomer.phone.trim() || null })
            .select("id").single();
          if (cErr) throw cErr;
          finalCustomerId = c.id;
        }
      }

      const accessories = device.accessories
        .split(",").map((a) => a.trim()).filter(Boolean);

      const { data: dev, error: dErr } = await supabase
        .from("devices")
        .insert({
          owner_id: uid,
          customer_id: finalCustomerId,
          brand: device.brand.trim(),
          model: device.model.trim(),
          imei: device.imei.trim() || null,
          color: device.color.trim() || null,
          device_password: device.device_password.trim() || null,
          accessories,
          condition: device.condition.trim() || null,
          battery_pct: device.battery_pct ? parseInt(device.battery_pct, 10) : null,
        })
        .select("id").single();
      if (dErr) throw dErr;

      const { data: order, error: oErr } = await supabase
        .from("service_orders")
        .insert({
          owner_id: uid,
          customer_id: finalCustomerId,
          device_id: dev.id,
          reported_issue: reported.trim(),
          price_cents: price ? Math.round(parseFloat(price.replace(",", ".")) * 100) : 0,
          warranty_days: parseInt(warranty, 10) || 90,
          estimated_delivery: estimated || null,
        })
        .select("id").single();
      if (oErr) throw oErr;

      toast.success("OS criada!");
      nav({ to: "/orders/$id", params: { id: order.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar OS.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-4 py-4">
      <header className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild><Link to="/orders"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <h1 className="text-lg font-bold">Nova OS</h1>
      </header>

      <form onSubmit={submit} className="space-y-5">
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">Cliente</h2>
          <Label className="text-xs">Cliente existente</Label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">— Novo cliente —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ""}</option>
            ))}
          </select>
          {!customerId && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <Label className="text-xs">Nome *</Label>
                <Input value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Telefone</Label>
                <Input value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
              </div>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">Aparelho</h2>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Marca *</Label><Input value={device.brand} onChange={(e) => setDevice({ ...device, brand: e.target.value })} placeholder="Apple, Samsung..." /></div>
            <div><Label className="text-xs">Modelo *</Label><Input value={device.model} onChange={(e) => setDevice({ ...device, model: e.target.value })} placeholder="iPhone 13, S23..." /></div>
            <div><Label className="text-xs">IMEI</Label><Input value={device.imei} onChange={(e) => setDevice({ ...device, imei: e.target.value })} /></div>
            <div><Label className="text-xs">Cor</Label><Input value={device.color} onChange={(e) => setDevice({ ...device, color: e.target.value })} /></div>
            <div><Label className="text-xs">Senha do aparelho</Label><Input value={device.device_password} onChange={(e) => setDevice({ ...device, device_password: e.target.value })} /></div>
            <div><Label className="text-xs">Bateria (%)</Label><Input type="number" value={device.battery_pct} onChange={(e) => setDevice({ ...device, battery_pct: e.target.value })} /></div>
            <div className="col-span-2"><Label className="text-xs">Acessórios (separados por vírgula)</Label><Input value={device.accessories} onChange={(e) => setDevice({ ...device, accessories: e.target.value })} placeholder="Capa, cabo, película" /></div>
            <div className="col-span-2"><Label className="text-xs">Condição / observações</Label><Input value={device.condition} onChange={(e) => setDevice({ ...device, condition: e.target.value })} placeholder="Trincado, riscos na traseira..." /></div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">Serviço</h2>
          <div>
            <Label className="text-xs">Defeito relatado *</Label>
            <Textarea value={reported} onChange={(e) => setReported(e.target.value)} rows={3} placeholder="Ex.: Não liga após queda." />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div><Label className="text-xs">Valor (R$)</Label><Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" /></div>
            <div><Label className="text-xs">Garantia (dias)</Label><Input type="number" value={warranty} onChange={(e) => setWarranty(e.target.value)} /></div>
            <div><Label className="text-xs">Prazo</Label><Input type="date" value={estimated} onChange={(e) => setEstimated(e.target.value)} /></div>
          </div>
        </section>

        <Button type="submit" disabled={saving} className="w-full">{saving ? "Salvando…" : "Criar OS"}</Button>
      </form>
    </div>
  );
}
