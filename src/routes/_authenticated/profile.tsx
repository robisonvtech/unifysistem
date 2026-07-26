import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UnifyMascot } from "@/components/UnifyMascot";
import { LogOut, Save, Sparkles, Crown, Gem } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usePlan, type Plan } from "@/hooks/usePlan";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Perfil — RepairAI" },
      { name: "description", content: "Gerencie seu perfil e assinatura RepairAI." },
      { property: "og:title", content: "Perfil — RepairAI" },
      { property: "og:description", content: "Sua conta e preferências." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [subscription, setSubscription] = useState("free");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;
      setEmail(user.user.email ?? "");
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.user.id).maybeSingle();
      if (p) {
        setDisplayName(p.display_name ?? "");
        setAvatarUrl(p.avatar_url ?? "");
        setSubscription(p.subscription_status ?? "free");
      }
    })();
  }, []);

  async function save() {
    setLoading(true);
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const { error } = await supabase.from("profiles").upsert({
      id: user.user.id,
      display_name: displayName,
      avatar_url: avatarUrl || null,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Perfil atualizado.");
  }

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  const planLabel = subscription === "elite" ? "ELITE · Acesso total" : subscription === "pro" ? "PRO Mensal · R$ 19,90" : "Plano Gratuito";
  const planClass = subscription === "elite"
    ? "gradient-primary text-primary-foreground elite-glow"
    : subscription === "pro"
      ? "gradient-primary text-primary-foreground"
      : "bg-muted text-muted-foreground";

  return (
    <div className="pb-6">
      <div className="hero-aura absolute inset-x-0 top-0 -z-10 h-72" />

      <section className="premium-card relative overflow-hidden p-6 text-center">
        <div className="mx-auto flex items-center justify-center">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-24 w-24 rounded-full border-2 border-primary object-cover shadow-[0_10px_30px_-10px_oklch(0.505_0.235_27.5/0.5)]" />
          ) : (
            <UnifyMascot size={112} state="idle" aura elite={subscription === "elite"} />
          )}
        </div>
        <h1 className="mt-3 text-xl font-bold tracking-tight">{displayName || "Técnico"}</h1>
        <p className="text-xs text-muted-foreground">{email}</p>
        <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${planClass}`}>
          {planLabel}
        </span>
      </section>

      <PlanSwitcher />



      <section className="mt-4 space-y-3 premium-card p-5">
        <h2 className="text-sm font-semibold">Informações</h2>
        <div className="space-y-1.5">
          <Label htmlFor="p-name">Nome</Label>
          <Input id="p-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-avatar">URL da foto de perfil (opcional)</Label>
          <Input id="p-avatar" placeholder="https://..." value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
        </div>
        <Button onClick={save} disabled={loading} className="w-full gradient-primary text-primary-foreground">
          <Save className="mr-2 h-4 w-4" /> {loading ? "Salvando..." : "Salvar alterações"}
        </Button>
      </section>

      <button
        onClick={logout}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-destructive transition hover:bg-destructive/5"
      >
        <LogOut className="h-4 w-4" /> Sair
      </button>

      <p className="mt-6 text-center text-xs text-muted-foreground">Unify RepairAI · v1.0</p>
    </div>
  );
}

function PlanSwitcher() {
  const { plan, canSwitch, setOverride, override } = usePlan();
  if (!canSwitch) return null;

  const options: Array<{ id: Plan; label: string; desc: string; icon: typeof Sparkles }> = [
    { id: "start", label: "START", desc: "Light minimal", icon: Sparkles },
    { id: "pro", label: "PRO", desc: "Light premium", icon: Crown },
    { id: "elite", label: "ELITE", desc: "Dark futurista", icon: Gem },
  ];

  return (
    <section className="mt-4 premium-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Visualizar como plano</h2>
          <p className="text-[11px] text-muted-foreground">Admin: alterne entre os três layouts.</p>
        </div>
        {override && (
          <button
            onClick={() => setOverride(null)}
            className="text-[11px] font-medium text-primary hover:underline"
          >
            Restaurar
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {options.map((o) => {
          const active = plan === o.id;
          return (
            <button
              key={o.id}
              onClick={() => setOverride(o.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition",
                active
                  ? "gradient-primary border-transparent text-primary-foreground shadow-[0_10px_24px_-10px_oklch(0.505_0.235_27.5/0.5)]"
                  : "border-border bg-card hover:border-primary/40",
              )}
            >
              <o.icon className={cn("h-5 w-5", active ? "text-primary-foreground" : "text-primary")} />
              <span className="text-xs font-bold tracking-wide">{o.label}</span>
              <span className={cn("text-[10px]", active ? "text-primary-foreground/80" : "text-muted-foreground")}>
                {o.desc}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

