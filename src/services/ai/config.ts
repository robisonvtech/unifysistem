/**
 * Central AI configuration — server only.
 * All values come from environment variables so providers can be switched
 * without touching application code.
 */

export interface AIConfig {
  provider: string;
  fallbackProviders: string[];
  model?: string;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
  maxRetries: number;
  contextWindowMessages: number;
  cacheTtlMs: number;
}

function num(value: string | undefined, fallback: number): number {
  const parsed = value === undefined ? NaN : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function readAIConfig(): AIConfig {
  const provider = (process.env["AI_PROVIDER"] ?? "openai").trim().toLowerCase();
  const fallbackRaw = process.env["AI_FALLBACK_PROVIDERS"] ?? "openrouter,gemini,claude,lovable";

  return {
    provider,
    fallbackProviders: fallbackRaw
      .split(",")
      .map((p) => p.trim().toLowerCase())
      .filter((p) => p && p !== provider),
    model: process.env["MODEL_NAME"]?.trim() || undefined,
    temperature: num(process.env["TEMPERATURE"], 0.4),
    maxTokens: num(process.env["MAX_TOKENS"], 4096),
    timeoutMs: num(process.env["AI_TIMEOUT_MS"], 120_000),
    maxRetries: num(process.env["AI_MAX_RETRIES"], 2),
    contextWindowMessages: num(process.env["AI_CONTEXT_MESSAGES"], 24),
    cacheTtlMs: num(process.env["AI_CACHE_TTL_MS"], 60_000),
  };
}

/** Default model per provider when MODEL_NAME is not set. */
export const DEFAULT_MODELS: Record<string, string> = {
  openai: "gpt-4o",
  openrouter: "openai/gpt-4o",
  gemini: "gemini-2.5-pro",
  claude: "claude-sonnet-4-20250514",
  deepseek: "deepseek-chat",
  mistral: "mistral-large-latest",
  groq: "llama-3.3-70b-versatile",
  lovable: "google/gemini-2.5-pro",
};
