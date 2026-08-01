/**
 * AI analytics: token usage, latency, provider, model and estimated cost.
 * Never throws — analytics must not break a conversation.
 */
import type { AIResponse } from "./types";

/** USD per 1M tokens (input, output). Extend freely. */
const PRICING: Record<string, [number, number]> = {
  "gpt-4o": [2.5, 10],
  "gpt-4o-mini": [0.15, 0.6],
  "gpt-4.1": [2, 8],
  "gpt-4.1-mini": [0.4, 1.6],
  "gemini-2.5-pro": [1.25, 10],
  "gemini-2.5-flash": [0.3, 2.5],
  "claude-sonnet-4-20250514": [3, 15],
  "deepseek-chat": [0.27, 1.1],
};

export function estimateCostUsd(model: string, promptTokens: number, completionTokens: number) {
  const key = Object.keys(PRICING).find((m) => model.includes(m));
  if (!key) return undefined;
  const [inPrice, outPrice] = PRICING[key]!;
  return (promptTokens / 1_000_000) * inPrice + (completionTokens / 1_000_000) * outPrice;
}

export interface AIUsageRecord {
  userId: string | null;
  conversationId?: string | null;
  provider: string;
  model: string;
  operation: "chat" | "stream" | "vision" | "audio" | "speech" | "embeddings" | "moderation";
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  costUsd?: number;
  status: "success" | "error";
  errorMessage?: string;
  fallbackUsed?: boolean;
}

export async function logUsage(record: AIUsageRecord) {
  try {
    console.info(
      `[ai] ${record.operation} provider=${record.provider} model=${record.model} tokens=${record.totalTokens} latency=${record.latencyMs}ms cost=${record.costUsd?.toFixed(6) ?? "n/a"} status=${record.status}`,
    );
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const table = (
      supabaseAdmin as unknown as {
        from: (name: string) => { insert: (row: Record<string, unknown>) => Promise<{ error: unknown }> };
      }
    ).from("ai_usage_logs");
    await table.insert({
      user_id: record.userId,
      conversation_id: record.conversationId ?? null,
      provider: record.provider,
      model: record.model,
      operation: record.operation,
      prompt_tokens: record.promptTokens,
      completion_tokens: record.completionTokens,
      total_tokens: record.totalTokens,
      latency_ms: record.latencyMs,
      cost_usd: record.costUsd ?? null,
      status: record.status,
      error_message: record.errorMessage ?? null,
      fallback_used: record.fallbackUsed ?? false,
    });
  } catch (error) {
    console.warn("[ai] analytics falhou:", error instanceof Error ? error.message : error);
  }
}

export function usageFromResponse(res: AIResponse) {
  const promptTokens = res.usage?.promptTokens ?? 0;
  const completionTokens = res.usage?.completionTokens ?? 0;
  return {
    promptTokens,
    completionTokens,
    totalTokens: res.usage?.totalTokens ?? promptTokens + completionTokens,
    costUsd: estimateCostUsd(res.model, promptTokens, completionTokens),
  };
}
