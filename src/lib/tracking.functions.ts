import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export const getTracking = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => {
    const t = (d as { token?: string })?.token;
    if (!t || typeof t !== "string" || t.length < 8 || t.length > 128) throw new Error("Token inválido.");
    return { token: t };
  })
  .handler(async ({ data }) => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) throw new Error("Supabase não configurado.");
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const { data: rpc, error } = await client.rpc("get_tracking", { _token: data.token });
    if (error) throw new Error(error.message);
    return { data: rpc as Record<string, unknown> | null };
  });
