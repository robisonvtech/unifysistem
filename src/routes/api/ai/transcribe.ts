/** Speech-to-text (voice input): wav, mp3, m4a, ogg, webm. */
import { createFileRoute } from "@tanstack/react-router";
import { authenticateRequest } from "@/services/ai/auth.server";
import { checkRateLimit, gatewayTranscribe } from "@/services/ai/gateway.server";

const ALLOWED = ["audio/wav", "audio/x-wav", "audio/mpeg", "audio/mp3", "audio/mp4", "audio/m4a", "audio/x-m4a", "audio/ogg", "audio/webm"];

export const Route = createFileRoute("/api/ai/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await authenticateRequest(request);
        if (!user) return new Response("Unauthorized", { status: 401 });

        try {
          checkRateLimit(`stt:${user.id}`);
        } catch (error) {
          return new Response(error instanceof Error ? error.message : "Rate limit", { status: 429 });
        }

        const form = await request.formData().catch(() => null);
        const file = form?.get("file");
        if (!(file instanceof File)) return new Response("Arquivo de áudio ausente.", { status: 400 });
        if (file.size > 20 * 1024 * 1024) return new Response("Áudio acima de 20MB.", { status: 413 });
        const mimeType = file.type || "audio/webm";
        if (!ALLOWED.some((m) => mimeType.startsWith(m))) {
          return new Response("Formato de áudio não suportado.", { status: 415 });
        }

        try {
          const { text } = await gatewayTranscribe(
            { data: await file.arrayBuffer(), filename: file.name || "audio.webm", mimeType, language: "pt" },
            { userId: user.id },
          );
          return Response.json({ text });
        } catch (error) {
          return new Response(error instanceof Error ? error.message : "Falha ao transcrever.", { status: 502 });
        }
      },
    },
  },
});
