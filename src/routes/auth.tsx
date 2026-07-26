import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UnifyMascot } from "@/components/UnifyMascot";
import { toast } from "sonner";
import { hasAccessToApp } from "@/lib/subscription";

const checkoutPlans = [
  {
    key: "basic",
    label: "Básico",
    url: import.meta.env.VITE_CAKTO_CHECKOUT_URL as string | undefined,
    description: "Acesso inicial",
  },
  {
    key: "pro",
    label: "Pro",
    url: import.meta.env.VITE_CAKTO_PRO_CHECKOUT_URL as string | undefined,
    description: "Recursos avançados",
  },
  {
    key: "elite",
    label: "Elite",
    url: import.meta.env.VITE_CAKTO_ELITE_CHECKOUT_URL as string | undefined,
    description: "Acesso completo",
  },
];

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar - RepairAI" },
      { name: "description", content: "Entre no RepairAI para diagnosticar celulares com a IA Unify." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "signup" | "reset">("login");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"basic" | "pro" | "elite">("basic");

  async function canAccess(userId: string) {
    const [{ data: profile }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("subscription_status").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    return hasAccessToApp(profile?.subscription_status) || (roles ?? []).some((role) => role.role === "admin");
  }

  function openCheckout(plan: "basic" | "pro" | "elite" = selectedPlan) {
    const planConfig = checkoutPlans.find((item) => item.key === plan);
    if (!planConfig?.url) return toast.error(`Checkout do plano ${planConfig?.label ?? plan} ainda nao foi configurado.`);
    window.location.assign(planConfig.url);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session?.user) return;
      if (await canAccess(data.session.user.id)) navigate({ to: "/chat" });
      else {
        await supabase.auth.signOut();
        setPaymentRequired(true);
      }
    });
  }, [navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (!data.user || !(await canAccess(data.user.id))) {
      await supabase.auth.signOut();
      setPaymentRequired(true);
      return toast.error("Sua assinatura ainda nao esta ativa.");
    }
    toast.success("Bem-vindo!");
    navigate({ to: "/chat" });
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: name },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    await supabase.auth.signOut();
    toast.success("Conta criada. Continue para assinar.");
    openCheckout(selectedPlan);
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("E-mail de redefinicao enviado.");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="mb-6 flex flex-col items-center gap-2">
        <UnifyMascot size={88} state="idle" />
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Repair<span className="text-primary">AI</span></h1>
        <p className="text-sm text-muted-foreground">Assistente Unify para tecnicos</p>
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm">
        {paymentRequired && (
          <div className="mb-4 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
            <p className="font-medium">Assinatura necessaria</p>
            <p className="mt-1 text-xs text-muted-foreground">Escolha o plano e continue para o checkout.</p>
            <div className="mt-3 space-y-2">
              {checkoutPlans.map((plan) => (
                <button
                  key={plan.key}
                  type="button"
                  onClick={() => setSelectedPlan(plan.key as "basic" | "pro" | "elite")}
                  className={`w-full rounded-lg border px-3 py-2 text-left ${selectedPlan === plan.key ? "border-primary bg-primary/10" : "border-border bg-background"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{plan.label}</span>
                    <span className="text-[11px] text-muted-foreground">{plan.description}</span>
                  </div>
                </button>
              ))}
            </div>
            <Button type="button" variant="outline" className="mt-3 w-full" onClick={() => openCheckout(selectedPlan)}>Assinar agora</Button>
          </div>
        )}
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Criar conta</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="mt-4">
            {tab === "reset" ? (
              <form onSubmit={handleReset} className="space-y-3">
                <div className="space-y-1.5"><Label htmlFor="r-email">E-mail</Label><Input id="r-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <Button className="w-full" disabled={loading}>Enviar link</Button>
                <button type="button" onClick={() => setTab("login")} className="w-full text-xs text-muted-foreground hover:text-foreground">Voltar</button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="space-y-1.5"><Label htmlFor="l-email">E-mail</Label><Input id="l-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div className="space-y-1.5"><Label htmlFor="l-pw">Senha</Label><Input id="l-pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                <Button className="w-full" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</Button>
                <button type="button" onClick={() => setTab("reset")} className="w-full text-xs text-muted-foreground hover:text-foreground">Esqueci minha senha</button>
              </form>
            )}
          </TabsContent>
          <TabsContent value="signup" className="mt-4">
            <form onSubmit={handleSignup} className="space-y-3">
              <div className="space-y-1.5"><Label htmlFor="s-name">Nome</Label><Input id="s-name" required value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="space-y-1.5"><Label htmlFor="s-email">E-mail</Label><Input id="s-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div className="space-y-1.5"><Label htmlFor="s-pw">Senha</Label><Input id="s-pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <Button className="w-full" disabled={loading}>{loading ? "Criando..." : "Criar conta e assinar"}</Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">Ao continuar, voce concorda com nossos termos de uso. <Link to="/" className="underline">Voltar</Link></p>
    </div>
  );
}
