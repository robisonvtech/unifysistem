import React, { useState } from "react";
import { usePlan, PlanType } from "@/context/PlanContext";
import { UnifyMascot, UnifyState } from "@/components/UnifyMascot";
import {
  X,
  Crown,
  Sparkles,
  Zap,
  Sliders,
  Users,
  Bell,
  BookOpen,
  Cpu,
  Layers,
  CheckCircle2,
  DollarSign,
  Plus,
  Trash2,
  Save,
} from "lucide-react";
import { toast } from "sonner";

export function AdminControlPanel() {
  const {
    plan,
    setPlan,
    showAdminPanel,
    setShowAdminPanel,
    activeMascotState,
    setActiveMascotState,
  } = usePlan();

  const [activeTab, setActiveTab] = useState<"plans" | "mascot" | "features" | "content" | "users">("plans");
  const [startPrice, setStartPrice] = useState("0");
  const [proPrice, setProPrice] = useState("49.90");
  const [elitePrice, setElitePrice] = useState("99.90");
  const [notificationText, setNotificationText] = useState("");
  // users management
  const [users, setUsers] = useState<Array<any>>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("failed");
      const json = await res.json();
      setUsers(json.users ?? []);
    } catch (err) {
      toast.error("Não foi possível buscar usuários");
    } finally {
      setLoadingUsers(false);
    }
  };

  const createTestUser = async () => {
    if (!newUserEmail || !newUserPassword) return toast.error("Email e senha são obrigatórios");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: newUserEmail, password: newUserPassword, display_name: newUserName, role: newUserRole }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "create_failed");
      }
      toast.success("Usuário criado");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserName("");
      setNewUserRole(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(`Erro: ${err?.message ?? err}`);
    }
  };

  const toggleBlock = async (u: any) => {
    try {
      const blocked = u.subscription_status === "inactive";
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subscription_status: blocked ? "free" : "inactive" }),
      });
      if (!res.ok) throw new Error("failed");
      toast.success(blocked ? "Usuário desbloqueado" : "Usuário bloqueado");
      fetchUsers();
    } catch (err) {
      toast.error("Não foi possível atualizar usuário");
    }
  };

  if (!showAdminPanel) return null;

  const mascotStates: UnifyState[] = [
    "idle",
    "thinking",
    "typing",
    "listening",
    "scanning",
    "success",
    "error",
    "learning",
    "sleeping",
    "analyzing",
    "searching",
    "speaking",
    "celebrating",
    "elite",
  ];

  const handleSavePrices = () => {
    toast.success("Preços dos planos atualizados com sucesso!");
  };

  const handleSendNotification = () => {
    if (!notificationText.trim()) return;
    toast.success(`Notificação enviada para todos os usuários: "${notificationText}"`);
    setNotificationText("");
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-up">
      <div className="flex h-full w-full max-w-lg flex-col bg-[#090909] text-white shadow-2xl border-l border-red-900/40">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-red-950/60 p-4 bg-gradient-to-r from-red-950/40 to-[#090909]">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-600/20 text-red-500 border border-red-500/30">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                Painel do Administrador
                <span className="rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-black uppercase text-white">
                  LIVE
                </span>
              </h2>
              <p className="text-[11px] text-gray-400">Controle total de layouts, planos e mascot</p>
            </div>
          </div>
          <button
            onClick={() => setShowAdminPanel(false)}
            className="rounded-full p-2 text-gray-400 hover:bg-red-950/40 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-red-950/40 bg-[#121011] px-4">
          {[
            { id: "plans", label: "Planos & Layouts", icon: Crown },
            { id: "mascot", label: "Mascote Unify", icon: Sparkles },
            { id: "features", label: "Recursos & IA", icon: Zap },
            { id: "users", label: "Usuários", icon: Users },
            { id: "content", label: "Cadastros", icon: Layers },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 border-b-2 py-3 px-3 text-xs font-bold transition ${
                activeTab === tab.id
                  ? "border-red-500 text-red-500"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* TAB 1: PLANS & LAYOUT SWITCHER */}
          {activeTab === "plans" && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Alterar Layout Ativo do Usuário (Troca em Tempo Real)
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {/* START PLAN */}
                  <button
                    onClick={() => {
                      setPlan("start");
                      toast.success("Layout alterado para START (Modo Clean Light)");
                    }}
                    className={`flex flex-col items-center justify-center rounded-2xl border p-3.5 text-center transition ${
                      plan === "start"
                        ? "border-red-500 bg-red-950/40 text-white shadow-lg shadow-red-900/20"
                        : "border-gray-800 bg-[#121011] text-gray-400 hover:border-gray-700"
                    }`}
                  >
                    <span className="text-lg mb-1">⚪</span>
                    <span className="text-xs font-black uppercase">START</span>
                    <span className="text-[9px] text-gray-400">Clean Light</span>
                    {plan === "start" && (
                      <CheckCircle2 className="mt-2 h-4 w-4 text-red-500" />
                    )}
                  </button>

                  {/* PRO PLAN */}
                  <button
                    onClick={() => {
                      setPlan("pro");
                      toast.success("Layout alterado para PRO (Modo Modern Light + 3D)");
                    }}
                    className={`flex flex-col items-center justify-center rounded-2xl border p-3.5 text-center transition ${
                      plan === "pro"
                        ? "border-red-500 bg-red-950/40 text-white shadow-lg shadow-red-900/20"
                        : "border-gray-800 bg-[#121011] text-gray-400 hover:border-gray-700"
                    }`}
                  >
                    <span className="text-lg mb-1">⭐</span>
                    <span className="text-xs font-black uppercase">PRO</span>
                    <span className="text-[9px] text-gray-400">Modern Pro</span>
                    {plan === "pro" && <CheckCircle2 className="mt-2 h-4 w-4 text-red-500" />}
                  </button>

                  {/* ELITE PLAN */}
                  <button
                    onClick={() => {
                      setPlan("elite");
                      toast.success("Layout alterado para ELITE (Modo Cyberpunk Dark Glass)");
                    }}
                    className={`flex flex-col items-center justify-center rounded-2xl border p-3.5 text-center transition ${
                      plan === "elite"
                        ? "border-red-500 bg-red-950/40 text-white shadow-lg shadow-red-900/20"
                        : "border-gray-800 bg-[#121011] text-gray-400 hover:border-gray-700"
                    }`}
                  >
                    <span className="text-lg mb-1">👑</span>
                    <span className="text-xs font-black uppercase">ELITE</span>
                    <span className="text-[9px] text-gray-400">Dark Cyberpunk</span>
                    {plan === "elite" && (
                      <CheckCircle2 className="mt-2 h-4 w-4 text-red-500" />
                    )}
                  </button>
                </div>
              </div>

              {/* Edit Prices */}
              <div className="rounded-2xl border border-red-900/30 bg-[#121011] p-4 space-y-4">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-red-500" />
                  Preços e Mensalidades dos Planos
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-300">Plano START:</span>
                    <input
                      type="text"
                      value={startPrice}
                      onChange={(e) => setStartPrice(e.target.value)}
                      className="w-24 rounded-xl border border-gray-800 bg-black px-3 py-1.5 text-right font-bold text-white focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-300">Plano PRO:</span>
                    <input
                      type="text"
                      value={proPrice}
                      onChange={(e) => setProPrice(e.target.value)}
                      className="w-24 rounded-xl border border-gray-800 bg-black px-3 py-1.5 text-right font-bold text-white focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-300">Plano ELITE:</span>
                    <input
                      type="text"
                      value={elitePrice}
                      onChange={(e) => setElitePrice(e.target.value)}
                      className="w-24 rounded-xl border border-gray-800 bg-black px-3 py-1.5 text-right font-bold text-white focus:border-red-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSavePrices}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition"
                >
                  <Save className="h-4 w-4" />
                  Salvar Preços Dinâmicos
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: MASCOT CONTROL */}
          {activeTab === "mascot" && (
            <div className="space-y-5">
              <div className="flex items-center justify-center p-4 rounded-2xl border border-red-900/30 bg-[#121011]">
                <UnifyMascot
                  size={110}
                  state={activeMascotState as UnifyState}
                  variant={plan}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Testar Estados & Animações do Mascote Unify
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {mascotStates.map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        setActiveMascotState(st);
                        toast.info(`Estado do mascote: ${st}`);
                      }}
                      className={`rounded-xl border px-3 py-2 text-xs font-bold capitalize transition ${
                        activeMascotState === st
                          ? "border-red-500 bg-red-600 text-white"
                          : "border-gray-800 bg-[#121011] text-gray-400 hover:border-gray-700"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NOTIFICATIONS & FEATURE LOCKS */}
          {activeTab === "features" && (
            <div className="space-y-5">
              {/* Notifications sender */}
              <div className="rounded-2xl border border-red-900/30 bg-[#121011] p-4 space-y-3">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <Bell className="h-4 w-4 text-red-500" />
                  Enviar Notificação Push / Promoção
                </h3>
                <textarea
                  value={notificationText}
                  onChange={(e) => setNotificationText(e.target.value)}
                  placeholder="Escreva a notificação para enviar a todos os técnicos..."
                  className="w-full rounded-xl border border-gray-800 bg-black p-3 text-xs text-white placeholder-gray-500 focus:border-red-500 focus:outline-none"
                  rows={3}
                />
                <button
                  onClick={handleSendNotification}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition"
                >
                  <Bell className="h-4 w-4" />
                  Disparar Notificação Dinâmica
                </button>
              </div>

              {/* Feature toggles */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Bloquear / Liberar Recursos por Plano
                </h3>
                <div className="space-y-2">
                  {[
                    "Diagnóstico Inteligente por Imagem & Microscópio",
                    "Acesso aos Esquemas Elétricos & BoardViews",
                    "Simulador de Placa & Osciloscópio",
                    "IA Copiloto em Tempo Real (Voz)",
                    "Base de +1.200.000 Casos de Reparo",
                  ].map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-gray-800 bg-[#121011] p-3 text-xs"
                    >
                      <span className="font-semibold text-gray-200">{feat}</span>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 accent-red-600 rounded cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB X: USERS MANAGEMENT */}
          {activeTab === "users" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Gerenciar Usuários</h3>
                  <p className="text-[11px] text-muted-foreground">Crie contas de teste, veja usuários e bloqueie logins.</p>
                </div>
                <button onClick={fetchUsers} className="rounded-full border border-red-700/60 bg-red-950/40 px-3 py-1 text-[11px] font-semibold text-red-200">Atualizar</button>
              </div>

              <div className="grid gap-3">
                <div className="rounded-2xl border border-red-900/30 bg-[#121011] p-4">
                  <h4 className="text-sm font-bold text-white">Criar usuário de teste</h4>
                  <div className="mt-3 grid gap-2">
                    <input value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="email@example.com" className="rounded-xl border border-gray-800 bg-black px-3 py-2 text-sm text-white" />
                    <input value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} placeholder="senha" className="rounded-xl border border-gray-800 bg-black px-3 py-2 text-sm text-white" />
                    <input value={newUserName} onChange={(e) => setNewUserName(e.target.value)} placeholder="Nome (opcional)" className="rounded-xl border border-gray-800 bg-black px-3 py-2 text-sm text-white" />
                    <div className="flex gap-2">
                      <select value={newUserRole ?? ""} onChange={(e) => setNewUserRole(e.target.value || null)} className="rounded-xl border border-gray-800 bg-black px-3 py-2 text-sm text-white">
                        <option value="">Nenhum</option>
                        <option value="admin">admin</option>
                        <option value="user">user</option>
                      </select>
                      <button onClick={createTestUser} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white">Criar</button>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-red-900/30 bg-[#121011] p-4">
                  <h4 className="text-sm font-bold text-white">Usuários Cadastrados</h4>
                  <div className="mt-3 space-y-2">
                    {loadingUsers ? (
                      <div className="text-sm text-gray-400">Carregando...</div>
                    ) : users.length === 0 ? (
                      <div className="text-sm text-gray-400">Nenhum usuário encontrado.</div>
                    ) : (
                      users.map((u) => (
                        <div key={u.id} className="flex items-center justify-between rounded-xl border border-gray-800 bg-[#0f0d0e] p-3">
                          <div>
                            <div className="text-sm font-bold text-white">{u.display_name ?? u.id}</div>
                            <div className="text-xs text-gray-400">{u.subscription_status} · {u.roles?.join(", ")}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => toggleBlock(u)} className="rounded-full border border-red-700/50 px-3 py-1 text-xs font-semibold text-red-200">{u.subscription_status === 'inactive' ? 'Desbloquear' : 'Bloquear'}</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DYNAMIC CONTENT CREATION */}
          {activeTab === "content" && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                Cadastros Dinâmicos do Sistema
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  "Cadastrar Modelos",
                  "Cadastrar Componentes",
                  "Cadastrar BoardViews",
                  "Cadastrar Esquemas PDF",
                  "Cadastrar Cursos",
                  "Cadastrar Desafios",
                  "Cadastrar Casos de Reparo",
                  "Cadastrar Fornecedores",
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => toast.success(`Formulário de "${item}" aberto!`)}
                    className="flex items-center gap-2 rounded-xl border border-gray-800 bg-[#121011] p-3 text-xs font-bold text-gray-300 hover:border-red-500 hover:text-white transition"
                  >
                    <Plus className="h-4 w-4 text-red-500" />
                    <span>{item}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-red-950/60 p-4 bg-[#121011] text-center">
          <button
            onClick={() => setShowAdminPanel(false)}
            className="w-full rounded-xl bg-gray-800 py-2.5 text-xs font-bold text-white hover:bg-gray-700 transition"
          >
            Fechar Painel Admin
          </button>
        </div>
      </div>
    </div>
  );
}
