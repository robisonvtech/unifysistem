import { Link } from "@tanstack/react-router";
import { UnifyMascot } from "@/components/UnifyMascot";
import {
  Stethoscope,
  ShoppingCart,
  Brain,
  Cpu,
  GraduationCap,
  TrendingUp,
  Search,
  Sparkles,
  Bell,
  ChevronRight,
  Mic,
  Activity,
  Layers,
  FileCode,
  Radio,
  SlidersHorizontal,
  Terminal,
  Database,
  Zap,
  Headphones,
  Crown,
} from "lucide-react";
import { usePlan } from "@/context/PlanContext";

export function EliteDashboard() {
  const { setShowAdminPanel } = usePlan();

  const eliteActions = [
    { title: "Diagnóstico Inteligente", icon: Stethoscope, to: "/chat?prompt=Diagnosticar" },
    { title: "Avaliar Compra", icon: ShoppingCart, to: "/chat?prompt=Avaliar" },
    { title: "IA Especialista", icon: Brain, to: "/chat" },
    { title: "Diagnóstico de Placa", icon: Cpu, to: "/chat?prompt=Placa" },
    { title: "Cursos Premium", icon: GraduationCap, to: "/courses" },
    { title: "Relatórios Avançados", icon: TrendingUp, to: "/finance" },
  ];

  const eliteFeatures = [
    { title: "Repair Twin", desc: "Gêmeo digital do aparelho", icon: Layers },
    { title: "BoardView", desc: "Esquemas e BoardViews", icon: FileCode },
    { title: "Osciloscópio", desc: "Medições avançadas", icon: Radio },
    { title: "Simulador", desc: "Ambiente de testes", icon: SlidersHorizontal },
    { title: "Comandos IA", desc: "Agentes especializados", icon: Terminal },
    { title: "Base de Casos", desc: "+1.200.000 casos resolvidos", icon: Database },
    { title: "Análise de Curto", desc: "Detecção inteligente", icon: Zap },
    { title: "Modo Copiloto", desc: "IA guiando seu reparo em tempo real", icon: Headphones },
  ];

  return (
    <div className="min-h-screen bg-[#080608] text-white pb-28 font-sans selection:bg-red-600 selection:text-white">
      <header className="sticky top-0 z-30 border-b border-red-950/30 bg-[#080608]/95 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <UnifyMascot size={36} state="elite" variant="elite" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-red-400">Painel Elite</p>
              <p className="text-sm font-semibold text-white/90">Unify RepairAI</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-full border border-red-800/50 bg-red-950/40 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-200 transition hover:bg-red-900/60">
              <Bell className="h-4 w-4" />
              Atualizações
            </button>
            <button
              onClick={() => setShowAdminPanel(true)}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-red-600 to-red-800 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-red-900/40 transition hover:scale-105"
            >
              👑 ELITE
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-6 pb-10 space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-red-900/40 bg-gradient-to-br from-[#0f0c0d] via-[#130f11] to-[#090707] p-6 shadow-[0_0_120px_-40px_rgba(204,18,18,0.25)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,82,82,0.16),transparent_35%)] opacity-80" />
          <div className="pointer-events-none absolute inset-y-0 right-16 h-[420px] w-px bg-red-500/15 blur-sm" />
          <div className="relative grid gap-6 lg:grid-cols-[1.8fr_1fr] lg:items-center">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-red-700/60 bg-red-950/50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.34em] text-red-300">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                Operando em modo elite
              </span>

              <div className="space-y-3">
                <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl">
                  Interface de gestão e diagnósticos para quem entrega o melhor resultado.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-red-200/80 sm:text-base">
                  Sua central de reparos com insights instantâneos, métricas avançadas e acesso a recursos exclusivos. Tudo pronto para acelerar sua oficina.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button className="rounded-2xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-red-900/20 transition hover:bg-red-500">
                  Abrir Assistente Elite
                </button>
                <button className="rounded-2xl border border-red-700/60 bg-white/5 px-6 py-3 text-sm font-semibold text-red-200 transition hover:border-red-500/90">
                  Ver relatórios premium
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.5rem] border border-red-900/40 bg-[#110f10]/95 p-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-red-400">Precisão</p>
                  <p className="mt-3 text-2xl font-black text-white">99,8%</p>
                  <p className="mt-2 text-xs text-red-300">de acerto nos diagnósticos IA</p>
                </div>
                <div className="rounded-[1.5rem] border border-red-900/40 bg-[#110f10]/95 p-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-red-400">Velocidade</p>
                  <p className="mt-3 text-2xl font-black text-white">3,2s</p>
                  <p className="mt-2 text-xs text-red-300">média de resposta do assistente</p>
                </div>
                <div className="rounded-[1.5rem] border border-red-900/40 bg-[#110f10]/95 p-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-red-400">Base</p>
                  <p className="mt-3 text-2xl font-black text-white">1,2M</p>
                  <p className="mt-2 text-xs text-red-300">casos históricos disponíveis</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] border border-red-900/40 bg-[#120d0e]/90 p-5 shadow-[0_25px_80px_-40px_rgba(255,0,0,0.35)]">
              <div className="absolute -top-8 right-4 h-24 w-24 rounded-full bg-red-500/10 blur-3xl" />
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-red-400">Sistema</p>
                  <p className="mt-2 text-3xl font-black text-white">Operação ao vivo</p>
                </div>
                <div className="grid place-items-center rounded-3xl bg-red-500/10 p-3 text-red-300">
                  <Sparkles className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="grid gap-3">
                  <div className="rounded-3xl border border-red-900/40 bg-[#110f10] p-4">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-red-400">
                      <span>AI especialista</span>
                      <span className="text-red-200">Ativo</span>
                    </div>
                    <p className="mt-3 text-sm font-bold text-white">Diagnósticos, planos de ação e cálculos inteligentes prontos para sua oficina.</p>
                  </div>
                  <div className="rounded-3xl border border-red-900/40 bg-[#110f10] p-4">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-red-400">
                      <span>Fluxo</span>
                      <span className="text-red-200">Automatizado</span>
                    </div>
                    <p className="mt-3 text-sm font-bold text-white">Acompanhe cada OS com histórico visual, alertas e status inteligente.</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl bg-[#120d0e] p-4 text-sm">
                    <p className="text-[10px] uppercase tracking-[0.26em] text-red-400">Conversão</p>
                    <p className="mt-3 text-2xl font-black text-white">+42%</p>
                    <p className="mt-2 text-xs text-red-300">taxa de aprovação em propostas</p>
                  </div>
                  <div className="rounded-3xl bg-[#120d0e] p-4 text-sm">
                    <p className="text-[10px] uppercase tracking-[0.26em] text-red-400">Confiança</p>
                    <p className="mt-3 text-2xl font-black text-white">Certificada</p>
                    <p className="mt-2 text-xs text-red-300">dados seguros e controle total de acesso</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <div className="space-y-4 rounded-[2rem] border border-red-900/40 bg-[#090808]/90 p-6 shadow-[0_20px_60px_-30px_rgba(255,0,40,0.25)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.34em] text-red-400">Atalhos da Elite</p>
                <h2 className="mt-2 text-2xl font-black text-white">Ações rápidas</h2>
              </div>
              <button className="rounded-full border border-red-700/70 bg-red-950/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-red-300 transition hover:border-red-500/90">
                Ver todos
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {eliteActions.map((act) => (
                <Link
                  key={act.title}
                  to={act.to}
                  className="group flex flex-col items-center gap-2 rounded-3xl border border-red-900/40 bg-[#110f10] p-4 text-center transition hover:border-red-500/60 hover:bg-red-950/40"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-3xl border border-red-800/50 bg-red-950/30 text-red-400 transition group-hover:text-white">
                    <act.icon className="h-6 w-6" />
                  </div>
                  <p className="text-[11px] font-bold text-gray-200 group-hover:text-white">{act.title}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-red-900/40 bg-[#0f0c0d]/90 p-6 shadow-[0_20px_60px_-30px_rgba(255,0,0,0.18)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-red-400">Recursos principais</p>
                <h2 className="mt-2 text-xl font-black text-white">Painel de poder</h2>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full border border-red-700/50 bg-red-950/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-red-200">
                <Activity className="h-4 w-4" /> Online
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {eliteFeatures.slice(0, 4).map((feat) => (
                <div key={feat.title} className="flex items-center gap-3 rounded-3xl border border-red-900/40 bg-[#110f10] p-4 transition hover:border-red-500/60">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-red-800/50 bg-red-950/30 text-red-400 transition group-hover:text-white">
                    <feat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{feat.title}</p>
                    <p className="mt-1 text-[11px] text-red-300">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-red-900/40 bg-[#121011] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-red-400">Últimos diagnósticos</p>
                <h3 className="mt-2 text-lg font-black text-white">Casos recentes</h3>
              </div>
              <button className="rounded-full border border-red-700/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-red-300 transition hover:border-red-500/90">
                Histórico
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {[
                { device: "iPhone 14 Pro Max", issue: "Não carrega", status: "Resolvido", tone: "emerald" },
                { device: "Samsung S23 Ultra", issue: "Tela não liga", status: "Em andamento", tone: "amber" },
                { device: "iPhone 11", issue: "Reinicia sozinho", status: "Resolvido", tone: "emerald" },
              ].map((item) => (
                <div key={item.device} className="rounded-3xl border border-red-900/20 bg-[#0f0d0e] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-white">{item.device}</p>
                      <p className="text-[11px] text-red-300">{item.issue}</p>
                    </div>
                    <span className={
                      `rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ` +
                      (item.tone === "emerald"
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                        : "bg-amber-950 text-amber-300 border border-amber-800")
                    }>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/chat"
            className="group rounded-[2rem] border border-red-900/40 bg-gradient-to-b from-red-950/30 to-[#120d0e] p-6 text-center transition hover:border-red-500/60 hover:shadow-[0_25px_60px_-30px_rgba(255,0,0,0.45)]"
          >
            <div className="flex items-center justify-center gap-2 text-red-400">
              <Mic className="h-5 w-5" />
              <span className="text-xs uppercase tracking-[0.3em]">Assistente Elite</span>
            </div>
            <h3 className="mt-6 text-2xl font-black text-white">Fale com a IA</h3>
            <p className="mt-3 text-sm leading-6 text-red-300">
              Abra o fluxo de voz instantâneo para resolver casos e criar laudos com ajuda do nosso copiloto.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-red-700/70 bg-red-950/60 px-4 py-3 text-sm font-semibold text-red-200 transition group-hover:bg-red-900/70">
              Iniciar agora <ChevronRight className="h-4 w-4" />
            </div>
          </Link>
        </section>
      </main>
    </div>
  );
}
