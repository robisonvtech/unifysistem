import { createServerFn } from "@tanstack/react-start";

export const getTracking = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => {
    const t = (d as { token?: string })?.token;
    if (!t || typeof t !== "string" || t.length < 8 || t.length > 128) throw new Error("Token inválido.");
    return { token: t };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rpc, error } = await supabaseAdmin.rpc("get_tracking", { _token: data.token });
    if (error) throw new Error(error.message);
    return { json: JSON.stringify(rpc ?? null) };
  });
