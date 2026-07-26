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
  ArrowRight,
  ClipboardList,
  Clock,
  ChevronRight,
  Bell,
} from "lucide-react";
import { usePlan } from "@/context/PlanContext";

export function ProDashboard() {
  const { setShowAdminPanel } = usePlan();

  const proCards = [
    {
      title: "Diagnóstico Inteligente",
      desc: "Descreva o defeito e receba o diagnóstico com IA",
      icon: Stethoscope,
      iconColor: "text-red-500 bg-red-50",
      badge: "★ IA",
      badgeClass: "bg-[#BF0000] text-white",
      to: "/chat?prompt=Diagnosticar",
    },
    {
      title: "Avaliar Compra",
      desc: "Análise completa para comprar sem riscos",
      icon: ShoppingCart,
      iconColor: "text-amber-500 bg-amber-50",
      badge: null,
      to: "/chat?prompt=Avaliar",
    },
    {
      title: "IA Especialista",
      desc: "Chat inteligente com IA treinada para assistência técnica",
      icon: Brain,
      iconColor: "text-purple-500 bg-purple-50",
      badge: "PRO",
      badgeClass: "bg-purple-600 text-white",
      to: "/chat",
    },
    {
      title: "Diagnóstico de Placa",
      desc: "Esquemas, pontos de teste e medições",
      icon: Cpu,
      iconColor: "text-blue-500 bg-blue-50",
      badge: "PRO",
      badgeClass: "bg-blue-600 text-white",
      to: "/chat?prompt=Placa",
    },
    {
      title: "Cursos Premium",
      desc: "Aprenda com os melhores técnicos",
      icon: GraduationCap,
      iconColor: "text-emerald-500 bg-emerald-50",
      badge: "PRO",
      badgeClass: "bg-emerald-600 text-white",
      to: "/courses",
    },
    {
      title: "Mercado",
      desc: "Preços, tendências e oportunidades",
      icon: TrendingUp,
      iconColor: "text-orange-500 bg-orange-50",
      badge: null,
      to: "/finance",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] pb-24 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <UnifyMascot size={32} state="idle" variant="pro" />
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold tracking-tight text-[#BF0000]">Unify</span>
            <span className="text-xs font-semibold text-gray-900">RepairAI</span>
          </div>
          {/* Pro Pill Badge */}
          <button
            onClick={() => setShowAdminPanel(true)}
            className="flex items-center gap-1 rounded-full bg-[#BF0000] px-2.5 py-0.5 text-[11px] font-extrabold text-white shadow-sm hover:bg-red-700 transition"
          >
            ★ PRO
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100 transition">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#BF0000] text-[10px] font-bold text-white">
              3
            </span>
          </button>

          {/* User Avatar */}
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
            alt="Robison"
            className="h-8 w-8 rounded-full border-2 border-red-500/40 object-cover"
          />
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pt-4 space-y-5">
        {/* Top Hero Banner with Glowing 3D Mascot */}
        <div className="relative flex items-center justify-between rounded-3xl bg-gradient-to-r from-red-50/60 via-white to-pink-50/40 p-4 border border-red-100/60 shadow-sm">
          <div className="max-w-[65%] space-y-1">
            <h1 className="text-xl font-extrabold tracking-tight text-gray-900 flex items-center gap-1">
              Boa tarde, Robison <span className="animate-bounce">👋</span>
            </h1>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">
              Seu assistente inteligente está pronto para te ajudar!
            </p>
          </div>
          <div className="relative flex items-center justify-center">
            {/* Red Aura Glow */}
            <div className="absolute inset-0 rounded-full bg-red-500/20 blur-xl animate-pulse" />
            <UnifyMascot size={78} state="idle" variant="pro" />
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Pesquisar qualquer problema, modelo, CI..."
            className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-10 pr-10 text-xs text-gray-800 placeholder-gray-400 shadow-sm transition focus:border-[#BF0000] focus:outline-none focus:ring-1 focus:ring-[#BF0000]"
          />
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
          <Sparkles className="absolute right-3.5 top-3.5 h-4 w-4 text-[#BF0000] animate-pulse" />
        </div>

        {/* 2-Column Action Cards */}
        <div className="grid grid-cols-2 gap-3">
          {proCards.map((card) => (
            <Link
              key={card.title}
              to={card.to}
              className="group relative flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md"
            >
              {/* Badge */}
              {card.badge && (
                <span
                  className={`absolute right-2.5 top-2.5 rounded-full px-2 py-0.5 text-[9px] font-extrabold shadow-sm ${card.badgeClass}`}
                >
                  {card.badge}
                </span>
              )}

              <div>
                <div
                  className={`mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl transition ${card.iconColor}`}
                >
                  <card.icon className="h-4 w-4" />
                </div>
                <h3 className="text-xs font-bold text-gray-900 group-hover:text-[#BF0000] transition">
                  {card.title}
                </h3>
                <p className="mt-1 text-[10px] leading-tight text-gray-500 font-normal">
                  {card.desc}
                </p>
              </div>

              <div className="mt-3 flex justify-end">
                <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:translate-x-1 group-hover:text-[#BF0000] transition" />
              </div>
            </Link>
          ))}
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-4 gap-2">
          {/* Receita */}
          <div className="rounded-2xl border border-gray-100 bg-white p-2.5 shadow-sm">
            <span className="text-[9px] font-medium text-gray-400">Receita</span>
            <div className="text-xs font-extrabold text-gray-900">R$ 5.840</div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[8px] font-bold text-red-500">↗ 12% vs mês</span>
            </div>
          </div>

          {/* OS Abertas */}
          <div className="rounded-2xl border border-gray-100 bg-white p-2.5 shadow-sm">
            <span className="text-[9px] font-medium text-gray-400">OS Abertas</span>
            <div className="text-xs font-extrabold text-gray-900">18</div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[8px] font-bold text-emerald-500">↗ 8% vs ontem</span>
              <ClipboardList className="h-3 w-3 text-blue-500" />
            </div>
          </div>

          {/* Precisão IA */}
          <div className="rounded-2xl border border-gray-100 bg-white p-2.5 shadow-sm">
            <span className="text-[9px] font-medium text-gray-400">Precisão da IA</span>
            <div className="text-xs font-extrabold text-gray-900">98%</div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[8px] font-bold text-emerald-500">↗ 5% melhora</span>
              {/* Circular Indicator */}
              <div className="h-3 w-3 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
            </div>
          </div>

          {/* Tempo Médio */}
          <div className="rounded-2xl border border-gray-100 bg-white p-2.5 shadow-sm">
            <span className="text-[9px] font-medium text-gray-400">Tempo Médio</span>
            <div className="text-xs font-extrabold text-gray-900">1,8 dias</div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[8px] font-bold text-purple-500">↘ 0,3 dias</span>
              <Clock className="h-3 w-3 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Últimos Diagnósticos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-gray-900">Últimos diagnósticos</h2>
            <Link to="/history" className="flex items-center text-[11px] font-bold text-[#BF0000] hover:underline">
              Ver todos <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 p-1">
                  <span className="text-lg">📱</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">iPhone 11</h4>
                  <p className="text-[10px] text-gray-400">Tela não liga</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600">
                  Resolvido
                </span>
                <span className="text-[10px] text-gray-400">2h atrás</span>
                <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 p-1">
                  <span className="text-lg">📱</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Samsung A34</h4>
                  <p className="text-[10px] text-gray-400">Não carrega</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600">
                  Resolvido
                </span>
                <span className="text-[10px] text-gray-400">5h atrás</span>
                <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
