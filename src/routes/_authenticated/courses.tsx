import { createFileRoute } from "@tanstack/react-router";
import { GraduationCap, Lock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/courses")({
  head: () => ({
    meta: [
      { title: "Cursos — RepairAI" },
      { name: "description", content: "Do básico à microsolda: cursos profissionais de reparo de celulares." },
      { property: "og:title", content: "Cursos — RepairAI" },
      { property: "og:description", content: "Aprenda reparo, microsolda, Face ID, diagnóstico e mais." },
    ],
  }),
  component: CoursesPage,
});

const COURSES = [
  { title: "Fundamentos do reparo", level: "Iniciante", lessons: 12, duration: "3h" },
  { title: "Diagnóstico com multímetro", level: "Iniciante", lessons: 8, duration: "2h" },
  { title: "Reparo de iPhone completo", level: "Intermediário", lessons: 24, duration: "8h" },
  { title: "Reparo Android completo", level: "Intermediário", lessons: 22, duration: "7h" },
  { title: "Microsolda BGA/Reballing", level: "Avançado", lessons: 18, duration: "9h" },
  { title: "Reparo de placa lógica", level: "Avançado", lessons: 30, duration: "12h" },
  { title: "Face ID e True Depth", level: "Avançado", lessons: 14, duration: "5h" },
  { title: "Leitura de esquemas", level: "Intermediário", lessons: 16, duration: "6h" },
  { title: "Osciloscópio & fonte", level: "Avançado", lessons: 10, duration: "4h" },
  { title: "Recuperação de dados", level: "Avançado", lessons: 12, duration: "4h" },
  { title: "Gestão de assistência técnica", level: "Iniciante", lessons: 10, duration: "3h" },
];

const FEATURES = [
  "Acesso a todos os cursos e módulos",
  "Aulas em vídeo em HD",
  "Downloads de PDF e esquemas",
  "Certificados de conclusão",
  "Novos cursos toda semana",
  "Uso ilimitado da IA Unify",
];

function CoursesPage() {
  return (
    <div className="px-4 py-4">
      <header className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Cursos</h1>
          <p className="text-xs text-muted-foreground">Do básico à microsolda.</p>
        </div>
      </header>

      {/* Subscription CTA */}
      <div className="mb-5 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary to-[color:var(--primary-glow)] p-5 text-primary-foreground shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <Badge className="mb-2 bg-white/20 text-white hover:bg-white/20">Pro Mensal</Badge>
            <h2 className="text-xl font-bold leading-tight">Acesso total à plataforma</h2>
            <p className="mt-1 text-sm text-white/80">R$ 49,90/mês · cancele quando quiser</p>
          </div>
        </div>
        <ul className="mt-4 space-y-1.5 text-sm">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0" /> {f}
            </li>
          ))}
        </ul>
        <Button
          variant="secondary"
          className="mt-4 w-full bg-white text-primary hover:bg-white/90"
          onClick={() => toast.info("Assinatura em breve — vamos avisá-lo por e-mail.")}
        >
          Assinar Pro
        </Button>
      </div>

      <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Catálogo</h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {COURSES.map((c) => (
          <div key={c.title} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className="text-sm font-semibold leading-snug">{c.title}</h4>
                <p className="mt-0.5 text-xs text-muted-foreground">{c.lessons} aulas · {c.duration}</p>
              </div>
              <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
            <Badge variant="outline" className="mt-2 text-[10px]">{c.level}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
