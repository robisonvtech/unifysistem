import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UnifyMascot } from "@/components/UnifyMascot";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Redefinir senha — RepairAI" },
      { name: "description", content: "Defina uma nova senha para sua conta RepairAI." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Senha atualizada!");
    navigate({ to: "/chat" });
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <UnifyMascot size={72} />
      <form onSubmit={submit} className="mt-6 w-full max-w-sm space-y-3 rounded-2xl border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Nova senha</h1>
        <div className="space-y-1.5">
          <Label htmlFor="np">Senha</Label>
          <Input id="np" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button className="w-full" disabled={loading}>Atualizar</Button>
      </form>
    </div>
  );
}
