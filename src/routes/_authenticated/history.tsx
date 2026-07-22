import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { History as HistoryIcon, ChevronRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { UnifyMascot } from "@/components/UnifyMascot";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "Histórico — RepairAI" },
      { name: "description", content: "Todas as suas análises, diagnósticos e avaliações ficam salvos aqui." },
      { property: "og:title", content: "Histórico — RepairAI" },
      { property: "og:description", content: "Suas conversas anteriores com a Unify." },
    ],
  }),
  component: HistoryPage,
});

interface Conv { id: string; title: string; updated_at: string; }

function HistoryPage() {
  const navigate = useNavigate();
  const [list, setList] = useState<Conv[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("conversations")
      .select("id,title,updated_at")
      .order("updated_at", { ascending: false });
    setLoading(false);
    if (error) return toast.error(error.message);
    setList(data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    const { error } = await supabase.from("conversations").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setList((p) => p.filter((c) => c.id !== id));
    toast.success("Conversa removida.");
  }

  const filtered = list.filter((c) => c.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="px-4 py-4">
      <header className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <HistoryIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Histórico</h1>
          <p className="text-xs text-muted-foreground">Suas conversas com a Unify.</p>
        </div>
      </header>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar..."
        className="mb-3 w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm outline-none focus:border-primary"
      />

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <UnifyMascot size={80} state="idle" />
          <p className="mt-3 text-sm text-muted-foreground">
            {list.length === 0 ? "Nenhuma conversa ainda." : "Nada encontrado."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((c) => (
            <li key={c.id} className="group flex items-center gap-1 rounded-xl border border-border bg-card">
              <button
                onClick={() => navigate({ to: "/chat", search: { c: c.id } })}
                className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(c.updated_at).toLocaleString("pt-BR")}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
              <button
                onClick={() => remove(c.id)}
                className="mr-2 rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label="Remover"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
