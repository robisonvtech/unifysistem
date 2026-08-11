import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UnifyMascot } from "@/components/UnifyMascot";
import { toast } from "sonner";
import { checkAccess, SUPPORT_WHATSAPP } from "@/lib/access";
import { MessageCircle, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar — Unify RepairAI" },
      { name: "description", content: "Acesse o Unify RepairAI e diagnostique celulares com a IA Unify." },
      { property: "og:title", content: "Entrar — Unify RepairAI" },
      { property: "og:description", content: "Plataforma de assistência técnica com IA para técnicos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      return toast.error("E-mail ou senha inválidos.");
    }
    const access = await checkAccess(data.user.id);
    if (!access.ok) {
      await supabase.auth.signOut();
      setLoading(false);
      return toast.error(access.message);
    }
    setLoading(false);
    toast.success("Bem-vindo de volta!");
    navigate({ to: "/dashboard" });
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
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/15 blur-[110px]"
      />

      <div className="relative mb-8 flex flex-col items-center text-center">
        <UnifyMascot size={92} state="idle" />
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
          Unify <span className="text-primary">RepairAI</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Assistente inteligente para técnicos</p>
      </div>

      <div className="relative w-full max-w-sm rounded-3xl border border-border/60 bg-card p-6 shadow-xl">
        {mode === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="l-email">E-mail</Label>
              <Input id="l-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="l-pw">Senha</Label>
              <Input id="l-pw" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button className="h-11 w-full rounded-xl gradient-primary text-primary-foreground" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
            <button
              type="button"
              onClick={() => setMode("reset")}
              className="w-full text-xs text-muted-foreground transition hover:text-foreground"
            >
              Esqueci minha senha
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="r-email">E-mail</Label>
              <Input id="r-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button className="h-11 w-full rounded-xl gradient-primary text-primary-foreground" disabled={loading}>
              {loading ? "Enviando..." : "Enviar link de recuperação"}
            </Button>
            <button
              type="button"
              onClick={() => setMode("login")}
              className="w-full text-xs text-muted-foreground transition hover:text-foreground"
            >
              Voltar para o login
            </button>
          </form>
        )}
      </div>

      <div className="relative mt-5 w-full max-w-sm rounded-3xl border border-dashed border-border p-5 text-center">
        <ShieldCheck className="mx-auto h-5 w-5 text-primary" />
        <p className="mt-2 text-sm font-semibold">Ainda não tem acesso?</p>
        <p className="mt-1 text-xs text-muted-foreground">
          As contas são liberadas manualmente. Envie uma mensagem para o nosso desenvolvedor e solicite o seu acesso.
        </p>
        <Button asChild className="mt-3 h-11 w-full rounded-xl gradient-primary text-primary-foreground">
          <a href={SUPPORT_WHATSAPP} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="mr-2 h-4 w-4" /> Solicitar acesso no WhatsApp
          </a>
        </Button>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Ao continuar, você concorda com os termos de uso. <Link to="/" className="underline">Início</Link>
      </p>
    </div>
  );
}
