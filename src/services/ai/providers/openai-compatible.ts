/**
 * Shared implementation for every OpenAI-compatible provider
 * (OpenAI, OpenRouter, Gemini's OpenAI endpoint, DeepSeek, Mistral, Groq, ...).
 *
 * A new provider of this family = ~15 lines (see ./openai/index.ts).
 */
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
  type AISpeechRequest,
} from "../types";

export interface OpenAICompatibleOptions {
  id: string;
  label: string;
  baseUrl: string;
  apiKeyEnv: string;
  defaultModel: string;
  capabilities: AICapability[];
  /** Extra headers (e.g. OpenRouter attribution). */
  headers?: Record<string, string>;
  /** Some gateways use `Lovable-API-Key` instead of `Authorization`. */
  authHeader?: string;
  transcriptionModel?: string;
  speechModel?: string;
  embeddingModel?: string;
  moderationModel?: string;
}

function toProviderContent(content: AIMessage["content"]) {
  if (typeof content === "string") return content;
  return content.map((part: AIContentPart) => {
    if (part.type === "text") return { type: "text", text: part.text };
    if (part.type === "image") return { type: "image_url", image_url: { url: part.dataUrl } };
    return {
      type: "file",
      file: { filename: part.filename, file_data: part.dataUrl },
    };
  });
}

export class OpenAICompatibleProvider implements AIProvider {
  readonly id: string;
  readonly label: string;
  protected opts: OpenAICompatibleOptions;

  constructor(opts: OpenAICompatibleOptions) {
    this.opts = opts;
    this.id = opts.id;
    this.label = opts.label;
  }

  isConfigured() {
    return Boolean(process.env[this.opts.apiKeyEnv]);
  }

  capabilities() {
    return this.opts.capabilities;
  }

  protected apiKey() {
    const key = process.env[this.opts.apiKeyEnv];
    if (!key) throw new AIProviderError(this.id, 401, `${this.opts.apiKeyEnv} não configurada.`);
    return key;
  }

  protected headers(extra?: Record<string, string>) {
    const auth = this.opts.authHeader ?? "Authorization";
    return {
      "Content-Type": "application/json",
      [auth]: auth === "Authorization" ? `Bearer ${this.apiKey()}` : this.apiKey(),
      ...(this.opts.headers ?? {}),
      ...(extra ?? {}),
    };
  }

  protected buildBody(req: AIRequest, stream: boolean) {
    const model = req.model ?? this.opts.defaultModel;
    const body: Record<string, unknown> = {
      model,
      stream,
      messages: req.messages.map((m) => {
        const base: Record<string, unknown> = { role: m.role, content: toProviderContent(m.content) };
        if (m.toolCallId) base["tool_call_id"] = m.toolCallId;
        if (m.name) base["name"] = m.name;
        if (m.toolCalls?.length) {
          base["tool_calls"] = m.toolCalls.map((t) => ({
            id: t.id,
            type: "function",
            function: { name: t.name, arguments: t.arguments },
          }));
        }
        return base;
      }),
    };
    if (typeof req.temperature === "number" && !/^gpt-5/.test(model)) body["temperature"] = req.temperature;
    if (req.maxTokens) {
      body[/^(gpt-5|o[1-4])/.test(model) ? "max_completion_tokens" : "max_tokens"] = req.maxTokens;
    }
    if (req.tools?.length) {
      body["tools"] = req.tools.map((t) => ({
        type: "function",
        function: { name: t.name, description: t.description, parameters: t.parameters },
      }));
      body["tool_choice"] =
        typeof req.toolChoice === "object"
          ? { type: "function", function: { name: req.toolChoice.name } }
          : (req.toolChoice ?? "auto");
    }
    if (req.jsonSchema) {
      body["response_format"] = {
        type: "json_schema",
        json_schema: { name: req.jsonSchema.name, schema: req.jsonSchema.schema, strict: true },
      };
    } else if (req.json) {
      body["response_format"] = { type: "json_object" };
    }
    if (stream) body["stream_options"] = { include_usage: true };
    return body;
  }

  protected async post(path: string, body: unknown, signal?: AbortSignal) {
    const res = await fetch(`${this.opts.baseUrl}${path}`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
      signal: signal ?? null,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new AIProviderError(this.id, res.status, text.slice(0, 400) || res.statusText);
    }
    return res;
  }

  async chat(req: AIRequest): Promise<AIResponse> {
    const started = Date.now();
    const res = await this.post("/chat/completions", this.buildBody(req, false), req.signal);
    const json = (await res.json()) as {
      model?: string;
      choices?: Array<{
        finish_reason?: string;
        message?: {
          content?: string | null;
          tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }>;
        };
      }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    };
    const choice = json.choices?.[0];
    return {
      content: choice?.message?.content ?? "",
      toolCalls: choice?.message?.tool_calls?.map((t) => ({
        id: t.id,
        name: t.function.name,
        arguments: t.function.arguments,
      })),
      finishReason: choice?.finish_reason,
      model: json.model ?? req.model ?? this.opts.defaultModel,
      provider: this.id,
      usage: json.usage
        ? {
            promptTokens: json.usage.prompt_tokens ?? 0,
            completionTokens: json.usage.completion_tokens ?? 0,
            totalTokens: json.usage.total_tokens ?? 0,
          }
        : undefined,
      latencyMs: Date.now() - started,
    };
  }

  async *stream(req: AIRequest): AsyncGenerator<AIStreamEvent, void, unknown> {
    const started = Date.now();
    const res = await this.post("/chat/completions", this.buildBody(req, true), req.signal);
    if (!res.body) throw new AIProviderError(this.id, 500, "Stream vazio.");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let full = "";
    let model = req.model ?? this.opts.defaultModel;
    let usage: AIResponse["usage"];
    let finishReason: string | undefined;
    const toolAcc = new Map<number, { id: string; name: string; arguments: string }>();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const raw of lines) {
        const line = raw.trim();
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") continue;
        let parsed: {
          model?: string;
          choices?: Array<{
            finish_reason?: string;
            delta?: {
              content?: string | null;
              tool_calls?: Array<{
                index: number;
                id?: string;
                function?: { name?: string; arguments?: string };
              }>;
            };
          }>;
          usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
        };
        try {
          parsed = JSON.parse(payload);
        } catch {
          continue;
        }
        if (parsed.model) model = parsed.model;
        if (parsed.usage) {
          usage = {
            promptTokens: parsed.usage.prompt_tokens ?? 0,
            completionTokens: parsed.usage.completion_tokens ?? 0,
            totalTokens: parsed.usage.total_tokens ?? 0,
          };
        }
        const choice = parsed.choices?.[0];
        if (choice?.finish_reason) finishReason = choice.finish_reason;
        const text = choice?.delta?.content;
        if (text) {
          full += text;
          yield { type: "delta", text };
        }
        for (const tc of choice?.delta?.tool_calls ?? []) {
          const cur = toolAcc.get(tc.index) ?? { id: tc.id ?? `tool_${tc.index}`, name: "", arguments: "" };
          if (tc.id) cur.id = tc.id;
          if (tc.function?.name) cur.name += tc.function.name;
          if (tc.function?.arguments) cur.arguments += tc.function.arguments;
          toolAcc.set(tc.index, cur);
        }
      }
    }

    for (const tool of toolAcc.values()) yield { type: "tool_call", toolCall: tool };

    yield {
      type: "done",
      response: {
        content: full,
        toolCalls: toolAcc.size ? Array.from(toolAcc.values()) : undefined,
        finishReason,
        model,
        provider: this.id,
        usage,
        latencyMs: Date.now() - started,
      },
    };
  }

  /** Vision / PDF / OCR share the chat endpoint with multimodal content parts. */
  vision(req: AIRequest) {
    if (!this.capabilities().includes("vision")) throw new AICapabilityError(this.id, "vision");
    return this.chat(req);
  }

  async audio(req: AITranscriptionRequest): Promise<{ text: string }> {
    if (!this.capabilities().includes("audio")) throw new AICapabilityError(this.id, "audio");
    const form = new FormData();
    form.append("file", new Blob([req.data as BlobPart], { type: req.mimeType }), req.filename);
    form.append("model", req.model ?? this.opts.transcriptionModel ?? "whisper-1");
    if (req.language) form.append("language", req.language);

    const auth = this.opts.authHeader ?? "Authorization";
    const res = await fetch(`${this.opts.baseUrl}/audio/transcriptions`, {
      method: "POST",
      headers: {
        [auth]: auth === "Authorization" ? `Bearer ${this.apiKey()}` : this.apiKey(),
        ...(this.opts.headers ?? {}),
      },
      body: form,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new AIProviderError(this.id, res.status, text.slice(0, 300) || res.statusText);
    }
    const json = (await res.json()) as { text?: string };
    return { text: json.text ?? "" };
  }

  async speech(req: AISpeechRequest): Promise<{ audio: ArrayBuffer; mimeType: string }> {
    if (!this.capabilities().includes("speech")) throw new AICapabilityError(this.id, "speech");
    const res = await this.post("/audio/speech", {
      model: req.model ?? this.opts.speechModel ?? "gpt-4o-mini-tts",
      voice: req.voice ?? "alloy",
      input: req.text,
      response_format: req.format ?? "mp3",
    });
    return { audio: await res.arrayBuffer(), mimeType: `audio/${req.format ?? "mp3"}` };
  }

  async embeddings(req: AIEmbeddingRequest): Promise<AIEmbeddingResponse> {
    if (!this.capabilities().includes("embeddings")) throw new AICapabilityError(this.id, "embeddings");
    const model = req.model ?? this.opts.embeddingModel ?? "text-embedding-3-small";
    const res = await this.post("/embeddings", { model, input: req.input, encoding_format: "float" });
    const json = (await res.json()) as {
      data?: Array<{ embedding: number[] }>;
      usage?: { prompt_tokens?: number; total_tokens?: number };
    };
    return {
      embeddings: (json.data ?? []).map((d) => d.embedding),
      model,
      provider: this.id,
      usage: json.usage
        ? {
            promptTokens: json.usage.prompt_tokens ?? 0,
            completionTokens: 0,
            totalTokens: json.usage.total_tokens ?? 0,
          }
        : undefined,
    };
  }

  async moderation(input: string): Promise<AIModerationResult> {
    if (!this.capabilities().includes("moderation")) throw new AICapabilityError(this.id, "moderation");
    const res = await this.post("/moderations", {
      model: this.opts.moderationModel ?? "omni-moderation-latest",
      input,
    });
    const json = (await res.json()) as {
      results?: Array<{ flagged?: boolean; categories?: Record<string, boolean> }>;
    };
    const first = json.results?.[0];
    return { flagged: Boolean(first?.flagged), categories: first?.categories ?? {}, provider: this.id };
  }
}
