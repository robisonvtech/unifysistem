import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UnifyMascot } from "@/components/UnifyMascot";
import { LogOut, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

  return (
    <div className="px-4 py-4">
      <div className="flex flex-col items-center py-4">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-24 w-24 rounded-full border-2 border-primary object-cover" />
        ) : (
          <UnifyMascot size={96} state="idle" />
        )}
        <h1 className="mt-3 text-lg font-bold">{displayName || "Técnico"}</h1>
        <p className="text-xs text-muted-foreground">{email}</p>
        <Badge className="mt-2" variant={subscription === "pro" ? "default" : "outline"}>
          {subscription === "pro" ? "Pro Mensal" : "Plano Gratuito"}
        </Badge>
      </div>

      <section className="mt-4 space-y-3 rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Informações</h2>
        <div className="space-y-1.5">
          <Label htmlFor="p-name">Nome</Label>
          <Input id="p-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-avatar">URL da foto de perfil (opcional)</Label>
          <Input id="p-avatar" placeholder="https://..." value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
        </div>
        <Button onClick={save} disabled={loading} className="w-full">
          <Save className="mr-2 h-4 w-4" /> {loading ? "Salvando..." : "Salvar alterações"}
        </Button>
      </section>

      <button
        onClick={logout}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/5"
      >
        <LogOut className="h-4 w-4" /> Sair
      </button>

      <p className="mt-6 text-center text-xs text-muted-foreground">RepairAI · Unify · v1.0</p>
    </div>
  );
}
