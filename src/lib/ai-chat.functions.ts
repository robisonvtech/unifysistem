import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AIContentPart, AIMessage } from "@/services/ai/types";
import { containsDangerousRequest, sanitizeUserContent, REFUSAL, type SkillLevel } from "@/services/ai/prompt";

interface Attachment {
  type: "image" | "file";
  dataUrl: string;
  filename?: string;
  mimeType?: string;
}

interface ChatInput {
  messages: Array<{ role: "user" | "assistant"; content: string; attachments?: Attachment[] }>;
  skillLevel?: SkillLevel;
  conversationId?: string;
  provider?: string;
  model?: string;
}

/**
 * Non-streaming chat (used as fallback and by the offline queue).
 * The streaming path lives in /api/ai/chat.
 */
export const sendChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const d = input as ChatInput;
    if (!d || !Array.isArray(d.messages)) throw new Error("Requisição inválida.");
    if (d.messages.length === 0 || d.messages.length > 80) throw new Error("Conversa muito longa.");
    for (const m of d.messages) {
      if (m.role !== "user" && m.role !== "assistant") throw new Error("Papel inválido.");
      if (typeof m.content !== "string" || m.content.length > 12000) throw new Error("Mensagem muito longa.");
      if (m.attachments && m.attachments.length > 6) throw new Error("Máximo de 6 anexos.");
    }
    const skill = d.skillLevel ?? "auto";
    if (!["auto", "beginner", "advanced"].includes(skill)) throw new Error("Nível inválido.");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { gatewayChat, checkRateLimit } = await import("@/services/ai/gateway.server");
    const { extractLongTermFacts } = await import("@/services/ai/memory");

    const { supabase, userId } = context;
    checkRateLimit(`chat:${userId}`);

    let skill: SkillLevel = data.skillLevel ?? "auto";
    if (skill === "advanced") {
      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin"),
        supabase.from("profiles").select("subscription_status").eq("id", userId).maybeSingle(),
      ]);
      const isAdmin = (roles ?? []).length > 0;
      const isPro = profile?.subscription_status === "pro";
      if (!isAdmin && !isPro) skill = "auto";
    }

    const messages: AIMessage[] = data.messages.map((m) => {
      if (m.role !== "user") return { role: "assistant", content: m.content };
      const safe = sanitizeUserContent(m.content);
      const text = containsDangerousRequest(safe) ? REFUSAL : safe;
      if (m.attachments?.length) {
        const parts: AIContentPart[] = [
          { type: "text", text: text || "Analise os anexos e me diga o que você vê." },
          ...m.attachments.map((a): AIContentPart =>
            a.type === "image"
              ? { type: "image", dataUrl: a.dataUrl, mimeType: a.mimeType }
              : { type: "file", filename: a.filename ?? "documento.pdf", dataUrl: a.dataUrl, mimeType: a.mimeType },
          ),
        ];
        return { role: "user", content: parts };
      }
      return { role: "user", content: text };
    });

    const facts = extractLongTermFacts(messages);
    const response = await gatewayChat(messages, {
      userId,
      conversationId: data.conversationId ?? null,
      skillLevel: skill,
      longTermMemory: facts.length ? facts.join("\n") : undefined,
      provider: data.provider,
      model: data.model,
    });

    return {
      content: response.content || "Sem resposta.",
      provider: response.provider,
      model: response.model,
      usage: response.usage ?? null,
      costUsd: response.costUsd ?? null,
      latencyMs: response.latencyMs,
    };
  });
