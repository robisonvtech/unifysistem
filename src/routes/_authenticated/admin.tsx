import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Lock, LockOpen, RefreshCw, Smartphone, UserPlus, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administração — Unify RepairAI" },
      { name: "description", content: "Crie contas, defina validade de acesso e gerencie dispositivos dos usuários." },
      { property: "og:title", content: "Administração — Unify RepairAI" },
      { property: "og:description", content: "Gestão de acessos do Unify RepairAI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

interface AdminUser {
  id: string;
  display_name: string | null;
  subscription_status: string;
  created_at: string;
  access_expires_at: string | null;
  blocked: boolean;
  device_id: string | null;
  roles: string[];
}

async function authFetch(url: string, init?: RequestInit) {
  const { data } = await supabase.auth.getSession();
  return fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${data.session?.access_token ?? ""}`,
      ...(init?.headers ?? {}),
    },
  });
}

function AdminPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", days: "30", admin: false });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await authFetch("/api/admin/users");
    setLoading(false);
    if (res.status === 401) return setAllowed(false);
    if (!res.ok) return toast.error("Não foi possível carregar os usuários.");
    const json = await res.json();
    setAllowed(true);
    setUsers(json.users ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await authFetch("/api/admin/users", {
      method: "POST",
      body: JSON.stringify({
        email: form.email,
        password: form.password,
        display_name: form.name || null,
        days: Number(form.days) || null,
        role: form.admin ? "admin" : null,
      }),
    });
    setLoading(false);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error(json.error ?? "Erro ao criar conta.");
    toast.success("Conta criada com sucesso.");
    setForm({ name: "", email: "", password: "", days: "30", admin: false });
    load();
  }

  async function patch(id: string, body: Record<string, unknown>, msg: string) {
    const res = await authFetch(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(body) });
    if (!res.ok) return toast.error("Não foi possível atualizar.");
    toast.success(msg);
    load();
  }

  if (allowed === false) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShieldAlert className="h-10 w-10 text-primary" />
        <h1 className="mt-3 text-lg font-bold">Área restrita</h1>
        <p className="mt-1 text-sm text-muted-foreground">Somente administradores podem acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <header className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight">Administração</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">Crie acessos, defina validade e libere dispositivos.</p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold">Criar conta de usuário</h2>
        </div>
        <form onSubmit={createUser} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="a-name">Nome</Label>
            <Input id="a-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="a-email">E-mail</Label>
            <Input id="a-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="a-pw">Senha</Label>
              <Input id="a-pw" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-days">Validade (dias)</Label>
              <Input id="a-days" type="number" min={0} value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={form.admin}
              onChange={(e) => setForm({ ...form, admin: e.target.checked })}
              className="h-4 w-4 accent-[oklch(0.505_0.235_27.5)]"
            />
            Conceder acesso de administrador
          </label>
          <Button disabled={loading} className="w-full rounded-xl gradient-primary text-primary-foreground">
            {loading ? "Criando..." : "Criar conta"}
          </Button>
          <p className="text-[11px] text-muted-foreground">
            0 dias = acesso sem prazo. Cada conta fica vinculada ao primeiro dispositivo usado.
          </p>
        </form>
      </section>

      <section className="mt-6">
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="text-sm font-bold">Usuários ({users.length})</h2>
          <button onClick={load} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            <RefreshCw className="h-3 w-3" /> Atualizar
          </button>
        </div>
        <ul className="space-y-2">
          {users.map((u) => {
            const expired = u.access_expires_at ? new Date(u.access_expires_at).getTime() < Date.now() : false;
            return (
              <li key={u.id} className="rounded-2xl border border-border bg-card p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{u.display_name || "Sem nome"}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {u.access_expires_at
                        ? `Válido até ${new Date(u.access_expires_at).toLocaleDateString("pt-BR")}`
                        : "Acesso sem prazo"}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-1">
                    {u.roles.includes("admin") && <Badge className="text-[10px]">ADMIN</Badge>}
                    {u.blocked && <Badge variant="destructive" className="text-[10px]">Bloqueado</Badge>}
                    {expired && !u.blocked && <Badge variant="outline" className="text-[10px] text-amber-500">Expirado</Badge>}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <ActionBtn onClick={() => patch(u.id, { blocked: !u.blocked }, u.blocked ? "Desbloqueado" : "Bloqueado")}>
                    {u.blocked ? <LockOpen className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                    {u.blocked ? "Desbloquear" : "Bloquear"}
                  </ActionBtn>
                  <ActionBtn onClick={() => patch(u.id, { reset_device: true }, "Dispositivo liberado")} disabled={!u.device_id}>
                    <Smartphone className="h-3 w-3" /> Liberar dispositivo
                  </ActionBtn>
                  <ActionBtn onClick={() => patch(u.id, { days: 30 }, "Acesso renovado por 30 dias")}>
                    <RefreshCw className="h-3 w-3" /> +30 dias
                  </ActionBtn>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function ActionBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-medium transition",
        disabled ? "opacity-40" : "hover:border-primary/50 hover:text-primary",
      )}
    >
      {children}
    </button>
  );
}
