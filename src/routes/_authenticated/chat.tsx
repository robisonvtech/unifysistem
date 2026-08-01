import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sendChat } from "@/lib/ai-chat.functions";
import { streamChat, transcribeAudio, fileToDataUrl, ACCEPTED_IMAGE, ACCEPTED_DOC } from "@/services/ai/client";
import { UnifyMascot, type UnifyState } from "@/components/UnifyMascot";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, ImagePlus, X, Wrench, DollarSign, BookOpen, Cpu, Search, Droplets, Zap, Smartphone, Battery, Camera, GraduationCap, Lock, Mic, Square, FileText } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import MarkdownLite from "@/components/MarkdownLite";
import { useEntitlements } from "@/hooks/useEntitlements";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SkillLevel = "auto" | "beginner" | "advanced";
const SKILL_LABEL: Record<SkillLevel, string> = {
  auto: "Auto",
  beginner: "Iniciante",
  advanced: "Avançado",
};

export const Route = createFileRoute("/_authenticated/chat")({
  validateSearch: (s: Record<string, unknown>) => ({
    c: typeof s.c === "string" ? s.c : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Chat — RepairAI" },
      { name: "description", content: "Converse com a Unify: diagnóstico, reparo e avaliação de celulares por IA." },
      { property: "og:title", content: "Chat — RepairAI" },
      { property: "og:description", content: "IA especialista em reparo de celulares." },
    ],
  }),
  component: ChatPage,
});

interface Attachment { type: "image" | "file"; dataUrl: string; filename?: string; mimeType?: string }
interface UIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
}

const QUICK_ACTIONS = [
  { icon: Wrench, label: "Diagnosticar falha", prompt: "Preciso diagnosticar uma falha. Vou descrever os sintomas: " },
  { icon: DollarSign, label: "Avaliar valor", prompt: "Avalie o valor de mercado deste celular para revenda. Modelo: " },
  { icon: BookOpen, label: "Guia de reparo", prompt: "Me passe um guia passo-a-passo de reparo para: " },
  { icon: Cpu, label: "Diagnóstico de placa", prompt: "Preciso de diagnóstico a nível de placa. Sintomas: " },
  { icon: Search, label: "Consultar IMEI", prompt: "Explique como consultar e o que verificar neste IMEI: " },
  { icon: Droplets, label: "Dano por água", prompt: "Aparelho sofreu dano por água. Sintomas atuais: " },
  { icon: Zap, label: "Problemas de carga", prompt: "O aparelho não carrega corretamente. Detalhes: " },
  { icon: Smartphone, label: "Tela / Display", prompt: "Problema de tela/display: " },
  { icon: Battery, label: "Bateria", prompt: "Problema de bateria (saúde/consumo/desliga): " },
  { icon: Camera, label: "Câmera", prompt: "Problema de câmera: " },
];

function ChatPage() {
  const search = Route.useSearch();
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [state, setState] = useState<UnifyState>("idle");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("auto");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const send = useServerFn(sendChat);
  const { canPremium } = useEntitlements();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        const { data: p } = await supabase
          .from("profiles")
          .select("skill_level")
          .eq("id", uid)
          .maybeSingle();
        const lvl = (p?.skill_level as SkillLevel | undefined) ?? "auto";
        if (lvl === "auto" || lvl === "beginner" || lvl === "advanced") setSkillLevel(lvl);
      }
    })();
    textareaRef.current?.focus();
  }, []);

  // Load an existing conversation when navigated with ?c=<id>
  useEffect(() => {
    const cid = search.c;
    if (!cid || cid === conversationId) return;
    (async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, role, content, attachments, created_at")
        .eq("conversation_id", cid)
        .order("created_at", { ascending: true });
      if (error) return toast.error("Não foi possível abrir a conversa.");
      setConversationId(cid);
      setMessages(
        (data ?? []).map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          attachments: Array.isArray(m.attachments) ? (m.attachments as unknown as Attachment[]) : undefined,
        })),
      );
    })();
  }, [search.c, conversationId]);

  async function updateSkill(next: SkillLevel) {
    if (next === "advanced" && !canPremium) {
      toast.error("Modo Avançado é exclusivo Pro (R$ 19,90/mês).");
      return;
    }
    setSkillLevel(next);
    if (!userId) return;
    const { error } = await supabase
      .from("profiles")
      .update({ skill_level: next })
      .eq("id", userId);
    if (error) toast.error("Não foi possível salvar a preferência.");
  }



  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, state]);

  async function ensureConversation(): Promise<string> {
    if (conversationId) return conversationId;
    if (!userId) throw new Error("Sessão expirada.");
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: userId, title: "Nova conversa" })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Falha ao criar conversa.");
    setConversationId(data.id);
    return data.id;
  }

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files).slice(0, 4);
    const results: Attachment[] = [];
    for (const f of arr) {
      const isImage = ACCEPTED_IMAGE.includes(f.type) || f.type.startsWith("image/");
      const isDoc = ACCEPTED_DOC.includes(f.type);
      if (!isImage && !isDoc) { toast.error(`${f.name}: formato não suportado.`); continue; }
      if (f.size > 12 * 1024 * 1024) { toast.error(`${f.name}: arquivo acima de 12MB.`); continue; }
      const dataUrl = await fileToDataUrl(f);
      results.push({ type: isImage ? "image" : "file", dataUrl, filename: f.name, mimeType: f.type });
    }
    setAttachments((prev) => [...prev, ...results].slice(0, 4));
  }

  async function submit() {
    const text = input.trim();
    if (!text && attachments.length === 0) return;
    if (state === "thinking" || state === "typing") return;

    const userMsg: UIMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text || "Analise as imagens.",
      attachments: attachments.length ? [...attachments] : undefined,
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setAttachments([]);
    setState(attachments.length ? "scanning" : "thinking");

    try {
      const convId = await ensureConversation();
      await supabase.from("messages").insert({
        conversation_id: convId,
        user_id: userId!,
        role: "user",
        content: userMsg.content,
        attachments: (userMsg.attachments ?? []) as unknown as never,
      });
      if (nextMessages.length === 1) {
        await supabase.from("conversations").update({ title: text.slice(0, 60) || "Conversa com imagens" }).eq("id", convId);
      }

      setState("typing");
      const turns = nextMessages.map((m) => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments,
      }));

      const assistantId = crypto.randomUUID();
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      let answer = "";
      try {
        answer = await streamChat(
          { messages: turns, skillLevel, conversationId: convId },
          {
            onDelta: (chunk) => {
              answer += chunk;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m)),
              );
            },
            onError: (message) => toast.error(message),
          },
        );
      } catch {
        // Fallback: non-streaming server function
        const result = await send({ data: { messages: turns, skillLevel, conversationId: convId } });
        answer = result.content;
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: answer } : m)));
      }

      if (!answer.trim()) throw new Error("A IA não retornou resposta.");

      await supabase.from("messages").insert({
        conversation_id: convId,
        user_id: userId!,
        role: "assistant",
        content: answer,
      });
      setState("success");
      setTimeout(() => setState("idle"), 1400);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(msg);
      setState("error");
      setTimeout(() => setState("idle"), 1600);
    } finally {
      textareaRef.current?.focus();
    }
  }

  const empty = messages.length === 0;

  return (
    <div className="flex min-h-[calc(100dvh-4.5rem)] flex-col bg-[radial-gradient(circle_at_top,_rgba(191,0,0,0.08),_transparent_48%)]">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/80 bg-background/90 px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl">
        <UnifyMascot size={36} state={state} />
        <div className="flex-1">
          <h1 className="text-sm font-semibold leading-tight">Unify</h1>
          <p className="text-xs text-muted-foreground">
            {state === "thinking" && "Analisando..."}
            {state === "typing" && "Digitando..."}
            {state === "scanning" && "Analisando imagem..."}
            {state === "success" && "Diagnóstico concluído"}
            {state === "error" && "Ocorreu um erro"}
            {(state === "idle" || state === "listening" || state === "learning") && "IA especialista em reparo de celulares"}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-full px-3 text-xs">
              <GraduationCap className="h-3.5 w-3.5" />
              {SKILL_LABEL[skillLevel]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Nível de resposta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={skillLevel} onValueChange={(v) => updateSkill(v as SkillLevel)}>
              <DropdownMenuRadioItem value="auto">
                <div className="flex flex-col">
                  <span className="text-sm">Automático</span>
                  <span className="text-xs text-muted-foreground">Unify detecta seu nível</span>
                </div>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="beginner">
                <div className="flex flex-col">
                  <span className="text-sm">Iniciante</span>
                  <span className="text-xs text-muted-foreground">Linguagem simples, ensinando cada termo</span>
                </div>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="advanced" disabled={!canPremium}>
                <div className="flex flex-1 items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-sm">Avançado</span>
                    <span className="text-xs text-muted-foreground">Placa, tensões, microsolda</span>
                  </div>
                  {!canPremium && <Lock className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />}
                </div>
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>


      {/* Messages */}
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-4">
        {empty ? (
          <div className="flex flex-col items-center rounded-3xl border border-border/70 bg-card/70 p-6 text-center shadow-sm backdrop-blur">
            <UnifyMascot size={120} state="idle" />
            <h2 className="mt-4 text-xl font-bold tracking-tight text-foreground">Como posso te ajudar hoje?</h2>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Descreva o defeito, envie fotos ou áudio — a Unify diagnostica com atenção e linguagem mais humana.
            </p>
            <div className="mt-6 grid w-full grid-cols-2 gap-2 sm:grid-cols-3">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.label}
                  onClick={() => { setInput(a.prompt); textareaRef.current?.focus(); }}
                  className="flex flex-col items-center gap-1.5 rounded-2xl border border-border/70 bg-card/90 p-3 text-xs font-medium transition hover:border-primary/40 hover:bg-accent/40"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                    <a.icon className="h-4 w-4" />
                  </span>
                  <span className="text-center leading-tight">{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} m={m} />)
        )}
        {(state === "thinking" || state === "typing" || state === "scanning") && (
          <div className="flex items-end gap-2 animate-fade-up">
            <UnifyMascot size={32} state={state} aura />
            <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>


      {/* Composer */}
      <div className="sticky bottom-0 border-t border-border/80 bg-background/95 px-3 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.05)] backdrop-blur">
        {attachments.length > 0 && (
          <div className="mb-2 flex gap-2 overflow-x-auto">
            {attachments.map((a, i) => (
              <div key={i} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border">
                <img src={a.dataUrl} alt="anexo" className="h-full w-full object-cover" />
                <button
                  onClick={() => setAttachments((p) => p.filter((_, idx) => idx !== i))}
                  className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => fileRef.current?.click()}
            aria-label="Anexar imagem"
          >
            <ImagePlus className="h-5 w-5" />
          </Button>
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
            }}
            placeholder="Descreva o defeito..."
            rows={1}
            className="max-h-32 min-h-10 resize-none rounded-2xl border border-border/70 bg-muted/60 text-foreground"
          />
          <Button
            type="button"
            size="icon"
            onClick={submit}
            disabled={state === "thinking" || state === "typing" || (!input.trim() && attachments.length === 0)}
            className={cn("shrink-0 rounded-full bg-primary text-primary-foreground shadow-sm")}
            aria-label="Enviar"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ m }: { m: UIMessage }) {
  const isUser = m.role === "user";
  return (
    <div className={cn("flex items-end gap-2 animate-fade-up", isUser ? "justify-end" : "justify-start")}>
      {!isUser && <UnifyMascot size={32} state="idle" />}
      <div
        className={cn(
          "max-w-[84%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
          isUser
            ? "rounded-br-sm bg-[color:var(--chat-user)] text-[color:var(--chat-user-foreground)]"
            : "rounded-bl-sm border border-border/70 bg-card/95 text-foreground",
        )}
      >
        {m.attachments && m.attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {m.attachments.map((a, i) => (
              <img key={i} src={a.dataUrl} alt="" className="h-24 w-24 rounded-lg object-cover" />
            ))}
          </div>
        )}
        {isUser ? <p className="whitespace-pre-wrap break-words">{m.content}</p> : <MarkdownLite content={m.content} />}
      </div>
    </div>
  );
}
