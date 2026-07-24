import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Package, Wallet, GraduationCap, BookOpen, History } from "lucide-react";

export const Route = createFileRoute("/_authenticated/more")({
  head: () => ({
    meta: [
      { title: "Mais — RepairAI" },
      { name: "description", content: "Acesse clientes, estoque, financeiro, cursos e mais." },
    ],
  }),
  component: MorePage,
});

const links = [
  { to: "/customers", label: "Clientes", desc: "Cadastro e histórico", icon: Users, color: "text-blue-600" },
  { to: "/inventory", label: "Estoque", desc: "Peças e movimentações", icon: Package, color: "text-orange-600" },
  { to: "/finance", label: "Financeiro", desc: "A receber, a pagar e caixa", icon: Wallet, color: "text-emerald-600" },
  { to: "/history", label: "Histórico IA", desc: "Conversas anteriores", icon: History, color: "text-slate-600" },
  { to: "/knowledge", label: "Base de conhecimento", desc: "Guias da comunidade", icon: BookOpen, color: "text-violet-600" },
  { to: "/courses", label: "Cursos", desc: "Treinamentos Pro", icon: GraduationCap, color: "text-primary" },
] as const;

function MorePage() {
  return (
    <div className="px-4 py-4">
      <header className="mb-4">
        <h1 className="text-lg font-bold">Mais</h1>
        <p className="text-xs text-muted-foreground">Ferramentas complementares da sua assistência.</p>
      </header>
      <div className="grid grid-cols-2 gap-2">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="rounded-xl border border-border bg-card p-3 transition hover:border-primary/40"
          >
            <l.icon className={`h-5 w-5 ${l.color}`} />
            <div className="mt-2 text-sm font-semibold">{l.label}</div>
            <div className="text-[11px] text-muted-foreground">{l.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
