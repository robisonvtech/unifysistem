/**
 * Client-side helpers for the AI gateway: SSE streaming, voice input,
 * offline queue and attachment handling.
 */
import { supabase } from "@/integrations/supabase/client";

export interface ChatAttachment {
  type: "image" | "file";
  dataUrl: string;
  filename?: string;
  mimeType?: string;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
  attachments?: ChatAttachment[];
}

export interface StreamMeta {
  provider?: string;
  model?: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  costUsd?: number;
  latencyMs?: number;
}

async function authHeader(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sessão expirada. Entre novamente.");
  return `Bearer ${token}`;
}

/** Streams the assistant answer token by token via Server-Sent Events. */
export async function streamChat(
  payload: {
    messages: ChatTurn[];
    skillLevel?: "auto" | "beginner" | "advanced";
    conversationId?: string | null;
    provider?: string;
    model?: string;
  },
  handlers: {
    onDelta: (text: string) => void;
    onDone?: (meta: StreamMeta) => void;
    onError?: (message: string) => void;
    signal?: AbortSignal;
  },
): Promise<string> {
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: await authHeader() },
    body: JSON.stringify(payload),
    signal: handlers.signal ?? null,
  });

  if (!res.ok || !res.body) {
    const message = (await res.text().catch(() => "")) || "Falha ao contatar a IA.";
    throw new Error(message);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const raw of lines) {
      const line = raw.trim();
      if (!line.startsWith("data:")) continue;
      const payloadText = line.slice(5).trim();
      if (payloadText === "[DONE]") continue;
      try {
        const event = JSON.parse(payloadText) as
          | { type: "delta"; text: string }
          | { type: "error"; message: string }
          | ({ type: "done" } & StreamMeta)
          | { type: "tool_call"; toolCall: unknown };
        if (event.type === "delta") {
          full += event.text;
          handlers.onDelta(event.text);
        } else if (event.type === "error") {
          handlers.onError?.(event.message);
        } else if (event.type === "done") {
          handlers.onDone?.(event);
        }
      } catch {
        continue;
      }
    }
  }

  return full;
}

/** Sends recorded audio for transcription (voice input). */
export async function transcribeAudio(blob: Blob, filename = "audio.webm"): Promise<string> {
  const form = new FormData();
  form.append("file", blob, filename);
  const res = await fetch("/api/ai/transcribe", {
    method: "POST",
    headers: { Authorization: await authHeader() },
    body: form,
  });
  if (!res.ok) throw new Error((await res.text().catch(() => "")) || "Falha ao transcrever o áudio.");
  const json = (await res.json()) as { text?: string };
  return json.text ?? "";
}

/* ------------------------------ offline queue ----------------------------- */

const QUEUE_KEY = "unify_ai_offline_queue";

export function queueOfflineMessage(entry: { conversationId: string | null; turn: ChatTurn }) {
  if (typeof window === "undefined") return;
  const current = readOfflineQueue();
  current.push({ ...entry, at: Date.now() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(current.slice(-30)));
}

export function readOfflineQueue(): Array<{ conversationId: string | null; turn: ChatTurn; at: number }> {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]") as Array<{
      conversationId: string | null;
      turn: ChatTurn;
      at: number;
    }>;
  } catch {
    return [];
  }
}

export function clearOfflineQueue() {
  if (typeof window !== "undefined") localStorage.removeItem(QUEUE_KEY);
}

/* ------------------------------- attachments ------------------------------ */

export const ACCEPTED_IMAGE = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"];
export const ACCEPTED_DOC = ["application/pdf"];

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
