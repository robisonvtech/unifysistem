import { OpenAICompatibleProvider } from "../openai-compatible";
import { DEFAULT_MODELS } from "../../config";

/** Primary provider. */
export class OpenAIProvider extends OpenAICompatibleProvider {
  constructor() {
    super({
      id: "openai",
      label: "OpenAI",
      baseUrl: process.env["OPENAI_BASE_URL"] ?? "https://api.openai.com/v1",
      apiKeyEnv: "OPENAI_API_KEY",
      defaultModel: DEFAULT_MODELS["openai"]!,
      capabilities: [
        "chat",
        "stream",
        "vision",
        "pdf",
        "audio",
        "speech",
        "embeddings",
        "moderation",
        "tools",
        "json",
      ],
      transcriptionModel: process.env["STT_MODEL"] ?? "gpt-4o-mini-transcribe",
      speechModel: process.env["TTS_MODEL"] ?? "gpt-4o-mini-tts",
      embeddingModel: process.env["EMBEDDING_MODEL"] ?? "text-embedding-3-small",
    });
  }
}
