import { OpenAICompatibleProvider } from "../openai-compatible";
import { DEFAULT_MODELS } from "../../config";

/** Secondary provider — access to hundreds of models through one key. */
export class OpenRouterProvider extends OpenAICompatibleProvider {
  constructor() {
    super({
      id: "openrouter",
      label: "OpenRouter",
      baseUrl: process.env["OPENROUTER_BASE_URL"] ?? "https://openrouter.ai/api/v1",
      apiKeyEnv: "OPENROUTER_API_KEY",
      defaultModel: DEFAULT_MODELS["openrouter"]!,
      capabilities: ["chat", "stream", "vision", "pdf", "embeddings", "tools", "json"],
      headers: {
        "HTTP-Referer": process.env["APP_URL"] ?? "https://unifysistem.lovable.app",
        "X-Title": "Unify RepairAI",
      },
    });
  }
}
