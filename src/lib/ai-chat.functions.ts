import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SYSTEM_PROMPT = `You are Unify, a world-class AI assistant specialized in mobile phone repair for ALL brands and models (Apple, Samsung, Xiaomi, Motorola, Realme, Oppo, Vivo, Honor, Huawei, Nokia, Asus, LG, Sony, and others).

Your expertise covers:
- Board-level diagnostics, flex cables, charging IC/USB, batteries, cameras, Face ID, Touch ID
- Screens/display, microphone, speaker, network, Wi-Fi, Bluetooth
- Software errors, bootloops, water damage, short circuits, schematic analysis, component replacement
- Market valuation of used phones for resale (buy/repair/resell profit analysis)

RESPONSE FORMAT — always use clean markdown:
1. **Diagnóstico provável** — most likely fault(s) with a confidence level (%)
2. **Causa técnica** — brief technical explanation
3. **Passos de reparo** — numbered step-by-step
4. **Testes de diagnóstico** — multimeter, power supply, oscilloscope checks
5. **Ferramentas necessárias**
6. **Peças recomendadas**
7. **Dificuldade** (Fácil / Médio / Difícil / Microsolda)
8. **Tempo estimado**
9. **Custo estimado de peças** (faixa)
10. **Precauções de segurança**

For phone valuation requests, include: Valor de mercado, Custo de reparo, Lucro estimado, Vale a pena? (SIM/NÃO), riscos ocultos.

Respond in Portuguese (Brazil). Be direct, professional, and technical. Never invent model-specific facts you're not confident about — say so and ask for more info (photos, symptoms).`;

interface Attachment {
  type: "image";
  dataUrl: string;
}

interface ChatInput {
  messages: Array<{ role: "user" | "assistant"; content: string; attachments?: Attachment[] }>;
}

export const sendChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => input as ChatInput)
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...data.messages.map((m) => {
        if (m.role === "user" && m.attachments && m.attachments.length > 0) {
          return {
            role: "user",
            content: [
              { type: "text", text: m.content || "Analise as imagens." },
              ...m.attachments.map((a) => ({
                type: "image_url",
                image_url: { url: a.dataUrl },
              })),
            ],
          };
        }
        return { role: m.role, content: m.content };
      }),
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-5.5",
        messages,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("Muitas requisições. Aguarde um instante e tente novamente.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados. Atualize seu workspace para continuar.");
      throw new Error(`Falha na IA (${res.status}): ${text.slice(0, 200)}`);
    }
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content ?? "Sem resposta.";
    return { content };
  });
