import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sendChat } from "@/lib/ai-chat.functions";
import { UnifyMascot, type UnifyState } from "@/components/UnifyMascot";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, ImagePlus, X, Wrench, DollarSign, BookOpen, Cpu, Search, Droplets, Zap, Smartphone, Battery, Camera, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import MarkdownLite from "@/components/MarkdownLite";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

interface Attachment { type: "image"; dataUrl: string }
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
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [state, setState] = useState<UnifyState>("idle");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const send = useServerFn(sendChat);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    textareaRef.current?.focus();
  }, []);

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
      if (!f.type.startsWith("image/")) continue;
      if (f.size > 8 * 1024 * 1024) { toast.error(`${f.name}: imagem acima de 8MB.`); continue; }
      const dataUrl = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = () => rej(r.error);
        r.readAsDataURL(f);
      });
      results.push({ type: "image", dataUrl });
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
      const payload = {
        messages: nextMessages.map((m) => ({
          role: m.role,
          content: m.content,
          attachments: m.attachments,
        })),
      };
      const result = await send({ data: payload });

      const assistantMsg: UIMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: result.content,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      await supabase.from("messages").insert({
        conversation_id: convId,
        user_id: userId!,
        role: "assistant",
        content: assistantMsg.content,
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
    <div className="flex min-h-[calc(100dvh-4.5rem)] flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
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
      </header>

      {/* Messages */}
      <div className="flex-1 space-y-4 px-4 py-4">
        {empty ? (
          <div className="flex flex-col items-center pt-6 text-center">
            <UnifyMascot size={120} state="idle" />
            <h2 className="mt-4 text-xl font-bold tracking-tight">Como posso te ajudar hoje?</h2>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Descreva o defeito, envie fotos ou áudio — a Unify diagnostica em segundos.
            </p>
            <div className="mt-6 grid w-full grid-cols-2 gap-2 sm:grid-cols-3">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.label}
                  onClick={() => { setInput(a.prompt); textareaRef.current?.focus(); }}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-3 text-xs font-medium transition hover:border-primary/40 hover:bg-accent/40"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
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
            <UnifyMascot size={32} state={state} />
            <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="sticky bottom-0 border-t border-border bg-background/95 px-3 py-3 backdrop-blur">
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
            className="max-h-32 min-h-10 resize-none rounded-2xl bg-muted/50"
          />
          <Button
            type="button"
            size="icon"
            onClick={submit}
            disabled={state === "thinking" || state === "typing" || (!input.trim() && attachments.length === 0)}
            className={cn("shrink-0 rounded-full")}
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
          "max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "rounded-br-sm bg-[color:var(--chat-user)] text-[color:var(--chat-user-foreground)]"
            : "rounded-bl-sm bg-muted text-foreground",
        )}
      >
        {m.attachments && m.attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {m.attachments.map((a, i) => (
              <img key={i} src={a.dataUrl} alt="" className="h-24 w-24 rounded-lg object-cover" />
            ))}
          </div>
        )}
        {isUser ? <p className="whitespace-pre-wrap">{m.content}</p> : <MarkdownLite content={m.content} />}
      </div>
    </div>
  );
}
