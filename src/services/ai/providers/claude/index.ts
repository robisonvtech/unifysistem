/**
 * Anthropic Claude — native Messages API (not OpenAI-compatible).
 * Implements the exact same AIProvider interface.
 */
import { DEFAULT_MODELS } from "../../config";
import {
  AICapabilityError,
  AIProviderError,
  type AICapability,
  type AIContentPart,
  type AIEmbeddingRequest,
  type AIEmbeddingResponse,
  type AIMessage,
  type AIModerationResult,
  type AIProvider,
  type AIRequest,
  type AIResponse,
  type AIStreamEvent,
  type AITranscriptionRequest,
} from "../../types";

const BASE = process.env["CLAUDE_BASE_URL"] ?? "https://api.anthropic.com/v1";

function splitDataUrl(dataUrl: string) {
  const match = /^data:([^;]+);base64,(.*)$/.exec(dataUrl);
  return { mediaType: match?.[1] ?? "image/jpeg", data: match?.[2] ?? "" };
}

function toClaudeContent(content: AIMessage["content"]) {
  if (typeof content === "string") return [{ type: "text", text: content }];
  return content.map((part: AIContentPart) => {
    if (part.type === "text") return { type: "text", text: part.text };
    const { mediaType, data } = splitDataUrl(part.dataUrl);
    if (part.type === "image") {
      return { type: "image", source: { type: "base64", media_type: mediaType, data } };
    }
    return { type: "document", source: { type: "base64", media_type: mediaType, data } };
  });
}

export class ClaudeProvider implements AIProvider {
  readonly id = "claude";
  readonly label = "Anthropic Claude";

  isConfigured() {
    return Boolean(process.env["CLAUDE_API_KEY"] ?? process.env["ANTHROPIC_API_KEY"]);
  }

  capabilities(): AICapability[] {
    return ["chat", "stream", "vision", "pdf", "tools", "json"];
  }

  private key() {
    const key = process.env["CLAUDE_API_KEY"] ?? process.env["ANTHROPIC_API_KEY"];
    if (!key) throw new AIProviderError(this.id, 401, "CLAUDE_API_KEY não configurada.");
    return key;
  }

  private body(req: AIRequest, stream: boolean) {
    const system = req.messages
      .filter((m) => m.role === "system")
      .map((m) => (typeof m.content === "string" ? m.content : ""))
      .join("\n\n");
    return {
      model: req.model ?? DEFAULT_MODELS["claude"]!,
      max_tokens: req.maxTokens ?? 4096,
      temperature: req.temperature,
      system: system || undefined,
      stream,
      messages: req.messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: toClaudeContent(m.content) })),
      tools: req.tools?.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters,
      })),
    };
  }

  private async post(req: AIRequest, stream: boolean) {
    const res = await fetch(`${BASE}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.key(),
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(this.body(req, stream)),
      signal: req.signal ?? null,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new AIProviderError(this.id, res.status, text.slice(0, 400) || res.statusText);
    }
    return res;
  }

  async chat(req: AIRequest): Promise<AIResponse> {
    const started = Date.now();
    const res = await this.post(req, false);
    const json = (await res.json()) as {
      model?: string;
      stop_reason?: string;
      content?: Array<{ type: string; text?: string; id?: string; name?: string; input?: unknown }>;
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    const text = (json.content ?? [])
      .filter((c) => c.type === "text")
      .map((c) => c.text ?? "")
      .join("");
    const toolCalls = (json.content ?? [])
      .filter((c) => c.type === "tool_use")
      .map((c) => ({ id: c.id ?? "", name: c.name ?? "", arguments: JSON.stringify(c.input ?? {}) }));
    return {
      content: text,
      toolCalls: toolCalls.length ? toolCalls : undefined,
      finishReason: json.stop_reason,
      model: json.model ?? DEFAULT_MODELS["claude"]!,
      provider: this.id,
      usage: json.usage
        ? {
            promptTokens: json.usage.input_tokens ?? 0,
            completionTokens: json.usage.output_tokens ?? 0,
            totalTokens: (json.usage.input_tokens ?? 0) + (json.usage.output_tokens ?? 0),
          }
        : undefined,
      latencyMs: Date.now() - started,
    };
  }

  async *stream(req: AIRequest): AsyncGenerator<AIStreamEvent, void, unknown> {
    const started = Date.now();
    const res = await this.post(req, true);
    if (!res.body) throw new AIProviderError(this.id, 500, "Stream vazio.");
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let full = "";
    let usage: AIResponse["usage"];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const raw of lines) {
        const line = raw.trim();
        if (!line.startsWith("data:")) continue;
        try {
          const evt = JSON.parse(line.slice(5).trim()) as {
            type?: string;
            delta?: { text?: string };
            usage?: { input_tokens?: number; output_tokens?: number };
          };
          if (evt.type === "content_block_delta" && evt.delta?.text) {
            full += evt.delta.text;
            yield { type: "delta", text: evt.delta.text };
          }
          if (evt.usage) {
            usage = {
              promptTokens: evt.usage.input_tokens ?? 0,
              completionTokens: evt.usage.output_tokens ?? 0,
              totalTokens: (evt.usage.input_tokens ?? 0) + (evt.usage.output_tokens ?? 0),
            };
          }
        } catch {
          continue;
        }
      }
    }

    yield {
      type: "done",
      response: {
        content: full,
        model: req.model ?? DEFAULT_MODELS["claude"]!,
        provider: this.id,
        usage,
        latencyMs: Date.now() - started,
      },
    };
  }

  vision(req: AIRequest) {
    return this.chat(req);
  }

  async audio(_req: AITranscriptionRequest): Promise<{ text: string }> {
    throw new AICapabilityError(this.id, "audio");
  }

  async embeddings(_req: AIEmbeddingRequest): Promise<AIEmbeddingResponse> {
    throw new AICapabilityError(this.id, "embeddings");
  }

  async moderation(_input: string): Promise<AIModerationResult> {
    throw new AICapabilityError(this.id, "moderation");
  }
}
