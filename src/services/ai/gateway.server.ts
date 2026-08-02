/**
 * AI Gateway — the single entry point the application uses.
 *
 * Handles: provider selection, automatic retry, fallback provider, timeout,
 * rate-limit detection, response caching, context window/memory and analytics.
 */
import { readAIConfig } from "./config";
import { resolveProviderChain } from "./registry";
import { applyContextWindow } from "./memory";
import { buildSystemPrompt, type SkillLevel } from "./prompt";
import { logUsage, usageFromResponse } from "./analytics.server";
import {
  AIProviderError,
  type AIMessage,
  type AIRequest,
  type AIResponse,
  type AIStreamEvent,
  type AITranscriptionRequest,
} from "./types";

export interface GatewayOptions {
  userId?: string | null;
  conversationId?: string | null;
  skillLevel?: SkillLevel;
  longTermMemory?: string;
  provider?: string;
  model?: string;
  tools?: AIRequest["tools"];
  json?: boolean;
  jsonSchema?: AIRequest["jsonSchema"];
  temperature?: number;
  maxTokens?: number;
  /** Skip the master prompt (internal utility calls only). */
  raw?: boolean;
}

/* ------------------------------- rate limit ------------------------------ */

const RATE_LIMIT_MAX = Number(process.env["AI_RATE_LIMIT_PER_MIN"] ?? 20);
const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + 60_000 });
    return;
  }
  bucket.count += 1;
  if (bucket.count > RATE_LIMIT_MAX) {
    throw new AIProviderError("gateway", 429, "Limite de requisições atingido. Aguarde 1 minuto.");
  }
}

/* --------------------------------- cache --------------------------------- */

const responseCache = new Map<string, { at: number; response: AIResponse }>();

function cacheKey(messages: AIMessage[], model?: string) {
  return `${model ?? ""}|${JSON.stringify(messages).slice(0, 4000)}`;
}

/* ------------------------------- composition ------------------------------ */

function prepareMessages(messages: AIMessage[], opts: GatewayOptions): AIMessage[] {
  const config = readAIConfig();
  const conversation = messages.filter((m) => m.role !== "system");
  const { messages: windowed } = applyContextWindow(conversation, config.contextWindowMessages);
  if (opts.raw) return windowed;
  return [
    { role: "system", content: buildSystemPrompt(opts.skillLevel ?? "auto", opts.longTermMemory) },
    ...windowed,
  ];
}

function baseRequest(messages: AIMessage[], opts: GatewayOptions, signal?: AbortSignal): AIRequest {
  const config = readAIConfig();
  return {
    messages,
    model: opts.model ?? config.model,
    temperature: opts.temperature ?? config.temperature,
    maxTokens: opts.maxTokens ?? config.maxTokens,
    tools: opts.tools,
    json: opts.json,
    jsonSchema: opts.jsonSchema,
    signal,
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------ non-streaming ----------------------------- */

export async function gatewayChat(
  messages: AIMessage[],
  opts: GatewayOptions = {},
): Promise<AIResponse> {
  const config = readAIConfig();
  const chain = resolveProviderChain(opts.provider);
  if (chain.length === 0) {
    throw new AIProviderError(
      "gateway",
      503,
      "Nenhum provedor de IA configurado. Defina OPENAI_API_KEY (ou outra chave) e AI_PROVIDER.",
    );
  }

  const prepared = prepareMessages(messages, opts);
  const key = cacheKey(prepared, opts.model ?? config.model);
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.at < config.cacheTtlMs) return cached.response;

  let lastError: unknown;
  for (let index = 0; index < chain.length; index++) {
    const provider = chain[index]!;
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), config.timeoutMs);
      try {
        const response = await provider.chat(baseRequest(prepared, opts, controller.signal));
        clearTimeout(timer);
        const usage = usageFromResponse(response);
        void logUsage({
          userId: opts.userId ?? null,
          conversationId: opts.conversationId ?? null,
          provider: provider.id,
          model: response.model,
          operation: "chat",
          ...usage,
          latencyMs: response.latencyMs,
          status: "success",
          fallbackUsed: index > 0,
        });
        responseCache.set(key, { at: Date.now(), response: { ...response, ...usage } });
        return { ...response, costUsd: usage.costUsd };
      } catch (error) {
        clearTimeout(timer);
        lastError = error;
        const retryable = error instanceof AIProviderError ? error.retryable : true;
        if (retryable && attempt < config.maxRetries) {
          await sleep(400 * 2 ** attempt);
          continue;
        }
        void logUsage({
          userId: opts.userId ?? null,
          conversationId: opts.conversationId ?? null,
          provider: provider.id,
          model: opts.model ?? config.model ?? "unknown",
          operation: "chat",
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          latencyMs: 0,
          status: "error",
          errorMessage: error instanceof Error ? error.message : String(error),
          fallbackUsed: index > 0,
        });
        break; // move to the next provider in the chain
      }
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new AIProviderError("gateway", 500, "Falha em todos os provedores de IA.");
}

/* -------------------------------- streaming ------------------------------- */

export async function* gatewayStream(
  messages: AIMessage[],
  opts: GatewayOptions = {},
): AsyncGenerator<AIStreamEvent, void, unknown> {
  const config = readAIConfig();
  const chain = resolveProviderChain(opts.provider);
  if (chain.length === 0) {
    yield {
      type: "error",
      message: "Nenhum provedor de IA configurado. Defina OPENAI_API_KEY e AI_PROVIDER.",
      code: "no_provider",
    };
    return;
  }

  const prepared = prepareMessages(messages, opts);

  for (let index = 0; index < chain.length; index++) {
    const provider = chain[index]!;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeoutMs);
    let emitted = false;
    try {
      for await (const event of provider.stream(baseRequest(prepared, opts, controller.signal))) {
        if (event.type === "delta") emitted = true;
        if (event.type === "done") {
          const usage = usageFromResponse(event.response);
          void logUsage({
            userId: opts.userId ?? null,
            conversationId: opts.conversationId ?? null,
            provider: provider.id,
            model: event.response.model,
            operation: "stream",
            ...usage,
            latencyMs: event.response.latencyMs,
            status: "success",
            fallbackUsed: index > 0,
          });
          yield { type: "done", response: { ...event.response, costUsd: usage.costUsd } };
          clearTimeout(timer);
          return;
        }
        yield event;
      }
      clearTimeout(timer);
      return;
    } catch (error) {
      clearTimeout(timer);
      const message = error instanceof Error ? error.message : String(error);
      void logUsage({
        userId: opts.userId ?? null,
        conversationId: opts.conversationId ?? null,
        provider: provider.id,
        model: opts.model ?? config.model ?? "unknown",
        operation: "stream",
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        latencyMs: 0,
        status: "error",
        errorMessage: message,
        fallbackUsed: index > 0,
      });
      // If tokens already reached the client we cannot silently switch provider.
      if (emitted || index === chain.length - 1) {
        yield { type: "error", message, code: "provider_error" };
        return;
      }
    }
  }
}

/* ---------------------------------- audio --------------------------------- */

export async function gatewayTranscribe(req: AITranscriptionRequest, opts: GatewayOptions = {}) {
  const chain = resolveProviderChain(opts.provider).filter((p) =>
    p.capabilities().includes("audio"),
  );
  if (chain.length === 0) {
    throw new AIProviderError("gateway", 503, "Nenhum provedor com transcrição de áudio configurado.");
  }
  let lastError: unknown;
  for (const provider of chain) {
    const started = Date.now();
    try {
      const result = await provider.audio(req);
      void logUsage({
        userId: opts.userId ?? null,
        provider: provider.id,
        model: req.model ?? "stt",
        operation: "audio",
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        latencyMs: Date.now() - started,
        status: "success",
      });
      return result;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Falha ao transcrever áudio.");
}

export async function gatewaySpeech(text: string, opts: GatewayOptions = {}) {
  const provider = resolveProviderChain(opts.provider).find(
    (p) => p.capabilities().includes("speech") && typeof p.speech === "function",
  );
  if (!provider?.speech) {
    throw new AIProviderError("gateway", 503, "Nenhum provedor com síntese de voz configurado.");
  }
  return provider.speech({ text });
}
