/**
 * Streaming chat endpoint (Server-Sent Events).
 * Tokens are pushed to the browser as they are produced.
 */
import { createFileRoute } from "@tanstack/react-router";
import { gatewayStream, checkRateLimit } from "@/services/ai/gateway.server";
import { authenticateRequest } from "@/services/ai/auth.server";
import { containsDangerousRequest, sanitizeUserContent, REFUSAL, type SkillLevel } from "@/services/ai/prompt";
import { extractLongTermFacts } from "@/services/ai/memory";
import type { AIContentPart, AIMessage } from "@/services/ai/types";

interface IncomingAttachment {
  type: "image" | "file";
  dataUrl: string;
  filename?: string;
  mimeType?: string;
}

interface IncomingMessage {
  role: "user" | "assistant";
  content: string;
  attachments?: IncomingAttachment[];
}

function sse(data: unknown) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export const Route = createFileRoute("/api/ai/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await authenticateRequest(request);
        if (!user) return new Response("Unauthorized", { status: 401 });

        let body: { messages?: IncomingMessage[]; skillLevel?: SkillLevel; conversationId?: string; provider?: string; model?: string };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return new Response("Corpo inválido.", { status: 400 });
        }

        const incoming = body.messages;
        if (!Array.isArray(incoming) || incoming.length === 0 || incoming.length > 80) {
          return new Response("Requisição inválida.", { status: 400 });
        }
        for (const m of incoming) {
          if (m.role !== "user" && m.role !== "assistant") return new Response("Papel inválido.", { status: 400 });
          if (typeof m.content !== "string" || m.content.length > 12000) {
            return new Response("Mensagem muito longa.", { status: 400 });
          }
          if (m.attachments && m.attachments.length > 6) return new Response("Máximo de 6 anexos.", { status: 400 });
        }

        try {
          checkRateLimit(`chat:${user.id}`);
        } catch (error) {
          return new Response(error instanceof Error ? error.message : "Rate limit", { status: 429 });
        }

        // Server-side paywall: Advanced mode is Pro/admin only.
        let skill: SkillLevel = body.skillLevel ?? "auto";
        if (skill === "advanced" && !user.isAdmin && !user.isPro) skill = "auto";

        const messages: AIMessage[] = incoming.map((m) => {
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
        const encoder = new TextEncoder();

        const stream = new ReadableStream({
          async start(controller) {
            try {
              for await (const event of gatewayStream(messages, {
                userId: user.id,
                conversationId: body.conversationId ?? null,
                skillLevel: skill,
                longTermMemory: facts.length ? facts.join("\n") : undefined,
                provider: body.provider,
                model: body.model,
              })) {
                if (event.type === "delta") controller.enqueue(encoder.encode(sse({ type: "delta", text: event.text })));
                else if (event.type === "tool_call")
                  controller.enqueue(encoder.encode(sse({ type: "tool_call", toolCall: event.toolCall })));
                else if (event.type === "error")
                  controller.enqueue(encoder.encode(sse({ type: "error", message: event.message })));
                else
                  controller.enqueue(
                    encoder.encode(
                      sse({
                        type: "done",
                        provider: event.response.provider,
                        model: event.response.model,
                        usage: event.response.usage,
                        costUsd: event.response.costUsd,
                        latencyMs: event.response.latencyMs,
                      }),
                    ),
                  );
              }
            } catch (error) {
              controller.enqueue(
                encoder.encode(sse({ type: "error", message: error instanceof Error ? error.message : "Erro na IA." })),
              );
            } finally {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
          },
        });
      },
    },
  },
});
