import { Link } from "@tanstack/react-router";
import { UnifyMascot } from "@/components/UnifyMascot";
import {
  Stethoscope,
  DollarSign,
  BookOpen,
  Cpu,
  Smartphone,
  Zap,
  Bell,
  Search,
  ArrowRight,
  ClipboardList,
  Wrench,
  CheckCircle2,
  TrendingUp,
  Lightbulb,
  ChevronDown,
} from "lucide-react";
import { usePlan } from "@/context/PlanContext";

export function StartDashboard() {
  const { setShowAdminPanel } = usePlan();

  const actions = [
    {
      title: "Diagnosticar",
      desc: "Descreva o defeito e receba o diagnóstico",
      icon: Stethoscope,
      to: "/chat?prompt=Diagnosticar",
    },
    {
      title: "Avaliar aparelho",
      desc: "Saiba se vale a pena comprar ou revender",
      icon: DollarSign,
      to: "/chat?prompt=Avaliar",
    },
    {
      title: "Guia de reparo",
      desc: "Passo a passo completo para o reparo",
      icon: BookOpen,
      to: "/knowledge",
    },
    {
      title: "Diagnóstico de placa",
      desc: "Esquemas, pontos e medições",
      icon: Cpu,
      to: "/chat?prompt=Placa",
    },
    {
      title: "Consultar IMEI",
      desc: "Verifique informações do aparelho",
      icon: Smartphone,
      to: "/orders/new",
    },
    {
      title: "Problemas de carga",
      desc: "Soluções para falhas de carregamento",
      icon: Zap,
      to: "/chat?prompt=Carga",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] pb-24 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <UnifyMascot size={32} state="idle" variant="start" />
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-[#BF0000]">Unify</span>
            <span className="text-xs font-semibold text-gray-900 -mt-1">RepairAI</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Admin Switcher trigger */}
          <button
            onClick={() => setShowAdminPanel(true)}
            className="rounded-full bg-red-50 border border-red-200 px-2.5 py-1 text-[11px] font-bold text-[#BF0000] hover:bg-red-100 transition"
          >
            START
          </button>

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
            className="h-8 w-8 rounded-full border border-gray-200 object-cover"
          />
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pt-5 space-y-6">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-1.5">
            Bom dia, Robison <span className="animate-bounce inline-block">👋</span>
          </h1>
          <p className="text-sm text-gray-500 font-medium">Como posso ajudar hoje?</p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar função..."
            className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 shadow-sm transition focus:border-[#BF0000] focus:outline-none focus:ring-1 focus:ring-[#BF0000]"
          />
        </div>

        {/* 2-Column Action Cards Grid */}
        <div className="grid grid-cols-2 gap-3">
          {actions.map((act) => (
            <Link
              key={act.title}
              to={act.to}
              className="group flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md"
            >
              <div>
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-[#BF0000] group-hover:bg-[#BF0000] group-hover:text-white transition">
                  <act.icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#BF0000] transition">
                  {act.title}
                </h3>
                <p className="mt-1 text-[11px] leading-tight text-gray-500 font-normal">
                  {act.desc}
                </p>
              </div>
              <div className="mt-3 flex justify-end">
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:translate-x-1 group-hover:text-[#BF0000] transition" />
              </div>
            </Link>
          ))}
        </div>

        {/* Banner Card — Dica do Dia */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm flex items-center justify-between">
          <div className="max-w-[70%] space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#BF0000]">
              <Lightbulb className="h-4 w-4" />
              <span>Dica do dia</span>
            </div>
            <p className="text-xs text-gray-600 leading-snug">
              Mantenha sempre suas ferramentas organizadas e seu ambiente limpo.
            </p>
          </div>
          <div className="relative shrink-0">
            <UnifyMascot size={64} state="idle" variant="start" />
          </div>
        </div>

        {/* Summary Metric Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Resumo do dia</h2>
            <button className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-600">
              Hoje <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="rounded-2xl border border-gray-100 bg-white p-2.5 shadow-sm text-center">
              <span className="text-[10px] font-medium text-gray-500">OS abertas</span>
              <div className="mt-1 text-base font-extrabold text-gray-900">12</div>
              <div className="mt-1 flex justify-center">
                <ClipboardList className="h-3.5 w-3.5 text-red-500" />
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-2.5 shadow-sm text-center">
              <span className="text-[10px] font-medium text-gray-500">Em reparo</span>
              <div className="mt-1 text-base font-extrabold text-gray-900">4</div>
              <div className="mt-1 flex justify-center">
                <Wrench className="h-3.5 w-3.5 text-orange-500" />
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-2.5 shadow-sm text-center">
              <span className="text-[10px] font-medium text-gray-500">Finalizadas</span>
              <div className="mt-1 text-base font-extrabold text-gray-900">81</div>
              <div className="mt-1 flex justify-center">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-2.5 shadow-sm text-center">
              <span className="text-[10px] font-medium text-gray-500">Receita</span>
              <div className="mt-1 text-xs font-extrabold text-gray-900 truncate">R$ 4.250</div>
              <div className="mt-1 flex justify-center">
                <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
