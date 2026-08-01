import { OpenAICompatibleProvider } from "../openai-compatible";
import { DEFAULT_MODELS } from "../../config";

/** Google Gemini through its OpenAI-compatible endpoint. */
export class GeminiProvider extends OpenAICompatibleProvider {
  constructor() {
    super({
      id: "gemini",
      label: "Google Gemini",
      baseUrl:
        process.env["GEMINI_BASE_URL"] ?? "https://generativelanguage.googleapis.com/v1beta/openai",
      apiKeyEnv: "GEMINI_API_KEY",
      defaultModel: DEFAULT_MODELS["gemini"]!,
      capabilities: ["chat", "stream", "vision", "pdf", "embeddings", "tools", "json"],
      embeddingModel: "text-embedding-004",
    });
  }
}
