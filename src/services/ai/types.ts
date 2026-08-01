/**
 * Core contracts of the Unify AI Gateway.
 *
 * Any new provider only needs to implement `AIProvider` and register itself in
 * `src/services/ai/registry.ts` — no application code changes required.
 */

export type AIRole = "system" | "user" | "assistant" | "tool";

export type AIContentPart =
  | { type: "text"; text: string }
  | { type: "image"; dataUrl: string; mimeType?: string }
  | { type: "file"; filename: string; dataUrl: string; mimeType?: string };

export interface AIMessage {
  role: AIRole;
  /** Plain text, or multimodal parts (images / pdf / files). */
  content: string | AIContentPart[];
  name?: string;
  toolCallId?: string;
  toolCalls?: AIToolCall[];
}

export interface AIToolDefinition {
  name: string;
  description: string;
  /** JSON Schema (keep it flat and constraint-free). */
  parameters: Record<string, unknown>;
}

export interface AIToolCall {
  id: string;
  name: string;
  arguments: string;
}

export interface AIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AIRequest {
  messages: AIMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  /** Function / tool calling. */
  tools?: AIToolDefinition[];
  toolChoice?: "auto" | "none" | { name: string };
  /** JSON mode — force a valid JSON object response. */
  json?: boolean;
  jsonSchema?: { name: string; schema: Record<string, unknown> };
  signal?: AbortSignal;
}

export interface AIResponse {
  content: string;
  toolCalls?: AIToolCall[];
  finishReason?: string;
  model: string;
  provider: string;
  usage?: AIUsage;
  latencyMs: number;
  costUsd?: number;
}

export type AIStreamEvent =
  | { type: "delta"; text: string }
  | { type: "tool_call"; toolCall: AIToolCall }
  | { type: "done"; response: AIResponse }
  | { type: "error"; message: string; code?: string };

export interface AITranscriptionRequest {
  /** Raw audio bytes (wav, mp3, m4a, ogg, webm). */
  data: ArrayBuffer | Uint8Array;
  filename: string;
  mimeType: string;
  language?: string;
  model?: string;
}

export interface AISpeechRequest {
  text: string;
  voice?: string;
  model?: string;
  format?: "mp3" | "wav" | "opus";
}

export interface AIEmbeddingRequest {
  input: string | string[];
  model?: string;
}

export interface AIEmbeddingResponse {
  embeddings: number[][];
  model: string;
  provider: string;
  usage?: AIUsage;
}

export interface AIModerationResult {
  flagged: boolean;
  categories: Record<string, boolean>;
  provider: string;
}

/**
 * Every provider implements exactly this surface.
 * Unsupported capabilities must throw `AICapabilityError`.
 */
export interface AIProvider {
  readonly id: string;
  readonly label: string;
  /** True when the required environment variables are present. */
  isConfigured(): boolean;
  capabilities(): AICapability[];

  chat(req: AIRequest): Promise<AIResponse>;
  stream(req: AIRequest): AsyncGenerator<AIStreamEvent, void, unknown>;
  vision(req: AIRequest): Promise<AIResponse>;
  audio(req: AITranscriptionRequest): Promise<{ text: string }>;
  speech?(req: AISpeechRequest): Promise<{ audio: ArrayBuffer; mimeType: string }>;
  embeddings(req: AIEmbeddingRequest): Promise<AIEmbeddingResponse>;
  moderation(input: string): Promise<AIModerationResult>;
}

export type AICapability =
  | "chat"
  | "stream"
  | "vision"
  | "pdf"
  | "audio"
  | "speech"
  | "embeddings"
  | "moderation"
  | "tools"
  | "json";

export class AICapabilityError extends Error {
  constructor(provider: string, capability: AICapability) {
    super(`O provedor "${provider}" não suporta "${capability}".`);
    this.name = "AICapabilityError";
  }
}

export class AIProviderError extends Error {
  status: number;
  retryable: boolean;
  provider: string;
  constructor(provider: string, status: number, message: string) {
    super(message);
    this.name = "AIProviderError";
    this.provider = provider;
    this.status = status;
    this.retryable = status === 408 || status === 409 || status === 429 || status >= 500;
  }
}
