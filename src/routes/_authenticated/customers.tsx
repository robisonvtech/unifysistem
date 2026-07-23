import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Phone, Mail } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/customers")({
  head: () => ({ meta: [{ title: "Clientes — RepairAI" }] }),
  component: CustomersPage,
});

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  doc: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
}

function CustomersPage() {
  const [list, setList] = useState<Customer[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", doc: "", address: "", notes: "" });

  async function load() {
    const { data } = await supabase.from("customers").select("*").order("created_at", { ascending: false }).limit(500);
    setList((data as Customer[]) ?? []);
  }
  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Nome obrigatório.");
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    if (form.phone) {
      const { data: dup } = await supabase.from("customers").select("id").eq("phone", form.phone.trim()).maybeSingle();
      if (dup) return toast.error("Já existe um cliente com esse telefone.");
    }
    const { error } = await supabase.from("customers").insert({
      owner_id: u.user.id,
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      doc: form.doc.trim() || null,
      address: form.address.trim() || null,
      notes: form.notes.trim() || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Cliente cadastrado.");
    setForm({ name: "", phone: "", email: "", doc: "", address: "", notes: "" });
    setOpen(false);
    load();
  }

  const filtered = list.filter((c) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return c.name.toLowerCase().includes(s) || (c.phone?.includes(s) ?? false) || (c.email?.toLowerCase().includes(s) ?? false);
  });

  return (
    <div className="px-4 py-4">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Clientes</h1>
          <p className="text-xs text-muted-foreground">{list.length} cadastrados.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4" /> Novo</Button></DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Novo cliente</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div><Label className="text-xs">Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label className="text-xs">Documento</Label><Input value={form.doc} onChange={(e) => setForm({ ...form, doc: e.target.value })} /></div>
              </div>
              <div><Label className="text-xs">E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label className="text-xs">Endereço</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div><Label className="text-xs">Notas</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <Button type="submit" className="w-full">Salvar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, telefone, e-mail..." className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhum cliente encontrado.
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((c) => (
            <li key={c.id} className="rounded-xl border border-border bg-card p-3">
              <div className="text-sm font-semibold">{c.name}</div>
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                {c.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {c.phone}</span>}
                {c.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {c.email}</span>}
              </div>
              {c.notes && <p className="mt-1 text-xs text-muted-foreground">{c.notes}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
