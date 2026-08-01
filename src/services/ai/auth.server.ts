/**
 * Bearer-token authentication for the AI HTTP routes (SSE needs raw HTTP,
 * so the server-function middleware is not available here).
 */
import { createClient } from "@supabase/supabase-js";

export interface AuthedUser {
  id: string;
  email: string | null;
  isAdmin: boolean;
  isPro: boolean;
}

export async function authenticateRequest(request: Request): Promise<AuthedUser | null> {
  const header = request.headers.get("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;

  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
  if (!url || !key) return null;

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });

  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [roles, profile] = await Promise.all([
    supabaseAdmin.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin"),
    supabaseAdmin.from("profiles").select("subscription_status").eq("id", data.user.id).maybeSingle(),
  ]);

  return {
    id: data.user.id,
    email: data.user.email ?? null,
    isAdmin: (roles.data ?? []).length > 0,
    isPro: profile.data?.subscription_status === "pro",
  };
}
