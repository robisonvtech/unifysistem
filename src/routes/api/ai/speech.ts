/** Text-to-speech: returns audio for the given text. */
import { createFileRoute } from "@tanstack/react-router";
import { authenticateRequest } from "@/services/ai/auth.server";
import { checkRateLimit, gatewaySpeech } from "@/services/ai/gateway.server";

export const Route = createFileRoute("/api/ai/speech")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await authenticateRequest(request);
        if (!user) return new Response("Unauthorized", { status: 401 });

        try {
          checkRateLimit(`tts:${user.id}`);
        } catch (error) {
          return new Response(error instanceof Error ? error.message : "Rate limit", { status: 429 });
        }

        const body = (await request.json().catch(() => null)) as { text?: string } | null;
        const text = body?.text?.trim();
        if (!text) return new Response("Texto ausente.", { status: 400 });
        if (text.length > 4000) return new Response("Texto muito longo.", { status: 413 });

        try {
          const { audio, mimeType } = await gatewaySpeech(text, { userId: user.id });
          return new Response(audio, { headers: { "Content-Type": mimeType, "Cache-Control": "no-store" } });
        } catch (error) {
          return new Response(error instanceof Error ? error.message : "Falha ao gerar áudio.", { status: 502 });
        }
      },
    },
  },
});
