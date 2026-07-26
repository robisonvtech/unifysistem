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
    <div className="min-h-screen bg-[#090909] text-white pb-28 font-sans selection:bg-red-600 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-red-950/40 bg-[#090909]/90 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <UnifyMascot size={34} state="elite" variant="elite" />
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold tracking-wider text-red-500 uppercase">Unify</span>
            <span className="text-xs font-semibold text-white">RepairAI</span>
          </div>
          {/* Elite Badge */}
          <button
            onClick={() => setShowAdminPanel(true)}
            className="flex items-center gap-1 rounded-full bg-gradient-to-r from-red-600 to-red-800 px-2.5 py-0.5 text-[10px] font-black tracking-widest text-white shadow-lg shadow-red-900/40 border border-red-500/30 hover:scale-105 transition"
          >
            👑 ELITE
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="relative rounded-full border border-red-900/30 bg-red-950/30 p-2 text-red-400 hover:bg-red-900/40 transition">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-black text-white shadow-md">
              7
            </span>
          </button>

          {/* User Avatar */}
          <div className="relative">
            <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-red-600 to-red-500 blur-sm opacity-75 animate-pulse" />
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
              alt="Robison"
              className="relative h-8 w-8 rounded-full border border-red-500/80 object-cover"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pt-4 space-y-6">
        {/* Top Cyberpunk Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-red-900/50 bg-gradient-to-b from-red-950/40 via-[#0d0909] to-[#090909] p-5 shadow-2xl shadow-red-950/20">
          {/* Grid Background Lines */}
          <div className="absolute inset-0 bg-[radial-gradient(#BF0000_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between">
            <div className="max-w-[62%] space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-red-800/40 bg-red-950/60 px-2.5 py-0.5 text-[10px] font-extrabold text-red-400">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                IA Elite Online
              </span>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                Boa noite, Robison <span className="animate-bounce text-base">👋</span>
              </h1>
              <p className="text-xs text-red-200/60 leading-relaxed font-normal">
                Seu assistente de elite em assistência técnica
              </p>
            </div>

            <div className="relative flex items-center justify-center shrink-0">
              <UnifyMascot size={88} state="elite" variant="elite" />
            </div>
          </div>
        </div>

        {/* Dark Cyberpunk Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Pesquise qualquer problema, modelo, CI, sintoma..."
            className="w-full rounded-2xl border border-red-900/40 bg-[#121011] py-3.5 pl-11 pr-11 text-xs text-white placeholder-gray-500 shadow-inner focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 transition"
          />
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-red-500/80" />
          <Sparkles className="absolute right-3.5 top-3.5 h-4 w-4 text-red-500 animate-pulse" />
        </div>

        {/* 6 Neon Action Circles Grid */}
        <div className="grid grid-cols-6 gap-2">
          {eliteActions.map((act) => (
            <Link
              key={act.title}
              to={act.to}
              className="group flex flex-col items-center gap-1.5 text-center"
            >
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-red-800/40 bg-gradient-to-b from-red-950/60 to-[#120d0e] text-red-500 shadow-md transition-all duration-300 group-hover:scale-110 group-hover:border-red-500 group-hover:shadow-red-600/30">
                <act.icon className="h-5 w-5" />
              </div>
              <span className="text-[9px] font-bold text-gray-300 leading-tight group-hover:text-red-400 transition">
                {act.title}
              </span>
            </Link>
          ))}
        </div>

        {/* Dark Metrics Row */}
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-2xl border border-red-900/30 bg-[#121011] p-3 shadow-md">
            <span className="text-[9px] font-bold text-red-500/80 uppercase tracking-wider">Receita Total</span>
            <div className="mt-1 text-xs font-black text-white">R$ 12.540,80</div>
            <div className="mt-1 text-[8px] font-bold text-red-400">↗ 18.6% vs mês</div>
          </div>

          <div className="rounded-2xl border border-red-900/30 bg-[#121011] p-3 shadow-md">
            <span className="text-[9px] font-bold text-red-500/80 uppercase tracking-wider">OS Abertas</span>
            <div className="mt-1 text-xs font-black text-white">24</div>
            <div className="mt-1 text-[8px] font-bold text-emerald-400">↗ 14% vs ontem</div>
          </div>

          <div className="rounded-2xl border border-red-900/30 bg-[#121011] p-3 shadow-md">
            <span className="text-[9px] font-bold text-red-500/80 uppercase tracking-wider">Precisão IA</span>
            <div className="mt-1 text-xs font-black text-white">99%</div>
            <div className="mt-1 text-[8px] font-bold text-emerald-400">↗ 7% melhora</div>
          </div>

          <div className="rounded-2xl border border-red-900/30 bg-[#121011] p-3 shadow-md">
            <span className="text-[9px] font-bold text-red-500/80 uppercase tracking-wider">Tempo Médio</span>
            <div className="mt-1 text-xs font-black text-white">1,2 dias</div>
            <div className="mt-1 text-[8px] font-bold text-purple-400">↘ 0.3 dias</div>
          </div>
        </div>

        {/* 👑 Recursos Elite Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold text-white flex items-center gap-1.5">
              <Crown className="h-4 w-4 text-red-500" />
              <span>Recursos Elite</span>
            </h2>
            <button className="text-[10px] font-bold text-red-400 hover:underline">
              Todos os recursos &gt;
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {eliteFeatures.map((feat) => (
              <div
                key={feat.title}
                className="group flex items-center gap-3 rounded-2xl border border-red-900/30 bg-[#121011] p-3 transition hover:border-red-600/60 hover:bg-red-950/20"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-900/50 bg-red-950/40 text-red-500 group-hover:bg-red-600 group-hover:text-white transition">
                  <feat.icon className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-red-400 transition">
                    {feat.title}
                  </h4>
                  <p className="text-[9px] text-gray-400 leading-tight">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Split Section: Recent Diagnoses & Elite Voice Assistant */}
        <div className="grid grid-cols-2 gap-3">
          {/* Últimos diagnósticos */}
          <div className="rounded-2xl border border-red-900/30 bg-[#121011] p-3.5 space-y-2.5">
            <h3 className="text-xs font-bold text-white">Últimos diagnósticos</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-200">iPhone 14 Pro Max</p>
                  <p className="text-[9px] text-gray-500">Não carrega</p>
                </div>
                <span className="rounded-full bg-emerald-950 border border-emerald-800 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                  Resolvido
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-200">Samsung S23 Ultra</p>
                  <p className="text-[9px] text-gray-500">Tela não liga</p>
                </div>
                <span className="rounded-full bg-amber-950 border border-amber-800 px-2 py-0.5 text-[9px] font-bold text-amber-400">
                  Em andamento
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-200">iPhone 11</p>
                  <p className="text-[9px] text-gray-500">Reinicia sozinho</p>
                </div>
                <span className="rounded-full bg-emerald-950 border border-emerald-800 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                  Resolvido
                </span>
              </div>
            </div>
          </div>

          {/* Assistente Elite Voice Card */}
          <Link
            to="/chat"
            className="group relative flex flex-col items-center justify-between rounded-2xl border border-red-800/50 bg-gradient-to-b from-red-950/40 to-[#120d0e] p-3.5 text-center shadow-lg hover:border-red-500 transition"
          >
            <div className="w-full flex items-center justify-between text-[10px]">
              <span className="font-bold text-red-400">Assistente Elite</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>

            {/* Voice Waveform animation */}
            <div className="my-3 flex items-center gap-1">
              {[12, 24, 18, 30, 20, 28, 14].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-red-500/80 rounded-full animate-pulse"
                  style={{ height: `${h}px`, animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>

            {/* Mic Button */}
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-red-600/50 blur-md group-hover:blur-lg transition" />
              <button className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white shadow-xl">
                <Mic className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-2 text-[10px] font-bold text-gray-300">
              Fale com a IA
              <p className="text-[8px] font-normal text-gray-500">Toque para falar com o assistente</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
