/**
 * Provider registry + selection.
 *
 * To add a provider: implement `AIProvider`, import it here and add one entry
 * to `FACTORIES`. Nothing else in the application changes.
 */
import { DEFAULT_MODELS, readAIConfig } from "./config";
import { OpenAIProvider } from "./providers/openai";
import { OpenRouterProvider } from "./providers/openrouter";
import { GeminiProvider } from "./providers/gemini";
import { ClaudeProvider } from "./providers/claude";
import { LovableFallbackProvider } from "./providers/lovable";
import { OpenAICompatibleProvider } from "./providers/openai-compatible";
import type { AIProvider } from "./types";

const FACTORIES: Record<string, () => AIProvider> = {
  openai: () => new OpenAIProvider(),
  openrouter: () => new OpenRouterProvider(),
  gemini: () => new GeminiProvider(),
  claude: () => new ClaudeProvider(),
  lovable: () => new LovableFallbackProvider(),
  // Future OpenAI-compatible providers — key-only setup.
  deepseek: () =>
    new OpenAICompatibleProvider({
      id: "deepseek",
      label: "DeepSeek",
      baseUrl: "https://api.deepseek.com/v1",
      apiKeyEnv: "DEEPSEEK_API_KEY",
      defaultModel: DEFAULT_MODELS["deepseek"]!,
      capabilities: ["chat", "stream", "tools", "json"],
    }),
  mistral: () =>
    new OpenAICompatibleProvider({
      id: "mistral",
      label: "Mistral",
      baseUrl: "https://api.mistral.ai/v1",
      apiKeyEnv: "MISTRAL_API_KEY",
      defaultModel: DEFAULT_MODELS["mistral"]!,
      capabilities: ["chat", "stream", "vision", "tools", "json", "embeddings"],
    }),
  groq: () =>
    new OpenAICompatibleProvider({
      id: "groq",
      label: "Groq",
      baseUrl: "https://api.groq.com/openai/v1",
      apiKeyEnv: "GROQ_API_KEY",
      defaultModel: DEFAULT_MODELS["groq"]!,
      capabilities: ["chat", "stream", "audio", "tools", "json"],
      transcriptionModel: "whisper-large-v3",
    }),
};

const cache = new Map<string, AIProvider>();

export function getProvider(id: string): AIProvider | null {
  const key = id.trim().toLowerCase();
  const factory = FACTORIES[key];
  if (!factory) return null;
  let instance = cache.get(key);
  if (!instance) {
    instance = factory();
    cache.set(key, instance);
  }
  return instance;
}

export function listProviders() {
  return Object.keys(FACTORIES).map((id) => {
    const provider = getProvider(id)!;
    return {
      id,
      label: provider.label,
      configured: provider.isConfigured(),
      capabilities: provider.capabilities(),
    };
  });
}

/** Ordered chain: primary provider first, then configured fallbacks. */
export function resolveProviderChain(preferred?: string): AIProvider[] {
  const config = readAIConfig();
  const order = [preferred ?? config.provider, ...config.fallbackProviders];
  const seen = new Set<string>();
  const chain: AIProvider[] = [];
  for (const id of order) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const provider = getProvider(id);
    if (provider?.isConfigured()) chain.push(provider);
  }
  return chain;
}
