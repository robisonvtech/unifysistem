/**
 * Conversation memory: context window trimming, rolling summaries and
 * long-term memory extraction.
 */
import type { AIMessage } from "./types";

/** Rough token estimate (~4 chars/token) without a tokenizer dependency. */
export function estimateTokens(messages: AIMessage[]): number {
  let chars = 0;
  for (const m of messages) {
    if (typeof m.content === "string") chars += m.content.length;
    else
      for (const part of m.content) {
        if (part.type === "text") chars += part.text.length;
        else chars += 1200; // image/file placeholder cost
      }
  }
  return Math.ceil(chars / 4);
}

/**
 * Keeps the newest `maxMessages` turns; older turns are condensed into a
 * single summary message so the conversation never overflows the window.
 */
export function applyContextWindow(
  messages: AIMessage[],
  maxMessages: number,
  previousSummary?: string,
): { messages: AIMessage[]; overflow: AIMessage[] } {
  if (messages.length <= maxMessages) {
    if (!previousSummary) return { messages, overflow: [] };
    return {
      messages: [
        { role: "system", content: `Resumo da conversa anterior:\n${previousSummary}` },
        ...messages,
      ],
      overflow: [],
    };
  }
  const overflow = messages.slice(0, messages.length - maxMessages);
  const recent = messages.slice(messages.length - maxMessages);
  const condensed = summarizeLocally(overflow, previousSummary);
  return {
    messages: [{ role: "system", content: `Resumo da conversa anterior:\n${condensed}` }, ...recent],
    overflow,
  };
}

/** Cheap deterministic summary used as fallback / seed for the model summary. */
export function summarizeLocally(messages: AIMessage[], previousSummary?: string): string {
  const lines = messages.map((m) => {
    const text =
      typeof m.content === "string"
        ? m.content
        : m.content.map((p) => (p.type === "text" ? p.text : `[${p.type}]`)).join(" ");
    return `- ${m.role === "user" ? "Usuário" : "Unify"}: ${text.replace(/\s+/g, " ").slice(0, 220)}`;
  });
  return [previousSummary, ...lines].filter(Boolean).join("\n").slice(0, 4000);
}

/**
 * Long-term memory: durable facts worth carrying across conversations
 * (device models, recurring symptoms, tools the technician owns).
 */
export function extractLongTermFacts(messages: AIMessage[]): string[] {
  const facts = new Set<string>();
  const deviceRe =
    /\b(iphone|galaxy|redmi|poco|moto\s?g|moto\s?e|realme|xiaomi|samsung|motorola|oppo|vivo|honor|huawei|asus|zenfone|nokia|lg|sony)\s?[\w\d\s+]{0,14}/gi;
  for (const m of messages) {
    if (m.role !== "user") continue;
    const text = typeof m.content === "string" ? m.content : m.content.map((p) => (p.type === "text" ? p.text : "")).join(" ");
    for (const match of text.match(deviceRe) ?? []) facts.add(`Aparelho citado: ${match.trim()}`);
  }
  return Array.from(facts).slice(0, 20);
}
