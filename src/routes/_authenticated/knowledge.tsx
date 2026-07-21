import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { UnifyMascot } from "@/components/UnifyMascot";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/knowledge")({
  head: () => ({
    meta: [
      { title: "Base de conhecimento — RepairAI" },
      { name: "description", content: "Compartilhe soluções, guias e esquemas. A comunidade treina a IA Unify." },
      { property: "og:title", content: "Base de conhecimento — RepairAI" },
      { property: "og:description", content: "Contribua com soluções de reparo revisadas por administradores." },
    ],
  }),
  component: KnowledgePage,
});

interface Post {
  id: string;
  title: string;
  body: string;
  category: string | null;
  status: string;
  created_at: string;
  author_id: string;
}

function KnowledgePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", category: "" });
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("knowledge_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setLoading(false);
    if (error) return toast.error(error.message);
    setPosts(data ?? []);
  }

  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    setSubmitting(true);
    const { data: user } = await supabase.auth.getUser();
    const { error } = await supabase.from("knowledge_posts").insert({
      author_id: user.user!.id,
      title: form.title.trim(),
      body: form.body.trim(),
      category: form.category.trim() || null,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Enviado para revisão. Obrigado por contribuir!");
    setOpen(false);
    setForm({ title: "", body: "", category: "" });
    load();
  }

  return (
    <div className="px-4 py-4">
      <header className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <BookOpen className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Base de conhecimento</h1>
          <p className="text-xs text-muted-foreground">Soluções da comunidade revisadas pela equipe.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1 h-4 w-4" />Contribuir</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova contribuição</DialogTitle></DialogHeader>
            <form onSubmit={create} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="k-title">Título</Label>
                <Input id="k-title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="k-cat">Categoria (opcional)</Label>
                <Input id="k-cat" placeholder="ex.: iPhone 11, Carga, Placa" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="k-body">Solução / Guia</Label>
                <Textarea id="k-body" required rows={6} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
              </div>
              <Button className="w-full" disabled={submitting}>{submitting ? "Enviando..." : "Enviar para revisão"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {loading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <UnifyMascot size={80} state="learning" />
          <p className="mt-3 text-sm text-muted-foreground">Nenhum artigo ainda. Seja o primeiro a contribuir.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <article key={p.id} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-1 flex items-center gap-2">
                <h2 className="flex-1 text-sm font-semibold">{p.title}</h2>
                {p.status !== "approved" && (
                  <Badge variant="outline" className="text-[10px]">{p.status === "pending" ? "Em revisão" : "Rejeitado"}</Badge>
                )}
              </div>
              {p.category && <p className="mb-1 text-xs text-primary">{p.category}</p>}
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{p.body.slice(0, 300)}{p.body.length > 300 ? "..." : ""}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
