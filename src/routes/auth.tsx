import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UnifyMascot } from "@/components/UnifyMascot";
import { toast } from "sonner";

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
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) navigate({ to: "/chat" });
    });
  }, [navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Bem-vindo!");
    navigate({ to: "/chat" });
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: name },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (data.session) {
      toast.success("Conta criada. Bem-vindo!");
      navigate({ to: "/chat" });
      return;
    }
    toast.success("Conta criada! Confirme o e-mail para entrar.");
    setTab("login");
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("E-mail de redefinição enviado.");
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-10">
      {/* ambient brand glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/20 blur-[100px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 right-[-10%] h-72 w-72 rounded-full bg-primary/10 blur-[110px]"
      />

      <div className="relative mb-7 flex flex-col items-center gap-1 text-center">
        <UnifyMascot size={96} state="idle" />
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
          Repair<span className="text-primary">AI</span>
        </h1>
        <p className="text-sm text-muted-foreground">Assistente Unify para técnicos</p>
      </div>

      <div className="relative w-full max-w-sm rounded-3xl border border-border/60 bg-card/80 p-6 shadow-xl backdrop-blur-xl">
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
              <Button className="w-full" disabled={loading}>{loading ? "Criando..." : "Criar conta grátis"}</Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">Ao continuar, você concorda com nossos termos de uso. <Link to="/" className="underline">Voltar</Link></p>
    </div>
  );
}
