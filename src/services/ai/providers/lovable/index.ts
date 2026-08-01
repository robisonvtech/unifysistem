import { OpenAICompatibleProvider } from "../openai-compatible";
import { DEFAULT_MODELS } from "../../config";

/**
 * Emergency fallback only — used when no external provider key is configured
 * yet, so the product keeps working during the migration. Set AI_PROVIDER and
 * the matching key to take it out of the chain.
 */
export class LovableFallbackProvider extends OpenAICompatibleProvider {
  constructor() {
    super({
      id: "lovable",
      label: "Fallback interno",
      baseUrl: "https://ai.gateway.lovable.dev/v1",
      apiKeyEnv: "LOVABLE_API_KEY",
      defaultModel: DEFAULT_MODELS["lovable"]!,
      capabilities: ["chat", "stream", "vision", "pdf", "tools", "json", "embeddings"],
    });
  }
}
